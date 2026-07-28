/**
 * zod mirror of types.ts. Every object uses .strict() so a typo'd field name
 * (unknown key) fails validation instead of silently being dropped.
 */

import { z } from "zod";

import type { DesignNode } from "./types";

const visibilitySchema = z.enum(["both", "desktopOnly", "mobileOnly"]);

const baseNodeShape = {
  id: z.string().min(1, "id is required"),
  name: z.string().optional(),
  visibility: visibilitySchema.optional(),
};

const cornerRadiusSchema = z.union([
  z.number(),
  z
    .object({
      topLeft: z.number().optional(),
      topRight: z.number().optional(),
      bottomRight: z.number().optional(),
      bottomLeft: z.number().optional(),
    })
    .strict(),
]);

const fillSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("solid"), color: z.string() }).strict(),
  z
    .object({
      kind: z.literal("linearGradient"),
      angleDeg: z.number(),
      stops: z
        .array(z.object({ color: z.string(), position: z.number().min(0).max(1) }).strict())
        .min(2),
    })
    .strict(),
  z
    .object({
      kind: z.literal("radialGradient"),
      stops: z
        .array(z.object({ color: z.string(), position: z.number().min(0).max(1) }).strict())
        .min(2),
    })
    .strict(),
]);

const borderSideSchema = z
  .object({
    widthPx: z.number(),
    color: z.string(),
    style: z.enum(["solid", "dashed", "dotted"]).optional(),
  })
  .strict();

const frameBorderSchema = z
  .object({
    top: borderSideSchema.optional(),
    right: borderSideSchema.optional(),
    bottom: borderSideSchema.optional(),
    left: borderSideSchema.optional(),
  })
  .strict();

const framePaddingSchema = z
  .object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  })
  .strict();

const frameShadowSchema = z
  .object({
    xPx: z.number(),
    yPx: z.number(),
    blurPx: z.number(),
    color: z.string(),
  })
  .strict();

const textTransformSchema = z.enum(["uppercase", "lowercase", "capitalize", "none"]);

const textStyleShape = {
  fontSizePx: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().min(100).max(900).optional(),
  letterSpacing: z.number().optional(),
  lineHeight: z.number().optional(),
  color: z.string().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  textTransform: textTransformSchema.optional(),
  href: z.string().optional(),
};

const textStyleSchema = z.object(textStyleShape).strict();

const textRunSchema = z
  .object({
    text: z.string(),
    ...textStyleShape,
  })
  .strict();

const frameNodeShape = {
  ...baseNodeShape,
  type: z.literal("frame"),
  direction: z.enum(["row", "column"]),
  fill: fillSchema.optional(),
  border: frameBorderSchema.optional(),
  cornerRadius: cornerRadiusSchema.optional(),
  padding: framePaddingSchema,
  gap: z.number().optional(),
  width: z.union([z.number(), z.literal("fill"), z.literal("hug")]).optional(),
  justify: z.enum(["start", "center", "end", "spaceBetween"]).optional(),
  crossAlign: z.enum(["start", "center", "end"]).optional(),
  shadow: frameShadowSchema.optional(),
};

// `children` is the only recursive edge in the whole schema — it's the sole z.lazy(),
// deferred until parse-time so it can refer to designNodeSchema declared further below.
// frameNodeSchema itself stays a plain, already-built ZodObject (not wrapped in lazy,
// not widened to z.ZodType<FrameNode>) — that's what lets designNodeSchema's
// z.discriminatedUnion() below introspect its literal `type` field; discriminatedUnion
// requires genuine ZodObject members and cannot do that through a lazy or widened wrapper.
export const frameNodeSchema = z
  .object({
    ...frameNodeShape,
    children: z.array(z.lazy(() => designNodeSchema)),
  })
  .strict();

const textNodeSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("text"),
    defaultStyle: textStyleSchema,
    runs: z.array(textRunSchema).min(1),
    align: z.enum(["left", "center", "right"]).optional(),
  })
  .strict();

const imageNodeShape = {
  ...baseNodeShape,
  type: z.literal("image"),
  altDescription: z.string().min(1, "altDescription is required"),
  aspectRatio: z.number().optional(),
  href: z.string().optional(),
};

const imageNodeSchema = z.object(imageNodeShape).strict();

const buttonIconSchema = z
  .object({
    ...imageNodeShape,
    side: z.enum(["left", "right"]),
    gapPx: z.number(),
  })
  .strict();

const buttonNodeSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("button"),
    label: z.string(),
    href: z.string(),
    background: z.string().optional(),
    textColor: z.string().optional(),
    border: borderSideSchema.optional(),
    cornerRadius: cornerRadiusSchema.optional(),
    targetHeightPx: z.number(),
    fontFamily: z.string(),
    fontSizePx: z.number(),
    fontWeight: z.number().min(100).max(900),
    lineHeightPx: z.number(),
    textTransform: textTransformSchema.optional(),
    icon: buttonIconSchema.optional(),
  })
  .strict();

const dividerNodeSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("divider"),
    color: z.string(),
    thicknessPx: z.number().optional(),
  })
  .strict();

const spacerNodeSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("spacer"),
    heightPx: z.number(),
  })
  .strict();

const promoCopyNodeSchema = z
  .object({
    ...baseNodeShape,
    type: z.literal("promoCopy"),
  })
  .strict();

export const designNodeSchema: z.ZodType<DesignNode> = z.discriminatedUnion("type", [
  frameNodeSchema,
  textNodeSchema,
  imageNodeSchema,
  buttonNodeSchema,
  dividerNodeSchema,
  spacerNodeSchema,
  promoCopyNodeSchema,
]);

export const designFileSchema = z.array(designNodeSchema);
