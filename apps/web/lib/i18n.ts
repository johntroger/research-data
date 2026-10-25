/**
 * Two languages (step P5.1): Vietnamese (the default) and English. Every message is one entry with both texts side by side, so a missing
 * translation cannot exist (the type forbids it) and the two always have the same placeholders (a test checks). The language is chosen by
 * the visitor with ?lang=en or ?lang=vi (the proxy remembers it in a cookie called `lang`); nothing is guessed from the browser.
 * Data (variable names, paper titles, quotes) is English already and is never translated.
 */
import { MESSAGES, type MessageKey } from "./messages";

export const LANGS = ["vi", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "vi";
export const LANG_COOKIE = "lang";

export const isLang = (value: unknown): value is Lang => typeof value === "string" && (LANGS as readonly string[]).includes(value);
export const parseLang = (value: unknown): Lang => (isLang(value) ? value : DEFAULT_LANG);

export type Vars = Record<string, string | number>;

/** Replaces {name} in a text with the given values (an unknown name is left as it is, so a mistake shows). */
export function fill(text: string, vars?: Vars): string {
  return vars ? text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole)) : text;
}

export type Translate = (key: MessageKey, vars?: Vars) => string;
/** For counts: uses `key.one` when the number is 1 and `key.other` otherwise (Vietnamese has both entries, with the same text). */
export type TranslatePlural = (key: string, n: number, vars?: Vars) => string;

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  return fill(MESSAGES[key][lang], vars);
}

export function makeT(lang: Lang): Translate {
  return (key, vars) => translate(lang, key, vars);
}

export function makeTn(lang: Lang): TranslatePlural {
  return (key, n, vars) => {
    const full = `${key}.${n === 1 ? "one" : "other"}` as MessageKey;
    return translate(lang, full, { n, ...vars });
  };
}

/** The messages a client component may use: those whose key starts with "c." (so the page does not send every text to the browser). */
export function clientMessages(lang: Lang): Record<string, string> {
  return Object.fromEntries(Object.entries(MESSAGES).filter(([k]) => k.startsWith("c.")).map(([k, v]) => [k, v[lang]]));
}

export type { MessageKey };
