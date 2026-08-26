import { isSafeHref } from "../render/security";

describe("isSafeHref", () => {
  it("rejects a plain dangerous scheme", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHref("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeHref("file:///etc/passwd")).toBe(false);
  });

  it("rejects a dangerous scheme preceded by whitespace/control characters", () => {
    expect(isSafeHref("  javascript:alert(1)")).toBe(false);
    expect(isSafeHref("\njavascript:alert(1)")).toBe(false);
  });

  it("rejects a dangerous scheme with control characters embedded INSIDE the scheme word — the browser strips them before parsing, so this is a real bypass, not just a leading-whitespace one", () => {
    expect(isSafeHref("java\tscript:alert(document.cookie)")).toBe(false);
    expect(isSafeHref("java\nscript:alert(1)")).toBe(false);
    expect(isSafeHref("j\ta\tv\ta\ts\tc\tr\ti\tp\tt:alert(1)")).toBe(false);
  });

  it("allows a normal https/http href through", () => {
    expect(isSafeHref("https://example.com")).toBe(true);
    expect(isSafeHref("http://example.com/path?x=1")).toBe(true);
  });

  it("allows the placeholder href with no scheme at all", () => {
    expect(isSafeHref("urlhere")).toBe(true);
  });
});
