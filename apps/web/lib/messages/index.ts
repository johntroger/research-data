import { about } from "./about";
import { common } from "./common";
import { browse } from "./browse";
import { conceptPages } from "./concepts";
import { corpus } from "./corpus";
import { exports } from "./exports";
import { labels } from "./labels";
import { checks, misc } from "./misc";
import { paper } from "./paper";
import { search } from "./search";
import type { Msg } from "./define";

/** The namespace files; each owns its keys. A test checks that no key is in two of them. */
export const NAMESPACES = { about, common, browse, conceptPages, corpus, exports, checks, labels, misc, paper, search } satisfies Record<string, Record<string, Msg>>;

/** Every message of the site, by key. */
export const MESSAGES = { ...about, ...common, ...browse, ...conceptPages, ...corpus, ...exports, ...checks, ...labels, ...misc, ...paper, ...search } satisfies Record<string, Msg>;
export type MessageKey = keyof typeof MESSAGES;
