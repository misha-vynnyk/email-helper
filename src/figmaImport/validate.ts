import type { ZodError } from "zod";

import { designFileSchema } from "./schema";
import type { BaseNode, DesignNode, Visibility } from "./types";

export type ValidationFile = "desktop" | "mobile";

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
