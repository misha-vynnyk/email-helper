/**
 * zod mirror of types.ts. Every object uses .strict() so a typo'd field name (unknown key) fails
 * validation instead of silently being dropped — same convention as figmaImport/schema.ts, which
 * this file's shapes are otherwise independent of (templateBuilder's BuilderNode is a different
 * IR from figmaImport's DesignNode — see the ButtonIcon doc comment in types.ts for the one place
 * the two intentionally diverge despite a similar-sounding field).
 */

import { z } from "zod";

import type { BuilderNode } from "./types";

const textAlignSchema = z.enum(["left", "center", "right"]);

const containerPaddingSchema = z
  .object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  })
  .strict();

const containerBorderSchema = z
  .object({
    widthPx: z.number(),
    color: z.string(),
  })
  .strict();

const containerShadowSchema = z
  .object({
    xPx: z.number(),
    yPx: z.number(),
    blurPx: z.number(),
    color: z.string(),
  })
  .strict();

const cornerRadiusValueSchema = z
  .object({
    topLeft: z.number(),
    topRight: z.number(),
    bottomRight: z.number(),
    bottomLeft: z.number(),
  })
  .strict();

/** Mirrors `types.ts`'s `ContainerFill` — a plain color string, or a linear-gradient object.
 * Narrowed to just `linearGradient` (no `radialGradient`), same as `ContainerFill` itself. */
export const containerFillSchema = z.union([
  z.string(),
  z
    .object({
      kind: z.literal("linearGradient"),
      angleDeg: z.number(),
      stops: z
        .array(z.object({ color: z.string(), position: z.number().min(0).max(1) }).strict())
        .min(2),
    })
    .strict(),
]);

const baseNodeShape = {
  id: z.string().min(1, "id is required"),
  parentId: z.string().nullable(),
  responsiveClassNames: z.array(z.string()).optional(),
};

const textBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("text"),
    contentHtml: z.string(),
    fontFamily: z.string().optional(),
    fontSizePx: z.number(),
    fontWeight: z.number(),
    color: z.string(),
    align: textAlignSchema,
    href: z.string().optional(),
  })
  .strict();

const imageBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("image"),
    src: z.string(),
    alt: z.string(),
    widthPx: z.number(),
    href: z.string().optional(),
  })
  .strict();

// Deliberately NOT figmaImport/schema.ts's buttonIconSchema — that shape models a not-yet-resolved
// Figma node (altDescription/side/heightPx, no real image URL); this is a real, renderable image
// reference, same spirit as imageBlockSchema. See the ButtonIcon doc comment in types.ts.
const buttonIconSchema = z
  .object({
    src: z.string(),
    alt: z.string(),
    widthPx: z.number(),
    gapPx: z.number(),
  })
  .strict();

const buttonBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("button"),
    label: z.string(),
    href: z.string(),
    fontFamily: z.string().optional(),
    bgColor: z.string().optional(),
    textColor: z.string(),
    border: containerBorderSchema.optional(),
    borderRadiusPx: z.number(),
    align: textAlignSchema,
    fontSizePx: z.number(),
    fontWeight: z.number(),
    width: z.union([z.literal("auto"), z.literal("full"), z.number()]),
    icon: buttonIconSchema.optional(),
  })
  .strict();

const dividerBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("divider"),
    color: z.string(),
    thicknessPx: z.number(),
    widthPercent: z.number(),
  })
  .strict();

const spacerBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("spacer"),
    heightPx: z.number(),
  })
  .strict();

const readyMadeBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("ready-made"),
    definitionId: z.string().min(1, "definitionId is required"),
    values: z.record(z.string(), z.string()),
  })
  .strict();

const sectionBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("section"),
    padding: containerPaddingSchema,
    widthPx: z.number().optional(),
    gapPx: z.number(),
    fill: containerFillSchema.optional(),
    border: containerBorderSchema.optional(),
    cornerRadius: z.number().optional(),
    cornerRadii: cornerRadiusValueSchema.optional(),
    shadow: containerShadowSchema.optional(),
    childIds: z.array(z.string()),
  })
  .strict();

const rowColumnBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("row-column"),
    widthPercent: z.number(),
    childIds: z.array(z.string()),
  })
  .strict();

// Deliberately no gapPx — unlike SectionBlock, RowBlock's children are side-by-side columns, not
// stacked, so there's no vertical-gap field to mirror (see the doc comment on RowBlock in types.ts).
const rowBlockSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("row"),
    padding: containerPaddingSchema,
    widthPx: z.number().optional(),
    fill: containerFillSchema.optional(),
    border: containerBorderSchema.optional(),
    cornerRadius: z.number().optional(),
    cornerRadii: cornerRadiusValueSchema.optional(),
    shadow: containerShadowSchema.optional(),
    childIds: z.array(z.string()),
  })
  .strict();

export const builderNodeSchema: z.ZodType<BuilderNode> = z.discriminatedUnion("type", [
  textBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  dividerBlockSchema,
  spacerBlockSchema,
  readyMadeBlockSchema,
  sectionBlockSchema,
  rowColumnBlockSchema,
  rowBlockSchema,
]);

// Same shape as ShellConfig itself (not pre-partialed) — builderDocumentSchema below is the one
// that calls `.partial()` on it, so this stays reusable as a "full" shell schema elsewhere too.
const shellConfigSchema = z
  .object({
    title: z.string(),
    fontFamily: z.string(),
    fontMatchSelector: z.string().optional(),
    googleFonts: z.array(z.string()),
    googleFontsHref: z.string().optional(),
    outerBackground: z.string(),
    contentBackground: z.string(),
    contentWidthPx: z.number(),
  })
  .strict();

// `nodes` is a flat array, not a record — each node already carries its own id/parentId (and
// childIds for containers), so the array fully encodes the tree; `rootIds` is derived by
// validate.ts as "nodes with parentId: null, in array order", not stored as a separate field.
export const builderDocumentSchema = z
  .object({
    shell: shellConfigSchema.partial().optional(),
    nodes: z.array(builderNodeSchema),
  })
  .strict();

export type BuilderDocument = z.infer<typeof builderDocumentSchema>;
