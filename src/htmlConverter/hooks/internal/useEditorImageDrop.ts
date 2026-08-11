import { useEffect, useState } from "react";

import { extractDroppedImageSources, insertImagesAtPoint } from "../../utils/editorImageDrop";

/**
 * Drag-and-drop зображень у редактор — завжди увімкнено (на відміну від
 * editorSelectionToolbar/editorMarkerHighlight/editorHotkeys, це не
 * експериментальна beta-фіча, а базова можливість типу paste).
 *
 * КРИТИЧНО: preventDefault на drop — умовний, лише коли реально знайдено
 * зображення для вставки. Інакше зламали б нативну поведінку contenteditable
 * "перетягнути вибраний текст в інше місце цього ж редактора" — вона працює
 * без жодного коду сьогодні, і drop-хендлер, який завжди робить preventDefault,
 * тихо ковтав би перетягнутий текст (defaults action ніколи не спрацьовує,
 * а власного відновлення тексту тут немає).
 */

interface UseEditorImageDropProps {
  editorRef: React.RefObject<HTMLDivElement>;
}

const DRAG_CANDIDATE_TYPES = ["Files", "text/html", "text/uri-list"];

function isDragCandidate(dataTransfer: DataTransfer | null): boolean {
  return !!dataTransfer && DRAG_CANDIDATE_TYPES.some((type) => dataTransfer.types.includes(type));
}

export function useEditorImageDrop({ editorRef }: UseEditorImageDropProps): { isDragOver: boolean } {
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;

    // Лічильник, а не boolean: dragenter/dragleave булькають із вкладених
    // дітей (параграфи, зображення), наївний boolean блимав би на кожній межі
    // вкладеного елемента всередині заповненого редактора.
    let depth = 0;

    const handleDragEnter = (e: DragEvent) => {
      if (!isDragCandidate(e.dataTransfer)) return;
      depth++;
      setIsDragOver(true);
    };

    const handleDragOver = (e: DragEvent) => {
      // Має превентитись на КОЖНОМУ спрацюванні — інакше drop не станеться
      // взагалі (спека). getData() тут ще недоступний, тож дивимось лише types.
      if (!isDragCandidate(e.dataTransfer)) return;
      e.preventDefault();
    };

    const handleDragLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      depth = 0;
      setIsDragOver(false);
      const sources = extractDroppedImageSources(e.dataTransfer);
      if (sources.length === 0) return; // не наше — нативна поведінка (напр. переміщення тексту) лишається неторкнутою
      e.preventDefault();
      insertImagesAtPoint(editorEl, e.clientX, e.clientY, sources);
    };

    editorEl.addEventListener("dragenter", handleDragEnter);
    editorEl.addEventListener("dragover", handleDragOver);
    editorEl.addEventListener("dragleave", handleDragLeave);
    editorEl.addEventListener("drop", handleDrop);
    return () => {
      editorEl.removeEventListener("dragenter", handleDragEnter);
      editorEl.removeEventListener("dragover", handleDragOver);
      editorEl.removeEventListener("dragleave", handleDragLeave);
      editorEl.removeEventListener("drop", handleDrop);
    };
  }, [editorRef]);

  return { isDragOver };
}
