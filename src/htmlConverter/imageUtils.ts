/**
 * Paste handler utilities for HTML converter
 */

type LogFunction = (msg: string) => void;

export function setupPasteHandler(editorElement: HTMLElement, log: LogFunction): void {
  editorElement.addEventListener('paste', (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const hasFiles = items.some(it => it.kind === 'file');
    const html = e.clipboardData?.getData('text/html') || '';
    const hasImgs = /<img\b[^>]*src=/i.test(html);
    const hasDataURIs = /src=["']data:image\//i.test(html);

    if (hasFiles || hasDataURIs) {
      log('📋 Вставлено зображення як файл/dataURL — все ок.');
    } else if (hasImgs) {
      log('📋 Вставлено зображення як URL — спробуємо завантажити. Якщо не вийде, з\'явиться попередження.');
    } else {
      log('📋 Вставлено без зображень.');
    }
  });
}
