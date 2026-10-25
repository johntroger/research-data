import { common } from "./common";
import type { Msg } from "./define";

/** The namespace files; each owns its keys. A test checks that no key is in two of them. */
export const NAMESPACES = { common } satisfies Record<string, Record<string, Msg>>;

/** Every message of the site, by key. */
export const MESSAGES = { ...common } satisfies Record<string, Msg>;
export type MessageKey = keyof typeof MESSAGES;
