import { CSSProperties } from "react";

/** The transparency checkerboard used everywhere a canvas/image might show alpha=0
 * pixels (EditorStage's live canvas, BeforeAfterPreview's review step) — kept in one
 * place so "removed background" reads the same way in both. */
export const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, #94a3b8 25%, transparent 25%), linear-gradient(-45deg, #94a3b8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #94a3b8 75%), linear-gradient(-45deg, transparent 75%, #94a3b8 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
};
