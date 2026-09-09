import { act, render } from "@testing-library/react";

import { useSyncGoogleFontsIntoDocument } from "../hooks/useSyncGoogleFontsIntoDocument";
import { resetBuilderState, updateShellConfig } from "../state/builderStore";

const LINK_ID = "template-builder-google-fonts";

function Host() {
  useSyncGoogleFontsIntoDocument();
  return null;
}

describe("useSyncGoogleFontsIntoDocument", () => {
  beforeEach(() => {
    resetBuilderState();
    document.getElementById(LINK_ID)?.remove();
  });

  it("does nothing when no Google Font is selected", () => {
    render(<Host />);
    expect(document.getElementById(LINK_ID)).toBeNull();
  });

  it("adds a stylesheet link when googleFontsHref is set", () => {
    updateShellConfig({ googleFontsHref: "https://fonts.googleapis.com/css2?family=Lato" });

    render(<Host />);

    const link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    expect(link).not.toBeNull();
    expect(link?.rel).toBe("stylesheet");
    expect(link?.href).toBe("https://fonts.googleapis.com/css2?family=Lato");
  });

  it("updates the existing link's href in place (no duplicate) when the selection changes", () => {
    updateShellConfig({ googleFontsHref: "https://fonts.googleapis.com/css2?family=Lato" });
    render(<Host />);

    act(() => updateShellConfig({ googleFontsHref: "https://fonts.googleapis.com/css2?family=Roboto" }));

    expect(document.querySelectorAll(`#${LINK_ID}`)).toHaveLength(1);
    expect((document.getElementById(LINK_ID) as HTMLLinkElement).href).toBe("https://fonts.googleapis.com/css2?family=Roboto");
  });

  it("removes the link when the font selection is cleared", () => {
    updateShellConfig({ googleFontsHref: "https://fonts.googleapis.com/css2?family=Lato" });
    render(<Host />);
    expect(document.getElementById(LINK_ID)).not.toBeNull();

    act(() => updateShellConfig({ googleFontsHref: undefined }));

    expect(document.getElementById(LINK_ID)).toBeNull();
  });
});
