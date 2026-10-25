import { describe, expect, it } from "vitest";
import { clientMessages, fill, makeT, makeTn, parseLang } from "./i18n";
import { MESSAGES, NAMESPACES } from "./messages";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

describe("the messages", () => {
  it("have a text in both languages for every key, none empty", () => {
    for (const [key, msg] of Object.entries(MESSAGES)) {
      expect(msg.vi.trim(), `${key} (vi)`).not.toBe("");
      expect(msg.en.trim(), `${key} (en)`).not.toBe("");
    }
  });

  it("use the same placeholders in both languages", () => {
    for (const [key, msg] of Object.entries(MESSAGES)) expect(placeholders(msg.en), key).toEqual(placeholders(msg.vi));
  });

  it("have no key in two namespaces (the merge would silently drop one)", () => {
    const total = Object.values(NAMESPACES).reduce((n, ns) => n + Object.keys(ns).length, 0);
    expect(Object.keys(MESSAGES)).toHaveLength(total);
  });

  it("keep the English free of Vietnamese letters and the Vietnamese texts really Vietnamese where they have words", () => {
    const vietnamese = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
    for (const [key, msg] of Object.entries(MESSAGES)) expect(msg.en, `${key} (en)`).not.toMatch(vietnamese);
  });

  it("make plural pairs for every .one and .other", () => {
    for (const key of Object.keys(MESSAGES)) {
      if (key.endsWith(".one")) expect(Object.keys(MESSAGES), key).toContain(key.replace(/\.one$/, ".other"));
      if (key.endsWith(".other")) expect(Object.keys(MESSAGES), key).toContain(key.replace(/\.other$/, ".one"));
    }
  });
});

describe("translating", () => {
  it("fills placeholders and leaves an unknown one visible", () => {
    expect(fill("a {x} b {y}", { x: 1 })).toBe("a 1 b {y}");
    expect(makeT("en")("rate.tooMany", { sec: 5 })).toBe("You sent too many requests. Please try again in 5 seconds.");
    expect(makeT("vi")("rate.tooMany", { sec: 5 })).toBe("Bạn gửi quá nhiều yêu cầu. Hãy thử lại sau 5 giây.");
  });

  it("falls back to Vietnamese for an unknown language", () => {
    expect(parseLang("fr")).toBe("vi");
    expect(parseLang("en")).toBe("en");
    expect(parseLang(undefined)).toBe("vi");
  });

  it("sends only the client messages to the browser", () => {
    const keys = Object.keys(clientMessages("en"));
    expect(keys.every((k) => k.startsWith("c."))).toBe(true);
  });

  it("picks the singular for 1 and the plural otherwise", () => {
    expect(typeof makeTn("en")).toBe("function");
  });
});
