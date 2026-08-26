/** Parses a Width-px input's raw string into `number | undefined` (empty = "auto/fill", the
 * documented meaning of `widthPx: undefined` for Section/Row — see types.ts). Deliberately NOT
 * `Number(value) || undefined`: that coerces the literal value 0 to undefined too, since 0 is
 * falsy in JS — silently turning "0px" into "auto" instead of a real zero width. */
export function parseOptionalWidthPx(value: string): number | undefined {
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}
