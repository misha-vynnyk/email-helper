/**
 * @deprecated Use `../utils/contentReplacer` directly.
 * Thin re-export kept for backward compatibility.
 */
import { replaceUrlsInContentByMap, replaceUrlsInContent, replaceAltsInContent } from "../utils/contentReplacer";

export function useContentReplacer() {
  return { replaceUrlsInContentByMap, replaceUrlsInContent, replaceAltsInContent };
}
