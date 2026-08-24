import { renderShell } from "../render/renderShell";
import { createDefaultShellConfig } from "../types";

describe("renderShell", () => {
  it("substitutes title, both background colors, and content width", () => {
    const config = createDefaultShellConfig();
    config.title = "My Newsletter";
    config.outerBackground = "#e8eef4";
    config.contentBackground = "#ffffff";
    config.contentWidthPx = 600;

    const html = renderShell(config, "<!-- content -->");

    expect(html).toContain("<title>My Newsletter</title>");
    expect(html).toContain('bgcolor="#e8eef4"');
    expect(html).toContain('bgcolor="#ffffff"');
    expect(html).toContain('width="600"');
    expect(html).toContain("max-width: 600px");
    expect(html).toContain("<!-- content -->");
  });

  it("omits the Google Fonts <link> when googleFontsHref is not set", () => {
    const config = createDefaultShellConfig();
    const html = renderShell(config, "");
    expect(html).not.toContain("fonts.googleapis.com/css2");
  });

  it("includes the Google Fonts <link> and the [style*=X] match rule when configured", () => {
    const config = createDefaultShellConfig();
    config.googleFontsHref = "https://fonts.googleapis.com/css2?family=Poppins&display=swap";
    config.fontMatchSelector = "Poppins";
    const html = renderShell(config, "");

    expect(html).toContain('href="https://fonts.googleapis.com/css2?family=Poppins&amp;display=swap"');
    expect(html).toContain('[style*="Poppins"]');
  });

  it("strips characters that could break out of the <style> block from fontFamily", () => {
    const config = createDefaultShellConfig();
    config.fontMatchSelector = "Roboto";
    config.fontFamily = "Arial; } </style><script>alert(1)</script><style>";
    const html = renderShell(config, "");

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("</style><script");
  });
});
