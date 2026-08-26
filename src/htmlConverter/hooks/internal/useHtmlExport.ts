import { useCallback, useRef, useState } from "react";

import { downloadOrSaveFile } from "@/utils/downloadOrSaveFile";

import { convertAdvancedDetailed } from "../../advanced/index";
import { profile as alphaoneProfile } from "../../advanced/profiles/alphaone";
import { profile as defaultProfile } from "../../advanced/profiles/default";
import { profile as redProfile }     from "../../advanced/profiles/red";
import { profile as tttProfile }     from "../../advanced/profiles/ttt";
import { buildSimpleTemplates } from "../../simple/config/templates";
import { mergeSimpleTokens, tokens as simpleTokens } from "../../simple/config/tokens";
import { formatHtml, formatMjml } from "../../simple/formatter";
import { profile as simpleAlphaoneProfile } from "../../simple/profiles/alphaone";
import { profile as simpleDefaultProfile } from "../../simple/profiles/default";
import { profile as simpleRedProfile } from "../../simple/profiles/red";
import { profile as simpleTttProfile } from "../../simple/profiles/ttt";
import { replaceAltsInContent,replaceUrlsInContent, replaceUrlsInContentByMap } from "../../utils/contentReplacer";
import { supportsMjml } from "../useHtmlConverterLogic";
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
  oneBrSymbol?: string;
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
  oneBrSymbol,
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
          storageProfile === "red"      ? redProfile :
          defaultProfile;
        const conversion = convertAdvancedDetailed(rawHtml, profileOverride, oneBrSymbol);
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

      // Pick token profile based on active storage profile — same override object shape
      // used for advanced conversion above, mirrored here for the simple converter.
      const simpleProfileOverride =
        storageProfile === "ttt"      ? simpleTttProfile :
        storageProfile === "alphaone" ? simpleAlphaoneProfile :
        storageProfile === "red"      ? simpleRedProfile :
        simpleDefaultProfile;
      const simpleTok = mergeSimpleTokens(simpleTokens, simpleProfileOverride);
      const simpleTmpl = buildSimpleTemplates(simpleTok);
      let formattedContent = formatHtml(editorContent, simpleTok, simpleTmpl, oneBrSymbol);

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
  }, [addLog, editorRef, outputHtmlRef, outputMjmlRef, uploadedUrlMap, uploadedAltMap, setHasOutput, triggerResetReplacement, storageProfile, converterMode, rawPastedHtmlRef, oneBrSymbol]);

  const handleExportMJML = useCallback(() => {
    if (converterMode === "advanced") {
      addLog("ℹ️ MJML недоступний у режимі Advanced");
      return;
    }
    // Only "default" generates MJML (product decision, not a technical
    // limitation — ttt/alphaone/red all bail the same way advanced mode does).
    if (!supportsMjml(storageProfile)) {
      addLog(`ℹ️ Профіль ${storageProfile.toUpperCase()} підтримує лише HTML`);
      return;
    }
    if (!editorRef.current) return;
    try {
      const editorContent = editorRef.current.innerHTML;
      if (!editorContent.trim()) {
        addLog("⚠️ Редактор порожній, нічого експортувати");
        return;
      }

      // Pick token profile based on active storage profile (mirrors handleExportHTML above).
      // "red" already bailed out above (HTML-only), so it can't reach here.
      const simpleProfileOverride =
        storageProfile === "ttt"      ? simpleTttProfile :
        storageProfile === "alphaone" ? simpleAlphaoneProfile :
        simpleDefaultProfile;
      const simpleTok = mergeSimpleTokens(simpleTokens, simpleProfileOverride);
      const simpleTmpl = buildSimpleTemplates(simpleTok);
      let formattedContent = formatMjml(editorContent, simpleTok, simpleTmpl, oneBrSymbol);

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
  }, [addLog, editorRef, outputMjmlRef, uploadedUrlMap, uploadedAltMap, setHasOutput, triggerResetReplacement, storageProfile, converterMode, oneBrSymbol]);

  const downloadFile = useCallback(
    async (content: string, extension: string, fileName: string, approveNeeded: boolean) => {
      const name = fileName.replace(/\s+/g, "").toUpperCase();
      const approvalText = approveNeeded ? "(Approve needed)" : "";
      const fullName = `${name}_${extension}${approvalText}.html`;

      const outcome = await downloadOrSaveFile(content, fullName, {
        getFolder: () => downloadFolder,
        onFolderResolved: (folder) => setDownloadFolder?.(folder),
      });

      if (outcome.kind === "saved") addLog(`📥 Збережено: ${fullName}`);
      else if (outcome.kind === "file-exists") addLog(`⏹️ Збереження скасовано: ${fullName} вже існує`);
      else if (outcome.kind === "save-error") addLog(`❌ Помилка збереження: ${outcome.error ?? "невідома помилка"}`);
      else if (outcome.kind === "browser-download") addLog(`📥 Завантажено: ${fullName}`);
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
