export type PaletteType = "section" | "row2" | "row3" | "text" | "image";

export type DragData = { kind: "palette"; paletteType: PaletteType } | { kind: "canvas-block" } | { kind: "leaf"; containerId: string };

export type DropData = { kind: "container"; containerId: string } | { kind: "leaf"; containerId: string } | { kind: "canvas-root" } | { kind: "canvas-block" };
