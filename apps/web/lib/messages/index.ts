import { common } from "./common";
import { corpus } from "./corpus";
import { labels } from "./labels";
import { search } from "./search";
import type { Msg } from "./define";

/** The namespace files; each owns its keys. A test checks that no key is in two of them. */
export const NAMESPACES = { common, corpus, labels, search } satisfies Record<string, Record<string, Msg>>;

/** Every message of the site, by key. */
export const MESSAGES = { ...common, ...corpus, ...labels, ...search } satisfies Record<string, Msg>;
export type MessageKey = keyof typeof MESSAGES;
