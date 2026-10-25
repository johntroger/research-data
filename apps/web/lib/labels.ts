/** Looks up the name of a value (result, design, sample...) in the current language; an unknown value is shown as it is. */
import { MESSAGES } from "./messages";
import type { MessageKey, Translate } from "./i18n";

export type LabelGroup = "status" | "sign" | "effect" | "estimate" | "sort" | "design" | "sample" | "ptype" | "badge" | "role";

export function label(t: Translate, group: LabelGroup, key: string): string {
  const full = `${group}.${key}`;
  return full in MESSAGES ? t(full as MessageKey) : key;
}

/** The values of a group, in the order of the messages file, for building a list of checkboxes. */
export function labelKeys(group: LabelGroup): string[] {
  return Object.keys(MESSAGES)
    .filter((k) => k.startsWith(`${group}.`))
    .map((k) => k.slice(group.length + 1));
}

/** The name of a country in the language of the page. */
export function countryLabel(code: string, lang: "vi" | "en"): string {
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** For a key built at run time (a list of radio buttons, say); the key must exist in the messages or the page shows it as it is. */
export function tk(t: Translate, key: string): string {
  return key in MESSAGES ? t(key as MessageKey) : key;
}
