import type { BuilderLeafBlock } from "../types";
import { renderImage } from "./renderImage";
import { renderText } from "./renderText";

/** Shared by section children and row-column children — the only difference between the two
 * call sites is which gap value they pass in (section.gapPx vs. a fixed column gap). */
export function renderLeafList(children: BuilderLeafBlock[], defaultFontFamily: string, gapPx: number): string {
  return children
    .map((child, index) => {
      const isLast = index === children.length - 1;
      const paddingBottomPx = isLast ? 0 : gapPx;
      return child.type === "text" ? renderText(child, defaultFontFamily, paddingBottomPx) : renderImage(child, paddingBottomPx);
    })
    .join("\n");
}
