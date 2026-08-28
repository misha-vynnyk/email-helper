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

export interface SubtreeClone {
  rootId: string;
  /** Кожен клонований вузол (корінь + усі нащадки), за новим id. childId кожної дитини вже
   * ремапнутий на новий id клонованого батька; parentId кореня лишається старим — єдиний
   * споживач (duplicateNode, builderStore.ts) завжди йде через insertNode одразу після, а той
   * перезаписує parentId безумовно. */
  nodes: Record<string, BuilderNode>;
}

/** Глибоко клонує піддерево `id` — контейнер (Section/Row/Row-column) разом з усіма нащадками,
 * чи один лист — мінтячи новий id для кожного клонованого вузла через `nextId`. Прекондишн: `id`
 * має існувати в `tree.nodes` (на відміну від `removeNodeFromTree`/`collectDescendantIds`, тут
 * немає безпечного "не знайдено" сценарію — клонування неіснуючого вузла не має природного
 * порожнього результату, тож викликач мусить перевірити існування заздалегідь).
 *
 * `nextId` — параметр, не інлайновий `crypto.randomUUID()`, свідомо відступаючи від конвенції
 * решти файлу (яка ніколи не мінтить id, це відповідальність builderStore.ts): клонування
 * структурно мусить згенерувати N нових id під час обходу, і функція-генератор лишає
 * `cloneSubtree` детерміновано тестованою (лічильник у тестах) при реальній випадковості лише в
 * реальному call site. */
export function cloneSubtree(tree: CanvasTree, id: string, nextId: () => string = () => crypto.randomUUID()): SubtreeClone {
  const node = tree.nodes[id];
  const newId = nextId();
  if (!isContainerNode(node)) {
    return { rootId: newId, nodes: { [newId]: { ...node, id: newId } } };
  }
  const nodes: Record<string, BuilderNode> = {};
  const newChildIds = node.childIds.map((childId) => {
    const childClone = cloneSubtree(tree, childId, nextId);
    Object.assign(nodes, childClone.nodes);
    nodes[childClone.rootId] = { ...nodes[childClone.rootId], parentId: newId };
    return childClone.rootId;
  });
  nodes[newId] = { ...node, id: newId, childIds: newChildIds };
  return { rootId: newId, nodes };
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
