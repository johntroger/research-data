/** One message, in both languages. Placeholders look like {name} and must be the same in both texts (a test checks). */
export interface Msg {
  vi: string;
  en: string;
}

/** Keeps the keys as literal types while checking that every entry has both languages. */
export const defineMessages = <T extends Record<string, Msg>>(messages: T): T => messages;
