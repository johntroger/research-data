import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "./csv";

describe("csv", () => {
  it("quotes fields that hold a comma, a quote or a line break, and doubles the quotes", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a,b")).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("two\nlines")).toBe('"two\nlines"');
    expect(csvField(null)).toBe("");
    expect(csvField(0)).toBe("0");
    expect(csvField(-0.31)).toBe("-0.31");
  });

  it("starts with a byte order mark (Excel reads Vietnamese with it), uses CRLF and ends with a line break", () => {
    const text = toCsv(["a", "b"], [[1, "x,y"], [null, "Việt"]]);
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text.slice(1)).toBe('a,b\r\n1,"x,y"\r\n,Việt\r\n');
  });
});
