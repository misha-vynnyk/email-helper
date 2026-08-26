/** Builds a `class="..."` attribute (or `""` when there's nothing to add) combining a renderer's
 * own literal class (if any) with a node's opted-in responsive utility classes. Class names only
 * ever come from responsiveUtilityCatalog.ts's curated catalog (picked via checkboxes in
 * ResponsiveClassPicker, never free text), so no escaping is needed. */
export function responsiveClassAttr(existingClass: string | undefined, responsiveClassNames: string[] | undefined): string {
  const classes = [existingClass, ...(responsiveClassNames ?? [])].filter((c): c is string => Boolean(c));
  return classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
}
