import { type BuilderNode, isContainerNode } from "../types";

/** Нормалізоване дерево канви: вузли — плоска мапа за id, порядок дітей — `childIds`
 * (на контейнерах) чи `rootIds` (на корені). Дерево існує лише логічно, через
 * `parentId`/`childIds`-покажчики, без вкладених об'єктів — див. план у CLAUDE.md-роботі
 * "рекурсивне дерево канви". */
export interface CanvasTree {
  nodes: Record<string, BuilderNode>;
  rootIds: string[];
}

export function childIdsOf(tree: CanvasTree, parentId: string | null): string[] {
  if (parentId === null) return tree.rootIds;
  const parent = tree.nodes[parentId];
  return parent && isContainerNode(parent) ? parent.childIds : [];
}

function withChildIds(tree: CanvasTree, parentId: string | null, childIds: string[]): CanvasTree {
  if (parentId === null) return { ...tree, rootIds: childIds };
  const parent = tree.nodes[parentId];
  if (!parent || !isContainerNode(parent)) return tree;
  return { ...tree, nodes: { ...tree.nodes, [parentId]: { ...parent, childIds } } };
}

export function insertNode(tree: CanvasTree, node: BuilderNode, parentId: string | null, index: number): CanvasTree {
  const withNode: CanvasTree = { ...tree, nodes: { ...tree.nodes, [node.id]: { ...node, parentId } } };
  const siblings = [...childIdsOf(withNode, parentId)];
  siblings.splice(index, 0, node.id);
  return withChildIds(withNode, parentId, siblings);
}

/** Усі id під вузлом (не включно з ним самим) — для каскадного видалення й для чистки
 * виділення, коли видалений вузол чи хтось із його нащадків був обраний. Єдина функція в
 * цьому модулі, що йде по всьому піддереву — і навмисно лише по ньому, не по всьому дереву. */
export function collectDescendantIds(nodes: Record<string, BuilderNode>, id: string): string[] {
  const node = nodes[id];
  if (!node || !isContainerNode(node)) return [];
  const result: string[] = [];
  for (const childId of node.childIds) {
    result.push(childId, ...collectDescendantIds(nodes, childId));
  }
  return result;
}

export function removeNodeFromTree(tree: CanvasTree, id: string): CanvasTree {
  const node = tree.nodes[id];
  if (!node) return tree;

  const idsToDelete = [id, ...collectDescendantIds(tree.nodes, id)];
  const nodes = { ...tree.nodes };
  for (const deadId of idsToDelete) delete nodes[deadId];

  const withoutNode: CanvasTree = { ...tree, nodes };
  const siblings = childIdsOf(withoutNode, node.parentId).filter((childId) => childId !== id);
  return withChildIds(withoutNode, node.parentId, siblings);
}

/** Cycle-guard: чи `candidateId` дорівнює `ancestorId`, чи лежить десь під ним. Підйом по
 * `parentId`-ланцюжку до кореня — O(глибина), не обхід усього піддерева `ancestorId` вниз.
 * Викликати перед будь-яким переміщенням вузла в `candidateId`-контейнер, щоб заборонити
 * кинути контейнер у власного нащадка (чи в самого себе). */
export function isDescendantOrSelf(nodes: Record<string, BuilderNode>, ancestorId: string, candidateId: string): boolean {
  let current: string | null = candidateId;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = nodes[current]?.parentId ?? null;
  }
  return false;
}

/** Переміщує вузол (лист чи цілий піддерево-контейнер) в інший контейнер (чи в корінь,
 * коли `toParentId === null`), або переставляє в тому самому — один код-шлях для всього.
 * `toIndex` рахується від дітей контейнера-цілі ПІСЛЯ видалення вузла зі старого місця
 * (той самий порядок дій, що мав попередній `moveLeaf`), тож виклику не потрібно окремо
 * компенсувати зсув індексу для випадку "той самий контейнер". No-op при спробі кинути
 * контейнер у власного нащадка чи в самого себе. */
export function moveNodeInTree(tree: CanvasTree, id: string, toParentId: string | null, toIndex: number): CanvasTree {
  const node = tree.nodes[id];
  if (!node) return tree;
  if (toParentId !== null && isDescendantOrSelf(tree.nodes, id, toParentId)) return tree;

  const withoutFromOld = withChildIds(tree, node.parentId, childIdsOf(tree, node.parentId).filter((childId) => childId !== id));
  const withUpdatedParent: CanvasTree = { ...withoutFromOld, nodes: { ...withoutFromOld.nodes, [id]: { ...node, parentId: toParentId } } };
  const newSiblings = [...childIdsOf(withUpdatedParent, toParentId)];
  newSiblings.splice(Math.min(toIndex, newSiblings.length), 0, id);
  return withChildIds(withUpdatedParent, toParentId, newSiblings);
}
