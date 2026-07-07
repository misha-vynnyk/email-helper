import { useCallback, useRef, useState } from "react";

import { getElectronAPI } from "@/hooks/useElectronAPI";

import { convertAdvancedDetailed } from "../../advanced/index";
import { profile as alphaoneProfile } from "../../advanced/profiles/alphaone";
import { profile as defaultProfile } from "../../advanced/profiles/default";
import { profile as tttProfile }     from "../../advanced/profiles/ttt";
import { formatHtmlAlphaone, formatMjmlAlphaone } from "../../alphaone/formatter";
import { formatHtml, formatMjml } from "../../formatter";
import { formatHtmlTTT, formatMjmlTTT } from "../../ttt/formatter";
import { replaceAltsInContent,replaceUrlsInContent, replaceUrlsInContentByMap } from "../../utils/contentReplacer";
import type { ConverterMode,StorageProfile } from "../useHtmlConverterLogic";

interface UseHtmlExportProps {
  editorRef: React.RefObject<HTMLDivElement>;
  outputHtmlRef: React.RefObject<HTMLTextAreaElement>;
  outputMjmlRef: React.RefObject<HTMLTextAreaElement>;
  uploadedUrlMap: Record<string, string>;
  uploadedAltMap: Record<string, string>;
  addLog: (msg: string) => void;
  setHasOutput: (val: boolean) => void;
  storageProfile: StorageProfile;
  converterMode: ConverterMode;
  rawPastedHtmlRef: React.MutableRefObject<string | null>;
  downloadFolder?: string;
  setDownloadFolder?: (folder: string) => void;
}

export function useHtmlExport({
  editorRef,
  outputHtmlRef,
  outputMjmlRef,
  uploadedUrlMap,
  uploadedAltMap,
  addLog,
  setHasOutput,
  storageProfile,
  converterMode,
  rawPastedHtmlRef,
  downloadFolder = "",
  setDownloadFolder,
}: UseHtmlExportProps) {
  const [previewHtml, setPreviewHtml] = useState("");
  const clearPreviewHtml = useCallback(() => setPreviewHtml(""), []);

  const resetReplacementRef = useRef<(() => void) | null>(null);

  const handleResetReplacement = useCallback((resetFn: () => void) => {
    resetReplacementRef.current = resetFn;
  }, []);

  const triggerResetReplacement = useCallback(() => {
    if (resetReplacementRef.current) resetReplacementRef.current();
  }, []);

  const handleReplaceUrls = useCallback(
    (urlMap: Record<string, string>) => {
      const storageUrls = Object.values(urlMap);

      if (storageUrls.length === 0) {
        addLog(`⚠️ Немає URLs для заміни`);
        return;
      }

      const processOutput = (ref: React.RefObject<HTMLTextAreaElement>, type: "HTML" | "MJML") => {
        if (ref.current?.value) {
          let content = ref.current.value;
          const regex =
            type === "HTML"
              ? /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi
              : /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;

          const mapped = replaceUrlsInContentByMap(content, regex, urlMap);

          if (mapped.count > 0) {
            content = mapped.replaced;
            addLog(`🔄 Замінено ${mapped.count} посилань в Output ${type}`);
          } else {
            const positional = replaceUrlsInContent(content, regex, storageUrls);
            content = positional.replaced;
            if (positional.count > 0)
              addLog(`🔄 Замінено ${positional.count} посилань в Output ${type}`);
          }

          const altResult = replaceAltsInContent(content, uploadedAltMap);
          if (altResult.count > 0) {
            content = altResult.replaced;
            addLog(`🔄 Замінено ${altResult.count} ALT-атрибутів в Output ${type}`);
          }

          ref.current.value = content;
        }
      };

      processOutput(outputHtmlRef, "HTML");
      processOutput(outputMjmlRef, "MJML");
    },
    [addLog, uploadedAltMap, outputHtmlRef, outputMjmlRef]
  );

  const handleExportHTML = useCallback(() => {
    if (!editorRef.current) return;
    try {
      const editorContent = editorRef.current.innerHTML;
      if (!editorContent.trim()) {
        addLog("⚠️ Редактор порожній, нічого експортувати");
        return;
      }

      // Advanced mode: convert raw pasted HTML (unmodified) via the new pipeline.
      if (converterMode === "advanced") {
        const rawHtml = rawPastedHtmlRef.current ?? editorContent;
        const profileOverride =
          storageProfile === "ttt"      ? tttProfile :
          storageProfile === "alphaone" ? alphaoneProfile :
          defaultProfile;
        const conversion = convertAdvancedDetailed(rawHtml, profileOverride);
        let result = conversion.html;
        for (const warning of conversion.warnings) {
          addLog(`⚠️ ${warning}`);
        }

        if (Object.keys(uploadedUrlMap).length > 0) {
          const storageUrls = Object.values(uploadedUrlMap);
          const regex = /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;
          const mapped = replaceUrlsInContentByMap(result, regex, uploadedUrlMap);
          result = mapped.count > 0
            ? mapped.replaced
            : replaceUrlsInContent(result, regex, storageUrls).replaced;
          result = replaceAltsInContent(result, uploadedAltMap).replaced;
        }

        if (outputHtmlRef.current) outputHtmlRef.current.value = result;
        if (outputMjmlRef.current) outputMjmlRef.current.value = "";
        setPreviewHtml(result);
        setHasOutput(true);
        triggerResetReplacement();
        addLog(`✅ Advanced HTML конвертовано [${storageProfile.toUpperCase()}]`);
        return;
      }

      // Pick formatter based on active profile
      const formatFn = storageProfile === "ttt" ? formatHtmlTTT : storageProfile === "alphaone" ? formatHtmlAlphaone : formatHtml;
      let formattedContent = formatFn(editorContent);

      if (Object.keys(uploadedUrlMap).length > 0) {
        const storageUrls = Object.values(uploadedUrlMap);
        const regex = /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;
        const mapped = replaceUrlsInContentByMap(formattedContent, regex, uploadedUrlMap);
        formattedContent =
          mapped.count > 0
            ? mapped.replaced
            : replaceUrlsInContent(formattedContent, regex, storageUrls).replaced;
        formattedContent = replaceAltsInContent(formattedContent, uploadedAltMap).replaced;
      }

      if (outputHtmlRef.current) {
        outputHtmlRef.current.value = formattedContent;
      }
      setPreviewHtml(formattedContent);
      setHasOutput(true);
      triggerResetReplacement();
      addLog(`✅ HTML експортовано [${storageProfile.toUpperCase()}]`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Невідома помилка";
      addLog(`❌ Помилка експорту HTML: ${message}`);
    }
  }, [addLog, editorRef, outputHtmlRef, outputMjmlRef, uploadedUrlMap, uploadedAltMap, setHasOutput, triggerResetReplacement, storageProfile, converterMode, rawPastedHtmlRef]);

  const handleExportMJML = useCallback(() => {
    if (converterMode === "advanced") {
      addLog("ℹ️ MJML недоступний у режимі Advanced");
      return;
    }
    if (!editorRef.current) return;
    try {
      const editorContent = editorRef.current.innerHTML;
      if (!editorContent.trim()) {
        addLog("⚠️ Редактор порожній, нічого експортувати");
        return;
      }

      // Pick formatter based on active profile
      const formatFn = storageProfile === "ttt" ? formatMjmlTTT : storageProfile === "alphaone" ? formatMjmlAlphaone : formatMjml;
      let formattedContent = formatFn(editorContent);

      if (Object.keys(uploadedUrlMap).length > 0) {
        const storageUrls = Object.values(uploadedUrlMap);
        const regex = /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;
        const mapped = replaceUrlsInContentByMap(formattedContent, regex, uploadedUrlMap);
        formattedContent =
          mapped.count > 0
            ? mapped.replaced
            : replaceUrlsInContent(formattedContent, regex, storageUrls).replaced;
        formattedContent = replaceAltsInContent(formattedContent, uploadedAltMap).replaced;
      }

      if (outputMjmlRef.current) {
        outputMjmlRef.current.value = formattedContent;
      }
      setHasOutput(true);
      triggerResetReplacement();
      addLog(`✅ MJML експортовано [${storageProfile.toUpperCase()}]`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Невідома помилка";
      addLog(`❌ Помилка експорту MJML: ${message}`);
    }
  }, [addLog, editorRef, outputMjmlRef, uploadedUrlMap, uploadedAltMap, setHasOutput, triggerResetReplacement, storageProfile, converterMode]);

  const downloadFile = useCallback(
    async (content: string, extension: string, fileName: string, approveNeeded: boolean) => {
      const name = fileName.replace(/\s+/g, "").toUpperCase();
      const approvalText = approveNeeded ? "(Approve needed)" : "";
      const fullName = `${name}_${extension}${approvalText}.html`;

      const electronAPI = getElectronAPI();
      if (electronAPI?.saveToPath) {
        let folder = downloadFolder;
        if (!folder) {
          const picked = await electronAPI.openFolderDialog();
          if (!picked) return;
          folder = picked;
          setDownloadFolder?.(folder);
        }
        const result = await electronAPI.saveToPath(content, folder, fullName);
        if (result.saved) addLog(`📥 Збережено: ${fullName}`);
        else addLog(`❌ Помилка збереження: ${result.error ?? "невідома помилка"}`);
        return;
      }

      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fullName;
      a.click();
      URL.revokeObjectURL(url);

      addLog(`📥 Завантажено: ${fullName}`);
    },
    [addLog, downloadFolder, setDownloadFolder]
  );

  return {
    handleResetReplacement,
    triggerResetReplacement,
    handleReplaceUrls,
    handleExportHTML,
    handleExportMJML,
    downloadFile,
    previewHtml,
    clearPreviewHtml,
  };
}
