/**
 * Where a quote sits on its page (step 3a.3): the rectangles the web draws over the PDF when someone clicks a value.
 * The worker computes them when it publishes (they are stored with the field), with the same tolerance as the check that
 * found the quote: words compared without case, accents, punctuation or the hyphen of a word split over two lines, and a
 * near-match (≥ 90% of the words) when the AI copied a word wrong. A quote that cannot be placed gives null: the web then
 * shows the page and says so, it never guesses.
 *
 * Positions are in PDF user space (points, origin at the bottom left), so the viewer converts them with its own viewport.
 */
import { getDocumentProxy } from "unpdf";
import { normaliseForMatch } from "../verify/normalize.js";
import { FUZZY_THRESHOLD, tokenEditDistance } from "../verify/quote.js";
import { findGutter } from "./text-layer.js";

/** x0, y0, x1, y1. */
export type Rect = [number, number, number, number];

export interface Highlight {
  /** 1-based page of the PDF file where the quote was found (the cited page or its neighbour). */
  page: number;
  rects: Rect[];
}

type Direction = "none" | "up" | "down";

export interface PageItem {
  str: string;
  rect: Rect;
  /** Text turned a quarter circle (a sideways table): it reads upwards or downwards. */
  dir: Direction;
  size: number;
}

export interface PageItems {
  width: number;
  height: number;
  items: PageItem[];
}

const ASCENT = 0.8;
const DESCENT = 0.22;

/** The text items of every page with their rectangles. */
export async function readPageItems(bytes: Uint8Array): Promise<PageItems[]> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const pages: PageItems[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const { width, height } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: PageItem[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const [a = 1, b = 0, c = 0, d = 0, e = 0, f = 0] = item.transform;
      const w = item.width;
      if (Math.abs(b) <= 1e-3 && Math.abs(c) <= 1e-3 && a > 0) {
        const size = Math.abs(d) || item.height || 0;
        items.push({ str: item.str, rect: [e, f - DESCENT * size, e + w, f + ASCENT * size], dir: "none", size });
      } else if (Math.abs(a) < 1e-3 && Math.abs(d) < 1e-3 && b > 0 && c < 0) {
        const size = Math.abs(c); // reads upwards, the top of the letters points left
        items.push({ str: item.str, rect: [e - ASCENT * size, f, e + DESCENT * size, f + w], dir: "up", size });
      } else if (Math.abs(a) < 1e-3 && Math.abs(d) < 1e-3 && b < 0 && c > 0) {
        const size = Math.abs(c); // reads downwards, the top of the letters points right
        items.push({ str: item.str, rect: [e - DESCENT * size, f - w, e + ASCENT * size, f], dir: "down", size });
      }
    }
    pages.push({ width, height, items });
  }
  return pages;
}

interface Word {
  raw: string;
  rects: Rect[];
  dir: Direction;
  size: number;
}

/** The words of an item, each with its share of the item's rectangle (the PDF gives one box per run of text). */
function wordsOf(item: PageItem): Word[] {
  const out: Word[] = [];
  const total = item.str.length;
  for (const m of item.str.matchAll(/\S+/g)) {
    const from = m.index / total;
    const to = (m.index + m[0].length) / total;
    const [x0, y0, x1, y1] = item.rect;
    const rect: Rect =
      item.dir === "none"
        ? [x0 + (x1 - x0) * from, y0, x0 + (x1 - x0) * to, y1]
        : item.dir === "up"
          ? [x0, y0 + (y1 - y0) * from, x1, y0 + (y1 - y0) * to]
          : [x0, y1 - (y1 - y0) * to, x1, y1 - (y1 - y0) * from];
    out.push({ raw: m[0], rects: [rect], dir: item.dir, size: item.size });
  }
  return out;
}

/** The next item continues the previous one without a space: "one" "’" "s" is one word. */
function touching(prev: PageItem, cur: PageItem): boolean {
  if (prev.dir !== cur.dir || /\s$/.test(prev.str) || /^\s/.test(cur.str)) return false;
  const reach = 0.3 * Math.max(cur.size, 1);
  const centreX = (r: Rect) => (r[0] + r[2]) / 2;
  if (cur.dir === "none") return Math.abs(centreY(prev.rect) - centreY(cur.rect)) < 0.5 * Math.max(prev.size, cur.size) && cur.rect[0] - prev.rect[2] < reach && cur.rect[0] - prev.rect[2] > -reach;
  const gap = cur.dir === "up" ? cur.rect[1] - prev.rect[3] : prev.rect[1] - cur.rect[3];
  return Math.abs(centreX(prev.rect) - centreX(cur.rect)) < 0.5 * Math.max(prev.size, cur.size) && gap < reach && gap > -reach;
}

/** The words of a run of items in the order given; items that touch are joined into one word. */
function wordsOfItems(items: PageItem[], join: boolean): Word[] {
  const out: Word[] = [];
  let prev: PageItem | null = null;
  for (const item of items) {
    const words = wordsOf(item);
    if (join && prev && words.length > 0 && out.length > 0 && !/^\s/.test(item.str) && touching(prev, item)) {
      const [first, ...rest] = words;
      const last = out.at(-1)!;
      last.raw += first!.raw;
      last.rects.push(...first!.rects);
      out.push(...rest);
    } else out.push(...words);
    prev = item;
  }
  return out;
}

/** Joins a word split over two lines: "experi-" "ence", and "gratifica" "-" "tions" (a lone hyphen). */
function joinHyphens(words: Word[]): Word[] {
  const out: Word[] = [];
  for (const w of words) {
    const last = out.at(-1);
    if (w.raw === "-" && last && /\p{L}$/u.test(last.raw)) {
      last.raw += "-";
      last.rects.push(...w.rects);
      continue;
    }
    if (last && /\p{L}-$/u.test(last.raw) && /^\p{Ll}/u.test(w.raw)) {
      last.raw = last.raw.slice(0, -1) + w.raw;
      last.rects.push(...w.rects);
      continue;
    }
    out.push({ ...w, rects: [...w.rects] });
  }
  return out;
}

interface Token {
  key: string;
  rects: Rect[];
  dir: Direction;
  size: number;
}

/** What two words are compared by: no case, accents, punctuation or hyphen. */
const keyOf = (word: string) => normaliseForMatch(word).replace(/[^\p{L}\p{N}]+/gu, "");

function toTokens(words: Word[]): Token[] {
  return joinHyphens(words)
    .map((w) => ({ key: keyOf(w.raw), rects: w.rects, dir: w.dir, size: w.size }))
    .filter((t) => t.key !== "");
}

const centreY = (r: Rect) => (r[1] + r[3]) / 2;

/** Items row by row: top to bottom, left to right within a row. Turned items are left out. */
function rowOrder(items: PageItem[]): PageItem[] {
  const upright = items.filter((i) => i.dir === "none").sort((a, b) => centreY(b.rect) - centreY(a.rect) || a.rect[0] - b.rect[0]);
  const rows: PageItem[][] = [];
  for (const item of upright) {
    const row = rows.at(-1);
    if (row && Math.abs(centreY(row[0]!.rect) - centreY(item.rect)) <= 0.5 * Math.max(item.size, 1)) row.push(item);
    else rows.push([item]);
  }
  return rows.flatMap((r) => r.sort((a, b) => a.rect[0] - b.rect[0]));
}

/** The ways to read a page: the order the PDF stores the text, row by row, and column by column on a two-column page. */
function readings(page: PageItems): Token[][] {
  const orders: PageItem[][] = [page.items, rowOrder(page.items)];
  const upright = page.items.filter((i) => i.dir === "none");
  const gutter = findGutter(upright.map((i) => ({ x0: i.rect[0], x1: i.rect[2], y: i.rect[1] })), page.width);
  if (gutter !== null) {
    const left = upright.filter((i) => (i.rect[0] + i.rect[2]) / 2 < gutter);
    const right = upright.filter((i) => (i.rect[0] + i.rect[2]) / 2 >= gutter);
    orders.push([...rowOrder(left), ...rowOrder(right)]);
  }
  // Each order twice: pieces kept apart (table cells) and touching pieces joined ("one" "’" "s").
  return orders.flatMap((items) => [toTokens(wordsOfItems(items, false)), toTokens(wordsOfItems(items, true))]);
}

interface Found {
  start: number;
  length: number;
  score: number;
}

function exact(tokens: Token[], q: string[]): Found | null {
  for (let i = 0; i + q.length <= tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < q.length && ok; j++) ok = tokens[i + j]!.key === q[j];
    if (ok) return { start: i, length: q.length, score: 1 };
  }
  return null;
}

/** The quote's words run together against the page's words run together, on word boundaries: differences in spacing only ("p rofessional"). */
function spaceless(tokens: Token[], q: string[]): Found | null {
  const target = q.join("");
  if (target.length < 6) return null;
  const starts: number[] = [];
  let text = "";
  for (const t of tokens) {
    starts.push(text.length);
    text += t.key;
  }
  for (let at = text.indexOf(target); at >= 0; at = text.indexOf(target, at + 1)) {
    const first = starts.indexOf(at);
    const end = at + target.length;
    const last = starts.findIndex((st, i) => st + tokens[i]!.key.length === end);
    if (first >= 0 && last >= first) return { start: first, length: last - first + 1, score: 1 };
  }
  return null;
}

/** The window of nearly the same length with the most words in common, when it reaches the check's threshold. */
function fuzzy(tokens: Token[], q: string[]): Found | null {
  if (q.length < 4) return null;
  const words = new Set(q);
  const slack = Math.max(1, Math.ceil(q.length * 0.1));
  let best: Found | null = null;
  for (let start = 0; start < tokens.length; start++) {
    if (!words.has(tokens[start]!.key)) continue;
    for (let length = q.length - slack; length <= q.length + slack; length++) {
      if (length <= 0 || start + length > tokens.length) continue;
      const window = tokens.slice(start, start + length).map((t) => t.key);
      const score = 1 - tokenEditDistance(q, window) / Math.max(q.length, length);
      if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) best = { start, length, score };
    }
  }
  return best;
}

const union = (a: Rect, b: Rect): Rect => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];

/** One rectangle per line of the quote: neighbouring words on the same line are merged. */
function lines(tokens: Token[]): Rect[] {
  const rects: { rect: Rect; dir: Direction; size: number }[] = [];
  for (const t of tokens) {
    for (const r of t.rects) {
      const last = rects.at(-1);
      // Same line = same height (or same column when turned) and moving on: the cells of a table row are one box.
      const sameLine =
        last &&
        last.dir === t.dir &&
        (t.dir === "none"
          ? Math.abs(centreY(last.rect) - centreY(r)) < 0.6 * t.size && r[0] >= last.rect[0]
          : Math.abs((last.rect[0] + last.rect[2]) / 2 - (r[0] + r[2]) / 2) < 0.6 * t.size && (t.dir === "up" ? r[1] >= last.rect[1] : r[3] <= last.rect[3]));
      if (sameLine) last.rect = union(last.rect, r);
      else rects.push({ rect: [...r], dir: t.dir, size: t.size });
    }
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return rects.map(({ rect }) => [round(rect[0]), round(rect[1]), round(rect[2]), round(rect[3])] as Rect);
}

/** The rectangles of the quote on one page, or null. An exact match in any reading wins over a near match. */
export function locateOnPage(page: PageItems, quote: string): Rect[] | null {
  const q = toTokens(quote.split(/\s+/).filter(Boolean).map((raw) => ({ raw, rects: [[0, 0, 0, 0] as Rect], dir: "none" as Direction, size: 0 }))).map((t) => t.key);
  if (q.length === 0) return null;
  let best: { tokens: Token[]; found: Found } | null = null;
  const all = readings(page);
  for (const tokens of all) {
    const found = exact(tokens, q);
    if (found) return lines(tokens.slice(found.start, found.start + found.length));
  }
  for (const tokens of all) {
    const found = spaceless(tokens, q);
    if (found) return lines(tokens.slice(found.start, found.start + found.length));
  }
  for (const tokens of all) {
    const found = fuzzy(tokens, q);
    if (found && (!best || found.score > best.found.score)) best = { tokens, found };
  }
  return best ? lines(best.tokens.slice(best.found.start, best.found.start + best.found.length)) : null;
}

/** The quote on its cited page, else on the page before or after (as the check allows). */
export function locateQuote(pages: PageItems[], quote: string, citedPage: number): Highlight | null {
  for (const page of [citedPage, citedPage - 1, citedPage + 1]) {
    const items = pages[page - 1];
    if (!items) continue;
    const rects = locateOnPage(items, quote);
    if (rects) return { page, rects };
  }
  return null;
}
