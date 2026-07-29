import type { SpacerNode } from "../types";

export function renderSpacer(node: SpacerNode): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td height="${node.heightPx}" style="line-height: ${node.heightPx}px; font-size: 1px;">&nbsp;</td></tr></table>`;
}
