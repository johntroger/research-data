/** The language of this request, read from the `lang` cookie (server components and route handlers). */
import { cookies } from "next/headers";
import { LANG_COOKIE, makeT, makeTn, parseLang, type Lang, type Translate, type TranslatePlural } from "./i18n";

export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

export async function getT(): Promise<{ lang: Lang; t: Translate; tn: TranslatePlural }> {
  const lang = await getLang();
  return { lang, t: makeT(lang), tn: makeTn(lang) };
}
