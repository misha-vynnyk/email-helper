import type { BuilderNode } from "../types";

/** Turns a flat list of already-built nodes into the `Record<id, BuilderNode>` shape the
 * normalized store/render pipeline expects — a small helper shared by tests that hand-build
 * tree fixtures without going through the Zustand store. */
export function nodeMap(nodes: BuilderNode[]): Record<string, BuilderNode> {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}
