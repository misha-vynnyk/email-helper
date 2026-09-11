import { useEffect,useRef, useState } from "react";

import { getImageDimensionsFromBytes } from "../../utils/imageUtils";

const IMAGE_DETECT_DEBOUNCE_MS = 250;

/**
 * Overwrites width/height on every embedded-base64 <img> with the REAL pixel
 * size measured from its own bytes, instead of whatever display size the
 * source document (e.g. Google Docs) declared — the doc's own attribute can
 * be arbitrary (an image resized smaller in the doc, then pasted) and every
 * downstream consumer (wrapImg/imageRowHtml) needs the actual resolution to
 * decide whether upscaling would lose quality.
 */
function withRealImageDimensions(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (imgTag) => {
    const match = imgTag.match(/\ssrc="data:image\/[^;]+;base64,([^"]+)"/i);
    if (!match) return imgTag;
    try {
      const byteChars = atob(match[1]);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const dims = getImageDimensionsFromBytes(byteArray);
      if (!dims || !dims.width || !dims.height) return imgTag;
      return imgTag
        .replace(/\swidth=["'][^"']*["']/gi, "")
        .replace(/\sheight=["'][^"']*["']/gi, "")
        .replace(/^<img/i, `<img width="${dims.width}" height="${dims.height}"`);
    } catch {
      return imgTag;
    }
  });
}

interface UseEditorSyncProps {
  editorRef: React.RefObject<HTMLDivElement>;
  rawPastedHtmlRef?: React.MutableRefObject<string | null>;
  showImageProcessorRef: React.RefObject<boolean>;
  setShowImageProcessor: React.Dispatch<React.SetStateAction<boolean>>;
  setTriggerExtract: React.Dispatch<React.SetStateAction<number>>;
  clearMemory: () => void;
}

export function useEditorSync({
  editorRef,
  rawPastedHtmlRef,
  showImageProcessorRef,
  setShowImageProcessor,
  setTriggerExtract,
  clearMemory,
}: UseEditorSyncProps) {
  const [inputHtml, setInputHtml] = useState<string>("");
  const imageDetectTimerRef = useRef<number | null>(null);

  // Stabilize clearMemory via ref so it doesn't cause useEffect to re-run
  const clearMemoryRef = useRef(clearMemory);
  clearMemoryRef.current = clearMemory;

  useEffect(() => {
    const editorEl = editorRef.current;
    if (editorEl) {
      const scheduleImageSync = () => {
        if (imageDetectTimerRef.current) {
          window.clearTimeout(imageDetectTimerRef.current);
        }
        imageDetectTimerRef.current = window.setTimeout(() => {
          if (!editorRef.current) return;

          const hasImages = editorRef.current.querySelector("img") !== null;
          if (hasImages) {
            setShowImageProcessor(true);
          }

          if (hasImages || showImageProcessorRef.current) {
            setTriggerExtract((prev) => prev + 1);
          }
        }, IMAGE_DETECT_DEBOUNCE_MS);
      };

      const handlePaste = (e: ClipboardEvent) => {
        const rawHtml = e.clipboardData?.getData("text/html");
        if (rawHtml) {
          // Overwrite the doc's own declared width/height with the image's real
          // measured resolution before anything downstream reads it.
          const html = withRealImageDimensions(rawHtml);

          // Save unmodified raw HTML for Advanced converter (before browser or our code alters it).
          if (rawPastedHtmlRef) rawPastedHtmlRef.current = html;

          // For diagnostics panel: replace large base64 with human-readable placeholder
          const cleanHtml = html.replace(/src="data:image\/[^;]+;base64,[^"]{100,}"/g, (match) => {
            const mimeType = match.match(/data:image\/([^;]+)/)?.[1] || "unknown";
            const base64Match = match.match(/base64,([^"]+)/);
            const byteCount = base64Match ? Math.ceil((base64Match[1].length * 3) / 4) : 0;
            return `src="[IMAGE: ${mimeType}, ${byteCount} bytes]"`;
          });
          setInputHtml(cleanHtml);

          // For the editor DOM: replace base64 src values with blob: URLs
          // so that ImageProcessor can detect and process actual image data
          const hasBase64Images = /src="data:image\/[^;]+;base64,[^"]{100,}"/.test(html);
          if (hasBase64Images) {
            e.preventDefault();

            const processedHtml = html.replace(/src="(data:image\/([^;]+);base64,[^"]+)"/g, (_match, dataUrl, mimeType) => {
              try {
                const base64 = dataUrl.split(",")[1];
                const byteChars = atob(base64);
                const byteArray = new Uint8Array(byteChars.length);
                for (let idx = 0; idx < byteChars.length; idx++) {
                  byteArray[idx] = byteChars.charCodeAt(idx);
                }
                const blob = new Blob([byteArray], { type: `image/${mimeType}` });
                const blobUrl = URL.createObjectURL(blob);
                return `src="${blobUrl}"`;
              } catch {
                return _match; // keep original if conversion fails
              }
            });

            // Insert processed HTML at cursor position
            let inserted = false;
            if (document.queryCommandSupported("insertHTML")) {
              inserted = document.execCommand("insertHTML", false, processedHtml);
            }

            if (!inserted) {
              // Fallback to manual range insertion. window.getSelection() is
              // document-wide, not scoped to this editor — if the caret isn't
              // actually inside editorEl (stale/cleared selection, focus
              // elsewhere), inserting at it would drop pasted content into
              // whatever unrelated element the selection points at instead.
              const selection = window.getSelection();
              const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
              if (selection && range && editorEl.contains(range.commonAncestorContainer)) {
                range.deleteContents();
                const fragment = range.createContextualFragment(processedHtml);
                range.insertNode(fragment);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
              } else if (editorRef.current) {
                editorRef.current.innerHTML += processedHtml;
              }
            }
          }
        }
        clearMemoryRef.current();
        scheduleImageSync();
      };

      const handleInput = () => {
        if (rawPastedHtmlRef) rawPastedHtmlRef.current = null;
        clearMemoryRef.current();
        scheduleImageSync();
      };

      editorEl.addEventListener("paste", handlePaste as EventListener);
      editorEl.addEventListener("input", handleInput);

      return () => {
        editorEl.removeEventListener("paste", handlePaste as EventListener);
        editorEl.removeEventListener("input", handleInput);
        if (imageDetectTimerRef.current) {
          window.clearTimeout(imageDetectTimerRef.current);
          imageDetectTimerRef.current = null;
        }
      };
    }
  }, [editorRef, showImageProcessorRef, setShowImageProcessor, setTriggerExtract, rawPastedHtmlRef]);

  const clearInputHtml = () => setInputHtml("");

  return {
    inputHtml,
    clearInputHtml,
  };
}
