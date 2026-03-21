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
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [excludedFolders, setExcludedFolders] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");

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

  const filteredTemplates = useMemo(() => {
    const filtered = (Array.isArray(templates) ? templates : []).filter((template) => {
      if (selectedCategory !== "All" && template.category !== selectedCategory) {
        return false;
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

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          template.description?.toLowerCase().includes(query) ||
          template.filePath.toLowerCase().includes(query) ||
          template.folderPath?.toLowerCase().includes(query)
        );
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
  }, [templates, selectedCategory, selectedFolders, excludedFolders, searchQuery, sortBy]);

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
    filteredTemplates,
  };
}
