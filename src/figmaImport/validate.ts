import type { ZodError } from "zod";

import { designFileSchema } from "./schema";
import type { BaseNode, DesignNode, Visibility } from "./types";

export type ValidationFile = "desktop" | "mobile" | "tree";

export interface ValidationError {
  file: ValidationFile;
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  desktopNodes?: DesignNode[];
  mobileNodes?: DesignNode[];
}

function parseJson(raw: string, file: ValidationFile, errors: ValidationError[]): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    errors.push({
      file,
      path: "(root)",
      message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    });
    return undefined;
  }
}

function zodIssuesToErrors(error: ZodError, file: ValidationFile): ValidationError[] {
  return error.issues.map((issue) => ({
    file,
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

function collectIds(nodes: DesignNode[]): Map<string, Visibility> {
  const ids = new Map<string, Visibility>();

  const visit = (node: BaseNode & { type: string }) => {
    ids.set(node.id, node.visibility ?? "both");
    if (node.type === "frame") {
      (node as unknown as { children: DesignNode[] }).children.forEach((child) =>
        visit(child as BaseNode & { type: string })
      );
    }
    if (node.type === "button") {
      const icon = (node as unknown as { icon?: BaseNode }).icon;
      if (icon) {
        ids.set(icon.id, icon.visibility ?? "both");
      }
    }
    // RowNode's columns[].children and CardListNode's cards[].title/secondary are the same
    // "nested DesignNode" edges frame.children already walks — missing them here meant any
    // id used only inside a row/cardList (e.g. a mobile-only RowNode wrapping desktop's plain
    // frame(row) content, see figma-to-html/CLAUDE.md's "same id, different structure per
    // file" allowance) falsely failed cross-file id validation as "missing" in the other file.
    if (node.type === "row") {
      (node as unknown as { columns: Array<{ children: DesignNode[] }> }).columns.forEach((column) =>
        column.children.forEach((child) => visit(child as BaseNode & { type: string }))
      );
    }
    if (node.type === "cardList") {
      (node as unknown as { cards: Array<BaseNode & { title: DesignNode; secondary: DesignNode }> }).cards.forEach(
        (card) => {
          ids.set(card.id, card.visibility ?? "both");
          visit(card.title as BaseNode & { type: string });
          visit(card.secondary as BaseNode & { type: string });
        }
      );
    }
    if (node.type === "buttonRow") {
      (node as unknown as { buttons: DesignNode[] }).buttons.forEach((button) =>
        visit(button as BaseNode & { type: string })
      );
    }
  };

  nodes.forEach((node) => visit(node as BaseNode & { type: string }));
  return ids;
}

function crossCheckIds(
  desktopIds: Map<string, Visibility>,
  mobileIds: Map<string, Visibility>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [id, visibility] of mobileIds) {
    if (!desktopIds.has(id) && visibility !== "mobileOnly") {
      errors.push({
        file: "mobile",
        path: `id="${id}"`,
        message: `Present only in mobile.json but missing visibility:"mobileOnly" — likely a typo or a desync between the two files`,
      });
    }
  }

  for (const [id, visibility] of desktopIds) {
    if (!mobileIds.has(id) && visibility !== "desktopOnly") {
      errors.push({
        file: "desktop",
        path: `id="${id}"`,
        message: `Present only in desktop.json but missing visibility:"desktopOnly" — likely a typo or a desync between the two files`,
      });
    }
  }

  return errors;
}

export interface SingleTreeValidationResult {
  valid: boolean;
  errors: ValidationError[];
  nodes?: DesignNode[];
  title?: string;
}

function isWrappedFormat(parsed: unknown): parsed is { title?: unknown; nodes: unknown } {
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) && "nodes" in parsed;
}

// For a single pasted/uploaded tree (no separate mobile.json, no cross-file id check — there's
// only one file, so there's nothing to cross-check against). Accepts either a bare DesignNode[]
// (original format) or `{ title?: string, nodes: DesignNode[] }` — the wrapped form lets the tree
// itself carry the template's name (set from the real Figma file/frame name when the tree is
// authored) instead of requiring it typed in separately every time, same reasoning as fonts being
// auto-derived by collectFonts() rather than a manual field.
export function validateDesignFile(raw: string): SingleTreeValidationResult {
  const errors: ValidationError[] = [];
  const parsed = parseJson(raw, "tree", errors);
  if (parsed === undefined) return { valid: false, errors };

  const wrapped = isWrappedFormat(parsed);
  const title = wrapped && typeof parsed.title === "string" ? parsed.title : undefined;
  const nodesInput = wrapped ? parsed.nodes : parsed;

  const result = designFileSchema.safeParse(nodesInput);
  if (!result.success) {
    return { valid: false, errors: zodIssuesToErrors(result.error, "tree") };
  }

  return { valid: true, errors: [], nodes: result.data, title };
}

export function validateDesignPair(desktopRaw: string, mobileRaw: string): ValidationResult {
  const errors: ValidationError[] = [];

  const desktopParsed = parseJson(desktopRaw, "desktop", errors);
  const mobileParsed = parseJson(mobileRaw, "mobile", errors);

  if (desktopParsed === undefined || mobileParsed === undefined) {
    return { valid: false, errors };
  }

  const desktopResult = designFileSchema.safeParse(desktopParsed);
  if (!desktopResult.success) {
    errors.push(...zodIssuesToErrors(desktopResult.error, "desktop"));
  }

  const mobileResult = designFileSchema.safeParse(mobileParsed);
  if (!mobileResult.success) {
    errors.push(...zodIssuesToErrors(mobileResult.error, "mobile"));
  }

  if (!desktopResult.success || !mobileResult.success) {
    return { valid: false, errors };
  }

  const desktopNodes = desktopResult.data;
  const mobileNodes = mobileResult.data;

  errors.push(...crossCheckIds(collectIds(desktopNodes), collectIds(mobileNodes)));

  return {
    valid: errors.length === 0,
    errors,
    desktopNodes,
    mobileNodes,
  };
}
