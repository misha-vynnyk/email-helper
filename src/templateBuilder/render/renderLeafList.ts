import type { BuilderLeafBlock } from "../types";
import { renderButton } from "./renderButton";
import { renderDivider } from "./renderDivider";
import { renderImage } from "./renderImage";
import { renderSpacer } from "./renderSpacer";
import { renderText } from "./renderText";

/** Shared by section children and row-column children — the only difference between the two
 * call sites is which gap value they pass in (section.gapPx vs. a fixed column gap). */
export function renderLeafList(children: BuilderLeafBlock[], defaultFontFamily: string, gapPx: number): string {
  return children
    .map((child, index) => {
      const isLast = index === children.length - 1;
      const paddingBottomPx = isLast ? 0 : gapPx;
      switch (child.type) {
        case "text":
          return renderText(child, defaultFontFamily, paddingBottomPx);
        case "image":
          return renderImage(child, paddingBottomPx);
        case "button":
          return renderButton(child, paddingBottomPx);
        case "divider":
          return renderDivider(child, paddingBottomPx);
        case "spacer":
          return renderSpacer(child);
      }
    })
    .join("\n");
}
