/** Parses `html` the same way React's `dangerouslySetInnerHTML` would inside a real `<tbody>` (a
 * `<tr>`-context fragment) — used to compare a canvas preview component's rendered markup against
 * a `render*()` function's raw string output without being sensitive to browser/jsdom
 * serialization quirks (attribute quoting/ordering) that a raw string comparison would hit. */
export function tbodyInnerHtml(html: string): string {
  const tbody = document.createElement("tbody");
  tbody.innerHTML = html;
  return tbody.innerHTML;
}
