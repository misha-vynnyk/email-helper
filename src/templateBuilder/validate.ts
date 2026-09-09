import type { ZodError } from "zod";

import { builderDocumentSchema } from "./schema";
import { type BuilderNode, createDefaultShellConfig, isContainerNode, MAX_ROW_COLUMNS, MIN_ROW_COLUMNS, type ShellConfig } from "./types";

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** Only populated on success — the flat imported array merged with `createDefaultShellConfig()`
   * defaults, already in the shape `builderStore.loadDocument` expects. */
  shell?: ShellConfig;
  nodes?: Record<string, BuilderNode>;
  rootIds?: string[];
}

function parseJson(raw: string, errors: ValidationError[]): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    errors.push({ path: "(root)", message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}` });
    return undefined;
  }
}

function zodIssuesToErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

function collectDuplicateIdErrors(nodeList: BuilderNode[]): ValidationError[] {
  const seen = new Set<string>();
  const errors: ValidationError[] = [];
  for (const node of nodeList) {
    if (seen.has(node.id)) errors.push({ path: `nodes[id="${node.id}"]`, message: `Duplicate node id "${node.id}"` });
    seen.add(node.id);
  }
  return errors;
}

/** First occurrence wins for a duplicated id, so every check below still runs against a
 * consistent graph even when `collectDuplicateIdErrors` already flagged a duplicate — one
 * `validateBuilderDocument` call surfaces as many real problems as possible at once, rather than
 * making the caller fix one error at a time. */
function buildNodesMap(nodeList: BuilderNode[]): Record<string, BuilderNode> {
  const nodes: Record<string, BuilderNode> = {};
  for (const node of nodeList) {
    if (!(node.id in nodes)) nodes[node.id] = node;
  }
  return nodes;
}

/**
 * Walks each node's `parentId` chain upward, bounded to `nodeList.length` steps. An LLM-authored
 * import is exactly the kind of input that could contain a `parentId` cycle (accidental or
 * hallucinated), and a genuine cycle would make a naive "walk until null" loop spin forever —
 * this is why the walk is step-bounded instead of reusing `state/canvasTree.ts`'s
 * `isDescendantOrSelf` directly, even though its logic is the same "follow parentId up" idea:
 * that helper is built for the live builder tree, which is already guaranteed acyclic by
 * construction (every mutation goes through `moveNodeInTree`'s own cycle guard) — it was never
 * meant to walk arbitrary, not-yet-validated JSON. Every structural check after this one assumes
 * an acyclic graph, so `validateStructure` stops here the moment a cycle turns up.
 */
function collectParentIdCycleErrors(nodeList: BuilderNode[], nodes: Record<string, BuilderNode>): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxSteps = nodeList.length;
  for (const node of nodeList) {
    let current = node.parentId;
    let steps = 0;
    while (current !== null) {
      if (current === node.id) {
        errors.push({ path: `nodes[id="${node.id}"].parentId`, message: `parentId chain forms a cycle back to "${node.id}"` });
        break;
      }
      steps += 1;
      if (steps > maxSteps) {
        errors.push({ path: `nodes[id="${node.id}"].parentId`, message: `parentId chain never reaches a root (parentId: null) — likely a cycle elsewhere in the document` });
        break;
      }
      current = nodes[current]?.parentId ?? null;
    }
  }
  return errors;
}

function collectParentReferenceErrors(nodeList: BuilderNode[], nodes: Record<string, BuilderNode>): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const node of nodeList) {
    if (node.parentId === null) continue;
    const parent = nodes[node.parentId];
    if (!parent) {
      errors.push({ path: `nodes[id="${node.id}"].parentId`, message: `parentId "${node.parentId}" does not reference any node in the document` });
    } else if (!isContainerNode(parent)) {
      errors.push({ path: `nodes[id="${node.id}"].parentId`, message: `parentId "${node.parentId}" references a "${parent.type}" node, which is not a container` });
    }
  }
  return errors;
}

/** Two-way check: every id a container lists in `childIds` must be a real node whose own
 * `parentId` points back at that container, AND every node that claims this container as its
 * `parentId` must actually appear in the container's `childIds`. A mismatch either way means the
 * imported JSON's parent/child pointers disagree with each other. Skips the reverse direction for
 * a node whose parent is missing or non-container — `collectParentReferenceErrors` already
 * reports that case, no need to report it twice. */
function collectChildIdsErrors(nodeList: BuilderNode[], nodes: Record<string, BuilderNode>): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const container of nodeList.filter(isContainerNode)) {
    const seenChildIds = new Set<string>();
    for (const childId of container.childIds) {
      if (seenChildIds.has(childId)) {
        errors.push({ path: `nodes[id="${container.id}"].childIds`, message: `childIds lists "${childId}" more than once` });
        continue;
      }
      seenChildIds.add(childId);
      const child = nodes[childId];
      if (!child) {
        errors.push({ path: `nodes[id="${container.id}"].childIds`, message: `childIds references "${childId}", which does not exist in the document` });
      } else if (child.parentId !== container.id) {
        errors.push({ path: `nodes[id="${container.id}"].childIds`, message: `childIds references "${childId}", but that node's parentId is "${child.parentId ?? "null"}", not "${container.id}"` });
      }
    }
  }

  for (const node of nodeList) {
    if (node.parentId === null) continue;
    const parent = nodes[node.parentId];
    if (!parent || !isContainerNode(parent)) continue;
    if (!parent.childIds.includes(node.id)) {
      errors.push({ path: `nodes[id="${node.id}"]`, message: `parentId "${node.parentId}" does not list this node in its own childIds` });
    }
  }

  return errors;
}

function collectRowStructureErrors(nodeList: BuilderNode[], nodes: Record<string, BuilderNode>): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const node of nodeList) {
    if (node.type === "row-column") {
      const parent = node.parentId !== null ? nodes[node.parentId] : undefined;
      if (!parent || parent.type !== "row") {
        errors.push({ path: `nodes[id="${node.id}"].parentId`, message: `A "row-column" node's parent must be a "row" node` });
      }
    }

    if (node.type === "row") {
      const nonColumnChild = node.childIds.map((id) => nodes[id]).find((child) => child && child.type !== "row-column");
      if (nonColumnChild) {
        errors.push({ path: `nodes[id="${node.id}"].childIds`, message: `A "row" node's children must all be "row-column" nodes, found "${nonColumnChild.type}"` });
      }
      if (node.childIds.length < MIN_ROW_COLUMNS || node.childIds.length > MAX_ROW_COLUMNS) {
        errors.push({ path: `nodes[id="${node.id}"].childIds`, message: `A "row" node must have between ${MIN_ROW_COLUMNS} and ${MAX_ROW_COLUMNS} columns, found ${node.childIds.length}` });
      }
    }
  }
  return errors;
}

function validateStructure(nodeList: BuilderNode[]): ValidationError[] {
  const duplicateErrors = collectDuplicateIdErrors(nodeList);
  const nodes = buildNodesMap(nodeList);

  const cycleErrors = collectParentIdCycleErrors(nodeList, nodes);
  if (cycleErrors.length > 0) return [...duplicateErrors, ...cycleErrors];

  return [...duplicateErrors, ...collectParentReferenceErrors(nodeList, nodes), ...collectChildIdsErrors(nodeList, nodes), ...collectRowStructureErrors(nodeList, nodes)];
}

/** Validates a JSON-encoded `BuilderDocument` (see `schema.ts`) — the single entry point both the
 * Import JSON dialog (`components/ImportJsonDialog.tsx`) and, later, Phase 2's `build_template`
 * MCP tool call before ever touching `builderStore`. Two passes: `builderDocumentSchema` (field
 * shapes/types), then the structural-integrity checks above (an LLM-authored document can get the
 * shape right while still getting the tree's cross-references wrong). */
export function validateBuilderDocument(raw: string): ValidationResult {
  const errors: ValidationError[] = [];
  const parsed = parseJson(raw, errors);
  if (parsed === undefined) return { valid: false, errors };

  const zodResult = builderDocumentSchema.safeParse(parsed);
  if (!zodResult.success) return { valid: false, errors: zodIssuesToErrors(zodResult.error) };

  const nodeList = zodResult.data.nodes;
  const structuralErrors = validateStructure(nodeList);
  if (structuralErrors.length > 0) return { valid: false, errors: structuralErrors };

  const nodes: Record<string, BuilderNode> = {};
  for (const node of nodeList) nodes[node.id] = node;
  const rootIds = nodeList.filter((node) => node.parentId === null).map((node) => node.id);
  const shell: ShellConfig = { ...createDefaultShellConfig(), ...zodResult.data.shell };

  return { valid: true, errors: [], shell, nodes, rootIds };
}
