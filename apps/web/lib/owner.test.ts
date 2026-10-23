import { describe, expect, it } from "vitest";
import { ownerFrom, parseAdminEmails, safeNext, type AuthUser } from "./owner";

const owner: AuthUser = { email: "Me@Example.org", email_confirmed_at: "2026-10-23T00:00:00Z", app_metadata: { role: "owner" } };
const allowed = ["me@example.org"];

describe("parseAdminEmails", () => {
  it("splits, trims and lowercases; empty means nobody", () => {
    expect(parseAdminEmails({ ADMIN_EMAILS: " A@x.org, b@x.org ,," })).toEqual(["a@x.org", "b@x.org"]);
    expect(parseAdminEmails({})).toEqual([]);
  });
});

describe("ownerFrom", () => {
  it("accepts a confirmed, listed user marked role=owner, whatever the case of the email", () => {
    expect(ownerFrom({ devShortcut: false, user: owner, allowed })).toEqual({ email: "me@example.org", via: "session" });
  });
  it("refuses a visitor, an unlisted email, a missing role, an unconfirmed email", () => {
    expect(ownerFrom({ devShortcut: false, user: null, allowed })).toBeNull();
    expect(ownerFrom({ devShortcut: false, user: { ...owner, email: "other@example.org" }, allowed })).toBeNull();
    expect(ownerFrom({ devShortcut: false, user: { ...owner, app_metadata: {} }, allowed })).toBeNull();
    expect(ownerFrom({ devShortcut: false, user: { ...owner, app_metadata: { role: "admin" } }, allowed })).toBeNull();
    expect(ownerFrom({ devShortcut: false, user: { ...owner, email_confirmed_at: null }, allowed })).toBeNull();
  });
  it("refuses everyone when the allow-list is empty", () => {
    expect(ownerFrom({ devShortcut: false, user: owner, allowed: [] })).toBeNull();
  });
  it("keeps the developer-machine shortcut, but a real signed-in owner is still shown as one", () => {
    expect(ownerFrom({ devShortcut: true, user: null, allowed: [] })).toEqual({ email: null, via: "dev" });
    expect(ownerFrom({ devShortcut: true, user: owner, allowed })).toEqual({ email: "me@example.org", via: "session" });
    expect(ownerFrom({ devShortcut: true, user: { ...owner, app_metadata: {} }, allowed })).toEqual({ email: null, via: "dev" });
  });
});

describe("safeNext", () => {
  it("allows paths on this site and nothing else", () => {
    expect(safeNext("/papers/abc?focus=x")).toBe("/papers/abc?focus=x");
    expect(safeNext(null)).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext("/ok\r\nSet-Cookie: x=1")).toBe("/");
  });
});
