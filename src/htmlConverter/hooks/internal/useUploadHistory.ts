import { useState, useCallback } from "react";
import { STORAGE_KEYS, UPLOAD_CONFIG } from "../../constants";
import type { UploadSession, UploadResult } from "../../types";

export function useUploadHistory() {
  const [uploadHistory, setUploadHistory] = useState<UploadSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAddToHistory = useCallback((category: string, folderName: string, results: UploadResult[], customAlts?: Record<string, string>) => {
    const newSession: UploadSession = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      category,
      folderName,
      files: results
        .filter((r) => r.success)
        .map((r) => ({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          filename: r.filename,
          url: r.url,
          shortPath: (() => {
            try {
              const u = new URL(r.url);
              return u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
            } catch {
              return r.url;
            }
          })(),
          category,
          folderName,
          alt: (r.fileId ? customAlts?.[r.fileId] : undefined) || customAlts?.[r.filename] || undefined,
        })),
    };

    setUploadHistory((prev) => {
      const updated = [newSession, ...prev].slice(0, UPLOAD_CONFIG.MAX_HISTORY_SESSIONS);
      localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setUploadHistory([]);
    localStorage.removeItem(STORAGE_KEYS.UPLOAD_HISTORY);
  }, []);

  const updateSessionAlts = useCallback((altMap: Record<string, string>) => {
    setUploadHistory((prev) => {
      const updatedHistory = prev.map((session) => ({
        ...session,
        files: session.files.map((file) => {
          if (altMap[file.url]) {
            return { ...file, alt: altMap[file.url] };
          }
          return file;
        }),
      }));
      localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  return {
    uploadHistory,
    handleAddToHistory,
    handleClearHistory,
    updateSessionAlts,
  };
}
