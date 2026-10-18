import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONSTRUCTS,
  CANONICAL_THEORIES,
  CanonicalConstruct,
  canonicalKey,
  CanonicalTheory,
  renderCanonicalMarkdown,
} from "./canonical.js";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const plan = readFileSync(path.join(ROOT, "PROJECT_PLAN.md"), "utf8");

/** Items of a Mục 1.3 bullet such as "* *Thương hiệu:* brand equity, brand awareness, …". */
function planItems(label: string): string[] {
  const line = plan.split("\n").find((l) => l.includes(`*${label}:*`));
  if (!line) throw new Error(`Mục 1.3 has no line "${label}"`);
  return line
    .split(`*${label}:*`)[1]!
    .replace(/\.\s*$/, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    // "sponsorship / advertising disclosure" names two concepts sharing the head noun.
    .flatMap((item) => {
      const shared = /^(\S+) \/ (.+) (\S+)$/.exec(item);
      return shared ? [`${shared[1]} ${shared[3]}`, `${shared[2]} ${shared[3]}`] : [item];
    });
}

const names = (e: { canonical_name: string; aliases: string[] }) => [e.canonical_name, ...e.aliases].map(canonicalKey);

function duplicates(list: { canonical_name: string; aliases: string[] }[]): string[] {
  const seen = new Map<string, number>();
  for (const key of list.flatMap(names)) seen.set(key, (seen.get(key) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([k]) => k);
}

describe("canonical lists (step 0.14)", () => {
  it("validate against their schemas with unique ids", () => {
    for (const t of CANONICAL_THEORIES) CanonicalTheory.parse(t);
    for (const c of CANONICAL_CONSTRUCTS) CanonicalConstruct.parse(c);
    const ids = [...CANONICAL_THEORIES, ...CANONICAL_CONSTRUCTS].map((e) => e.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it("have no duplicate name or alias within a list", () => {
    expect(duplicates(CANONICAL_THEORIES)).toEqual([]);
    expect(duplicates(CANONICAL_CONSTRUCTS)).toEqual([]);
  });

  it("contain every theory named in Mục 1.3", () => {
    const items = planItems("Nhóm lý thuyết khởi tạo").map(canonicalKey);
    expect(items).toHaveLength(10);
    const known = new Set(CANONICAL_THEORIES.flatMap(names));
    expect(items.filter((i) => !known.has(i))).toEqual([]);
    const fromPlan = CANONICAL_THEORIES.filter((t) => t.origin === "plan_1_3");
    expect(fromPlan).toHaveLength(items.length);
    for (const t of fromPlan) expect(names(t).some((n) => items.includes(n)), t.id).toBe(true);
  });

  it("contain every construct named in Mục 1.3, in its domain", () => {
    const groups = {
      "Social media": "social_media",
      "Thương hiệu": "branding",
      "Đạo đức": "ethics",
      "Hành vi khách hàng": "consumer_behavior",
    } as const;
    const covered = new Set<string>();
    for (const [label, domain] of Object.entries(groups)) {
      for (const item of planItems(label)) {
        const match = CANONICAL_CONSTRUCTS.find((c) => names(c).includes(canonicalKey(item)));
        expect({ item, domain: match?.domain }).toEqual({ item, domain });
        covered.add(match!.id);
      }
    }
    // Entries marked plan_1_3 are exactly the ones Mục 1.3 names (sponsorship / advertising disclosure is one entry).
    const fromPlan = CANONICAL_CONSTRUCTS.filter((c) => c.origin === "plan_1_3").map((c) => c.id);
    expect([...covered].sort()).toEqual([...fromPlan].sort());
  });

  it("link children to an existing parent of the same domain, without cycles", () => {
    const byId = new Map(CANONICAL_CONSTRUCTS.map((c) => [c.id, c]));
    for (const c of CANONICAL_CONSTRUCTS) {
      const seen = new Set([c.id]);
      for (let p = c.parent_id; p; p = byId.get(p)!.parent_id) {
        expect(byId.has(p), `${c.id} → ${p}`).toBe(true);
        expect(byId.get(p)!.domain).toBe(c.domain);
        expect(seen.has(p)).toBe(false);
        seen.add(p);
      }
    }
  });

  it("cite a source with a year for every definition and theory", () => {
    const year = /\(\d{4}\)/;
    for (const c of CANONICAL_CONSTRUCTS) expect(c.definition_source, c.id).toMatch(year);
    for (const t of CANONICAL_THEORIES) for (const s of t.key_sources) expect(s, t.id).toMatch(year);
  });

  it("canonicalKey unifies case, dashes, ampersands and spacing", () => {
    expect(canonicalKey("Consumer–Brand  Relationship")).toBe(canonicalKey("consumer-brand relationship"));
    expect(canonicalKey("Uses & Gratifications")).toBe("uses and gratifications");
  });

  it("docs/canonical-lists.md is up to date (pnpm canonical:doc)", () => {
    const doc = readFileSync(path.join(ROOT, "docs/canonical-lists.md"), "utf8").replace(/\r\n/g, "\n");
    expect(doc).toBe(renderCanonicalMarkdown());
  });
});
