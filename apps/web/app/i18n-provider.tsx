"use client";

import { createContext, type ReactNode, useContext } from "react";
import { fill, type Lang, type Vars } from "@/lib/i18n";

interface Ctx {
  lang: Lang;
  messages: Record<string, string>;
}

const I18nContext = createContext<Ctx>({ lang: "vi", messages: {} });

/** Gives client components the texts of the current language (only the "c." messages, chosen by the layout). */
export function I18nProvider({ lang, messages, children }: { lang: Lang; messages: Record<string, string>; children: ReactNode }) {
  return <I18nContext.Provider value={{ lang, messages }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const { lang, messages } = useContext(I18nContext);
  const t = (key: string, vars?: Vars) => fill(messages[key] ?? key, vars);
  const tn = (key: string, n: number, vars?: Vars) => t(`${key}.${n === 1 ? "one" : "other"}`, { n, ...vars });
  return { lang, t, tn };
}
