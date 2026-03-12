import { useState, useRef, useEffect } from "react";

const IMAGE_DETECT_DEBOUNCE_MS = 250;

interface UseEditorSyncProps {
  editorRef: React.RefObject<HTMLDivElement>;
  showImageProcessorRef: React.RefObject<boolean>;
  setShowImageProcessor: React.Dispatch<React.SetStateAction<boolean>>;
  setTriggerExtract: React.Dispatch<React.SetStateAction<number>>;
  clearMemory: () => void;
}

export function useEditorSync({
  editorRef,
  showImageProcessorRef,
  setShowImageProcessor,
  setTriggerExtract,
  clearMemory,
}: UseEditorSyncProps) {
  const [inputHtml, setInputHtml] = useState<string>("");
  const imageDetectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (editorRef.current) {
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
        const html = e.clipboardData?.getData("text/html");
        if (html) {
          const cleanHtml = html.replace(/src="data:image\/[^;]+;base64,[^"]{100,}"/g, (match) => {
            const mimeType = match.match(/data:image\/([^;]+)/)?.[1] || "unknown";
            const length = match.length;
            return `src="[IMAGE: ${mimeType}, ${length} bytes]"`;
          });
          setInputHtml(cleanHtml);
        }
        clearMemory();
        scheduleImageSync();
      };

      const handleInput = () => {
        clearMemory();
        scheduleImageSync();
      };

      editorRef.current.addEventListener("paste", handlePaste as EventListener);
      editorRef.current.addEventListener("input", handleInput);

      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener("paste", handlePaste as EventListener);
          editorRef.current.removeEventListener("input", handleInput);
        }
        if (imageDetectTimerRef.current) {
          window.clearTimeout(imageDetectTimerRef.current);
          imageDetectTimerRef.current = null;
        }
      };
    }
  }, [editorRef, showImageProcessorRef, setShowImageProcessor, setTriggerExtract, clearMemory]);

  const clearInputHtml = () => setInputHtml("");

  return {
    inputHtml,
    clearInputHtml,
  };
}
