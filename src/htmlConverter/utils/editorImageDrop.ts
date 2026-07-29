import { dispatchInput, nearestBlock } from "./editorCommands";

/**
 * Drag-and-drop зображень у редактор — два джерела:
 * - локальні файли (dataTransfer.files, з Finder/Провідника) — пріоритетне;
 * - перетягнутий <img> з іншої вкладки/сторінки (dataTransfer як text/html).
 *   Це надійніший сигнал за bare text/uri-list: останній заповнюється для
 *   БУДЬ-ЯКОГО перетягнутого посилання, не лише зображення (звичайне <a href>
 *   теж дає text/uri-list), тоді як <img>-тег у text/html серіалізується
 *   лише коли реально тягнуть саме зображення.
 */

export interface DroppedImageSource {
  src: string;
  alt?: string;
}

/** blob:/relative src із чужої вкладки непридатний тут — приймаємо лише http(s)/data. */
const ACCEPTED_SRC_SCHEME = /^(https?:|data:)/i;

export function extractDroppedImageSources(dataTransfer: DataTransfer | null): DroppedImageSource[] {
  if (!dataTransfer) return [];

  const files = Array.from(dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
  if (files.length > 0) {
    return files.map((file) => ({ src: URL.createObjectURL(file), alt: file.name }));
  }

  const html = dataTransfer.getData("text/html");
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const sources: DroppedImageSource[] = [];
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && ACCEPTED_SRC_SCHEME.test(src)) {
      sources.push({ src, alt: img.getAttribute("alt") || undefined });
    }
  });
  return sources;
}

/**
 * Вставляє <img> у редактор біля точки drop — кожен у власному <div> (той самий
 * блок-на-рядок конвент, що й wrapSelectionWithMarkers). Якір — не сирий
 * текстовий офсет (це розщепило б блок-елемент посеред inline-тексту), а
 * найближчий БЛОКОВИЙ предок точки drop (nearestBlock, той самий хелпер, що й
 * коректно обробляє GDocs-обгортку docs-internal-guid). Немає підтримки
 * caretRangeFromPoint / drop поза текстом → додається в кінець редактора.
 * Навмисно НЕ видаляє поточне виділення — це вставка біля точки drop, а не
 * заміна виділеного тексту.
 */
export function insertImagesAtPoint(editorEl: HTMLElement, clientX: number, clientY: number, sources: DroppedImageSource[]): void {
  if (sources.length === 0) return;

  let anchor: Node | null = null;
  const range = document.caretRangeFromPoint?.(clientX, clientY);
  if (range && range.startContainer !== editorEl && editorEl.contains(range.startContainer)) {
    anchor = nearestBlock(editorEl, range.startContainer);
  }
  if (!anchor) anchor = editorEl.lastElementChild;

  for (const { src, alt } of sources) {
    const wrapper = document.createElement("div");
    const img = document.createElement("img");
    img.src = src;
    if (alt) img.alt = alt;
    wrapper.appendChild(img);

    if (anchor?.parentNode) {
      if (anchor.nextSibling) {
        anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);
      } else {
        anchor.parentNode.appendChild(wrapper);
      }
    } else {
      editorEl.appendChild(wrapper);
    }
    anchor = wrapper;
  }

  dispatchInput(editorEl);
}
