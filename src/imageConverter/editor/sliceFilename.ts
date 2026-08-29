/** Pure filename math — no DOM, unit-testable. Names successive "Save slice"
 * exports from the same source image distinctly, so they don't collide in the
 * grid or when downloaded to the same folder. */
export function withSliceSuffix(name: string, n: number): string {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) return `${name}-slice-${n}`;
  return `${name.slice(0, lastDot)}-slice-${n}${name.slice(lastDot)}`;
}
