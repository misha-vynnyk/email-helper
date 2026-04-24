import { useMemo, useState } from "react";
import { EmailTemplate, TemplateCategory } from "../../types/template";

export type SortOption = "name-asc" | "name-desc" | "date-newest" | "date-oldest" | "category";

/**
 * Custom hook to encapsulate the filtering, searching, and sorting logic for email templates.
 * This simplifies the main TemplateLibrary component and improves testability and readability.
 *
 * @param {EmailTemplate[]} templates - The complete list of templates to filter and sort.
 * @returns An object containing the derived state (filteredTemplates, filteredCategories) and
 *          the state setters (searchQuery, selectedCategory, sortBy) needed for the UI.
 */
export function useTemplateFilter(templates: EmailTemplate[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "All">("All");
  const [selectedBlock, setSelectedBlock] = useState<string>("All"); // Added for block filtering
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [excludedFolders, setExcludedFolders] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");

  const availableBlocks = useMemo(() => {
    const blocks = new Set<string>();
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.blocks && Array.isArray(template.blocks)) {
        template.blocks.forEach((block) => blocks.add(block));
      }
    });
    return Array.from(blocks).sort();
  }, [templates]);

  const rootFolders = useMemo(() => {
    const folders = new Set<string>();
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.folderPath) {
        const rootFolder = template.folderPath.split(" / ")[0];
        if (rootFolder) {
          folders.add(rootFolder);
        }
      }
    });
    return Array.from(folders).sort();
  }, [templates]);

  const folderStats = useMemo(() => {
    const stats: Record<string, number> = {};
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.folderPath) {
        const rootFolder = template.folderPath.split(" / ")[0];
        if (rootFolder) {
          stats[rootFolder] = (stats[rootFolder] || 0) + 1;
        }
      }
    });
    return stats;
  }, [templates]);

  const { cleanQuery, searchBlock } = useMemo(() => {
    const blockMatch = searchQuery.match(/<!(?:--)?\s*([^\s]+)/i);
    const searchBlockRaw = blockMatch ? blockMatch[1] : null;

    let searchBlock = null;
    if (searchBlockRaw) {
      const lowerRaw = searchBlockRaw.toLowerCase();
      searchBlock = 
        availableBlocks.find((b) => b.toLowerCase() === lowerRaw) ||
        availableBlocks.find((b) => b.toLowerCase().startsWith(lowerRaw)) ||
        availableBlocks.find((b) => b.toLowerCase().includes(lowerRaw)) || 
        searchBlockRaw;
    }

    const cleanQuery = searchQuery.replace(/<!(?:--)?\s*[^\s]+/gi, "").trim();
    return { cleanQuery, searchBlock };
  }, [searchQuery, availableBlocks]);

  const activeBlockFilter = searchBlock || (selectedBlock !== "All" ? selectedBlock : undefined);

  const filteredTemplates = useMemo(() => {
    const filtered = (Array.isArray(templates) ? templates : []).filter((template) => {
      if (selectedCategory !== "All" && template.category !== selectedCategory) {
        return false;
      }

      if (selectedBlock !== "All" && (!template.blocks || !template.blocks.includes(selectedBlock))) {
        return false;
      }

      if (searchBlock) {
        if (!template.blocks) return false;
        const lowerSearchBlock = searchBlock.toLowerCase();
        // Since searchBlock is heavily normalized and resolved against availableBlocks, 
        // we should enforce exact case-insensitive matching to prevent substring bleeding
        // (e.g. 'Note' search returning templates that only have 'Editor note').
        const hasMatchingBlock = template.blocks.some((b) => b.toLowerCase() === lowerSearchBlock);
        if (!hasMatchingBlock) return false;
      }

      const rootFolder = template.folderPath?.split(" / ")[0];

      if (rootFolder && excludedFolders.has(rootFolder)) {
        return false;
      }

      if (selectedFolders.size > 0) {
        if (!rootFolder || !selectedFolders.has(rootFolder)) {
          return false;
        }
      }

      if (cleanQuery) {
        const query = cleanQuery.toLowerCase();
        return template.name.toLowerCase().includes(query) || template.category.toLowerCase().includes(query) || template.tags.some((tag) => tag.toLowerCase().includes(query)) || template.description?.toLowerCase().includes(query) || template.filePath.toLowerCase().includes(query) || template.folderPath?.toLowerCase().includes(query);
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        case "name-desc":
          return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
        case "date-newest":
          return (b.lastModified || 0) - (a.lastModified || 0);
        case "date-oldest":
          return (a.lastModified || 0) - (b.lastModified || 0);
        case "category": {
          const categoryCompare = a.category.localeCompare(b.category);
          if (categoryCompare !== 0) return categoryCompare;
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }
        default:
          return 0;
      }
    });
  }, [templates, selectedCategory, selectedBlock, selectedFolders, excludedFolders, cleanQuery, searchBlock, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedFolders,
    setSelectedFolders,
    excludedFolders,
    setExcludedFolders,
    sortBy,
    setSortBy,
    rootFolders,
    folderStats,
    availableBlocks, // Export availableBlocks
    selectedBlock, // Export selectedBlock
    setSelectedBlock, // Export setter
    activeBlockFilter, // Export combined block filter
    filteredTemplates,
  };
}
