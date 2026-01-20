/**
 * Image processing utilities for HTML converter
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type LogFunction = (msg: string) => void;

function toKebab(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function getBlobFromSrc(src: string, log: LogFunction): Promise<Blob | null> {
  try {
    const res = await fetch(src, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.blob();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    log('⚠️ Не вдалося завантажити зображення: ' + src + ' — ' + message);
    return null;
  }
}

// Масштабувати до ≤600 по ширині + конвертувати у JPG з фоном
async function toJpeg600(
  blob: Blob,
  bgColor: string = '#ffffff',
  quality: number = 0.82
): Promise<{ outBlob: Blob; targetW: number; targetH: number; wasDownscaled: boolean }> {
  const bmp = await createImageBitmap(blob);
  const naturalW = bmp.width;
  const naturalH = bmp.height;
  const targetW = Math.min(600, naturalW);
  const targetH = Math.round(naturalH * (targetW / naturalW));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(bmp, 0, 0, targetW, targetH);

  const outBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      'image/jpeg',
      quality
    );
  });

  const wasDownscaled = targetW < naturalW;
  return { outBlob, targetW, targetH, wasDownscaled };
}

export async function downloadImagesFolder(
  editorElement: HTMLElement,
  folderName: string,
  bgColor: string,
  quality: number,
  log: LogFunction
): Promise<void> {
  const rawName = folderName.trim() || 'images';
  const folderNameKebab = toKebab(rawName) || 'images';
  const imgs = Array.from(editorElement.querySelectorAll('img'));

  if (!imgs.length) {
    log('❌ Немає <img> у редакторі.');
    return;
  }

  const zip = new JSZip();
  const imagesDir = zip.folder(folderNameKebab);

  if (!imagesDir) {
    log('❌ Не вдалося створити папку в ZIP');
    return;
  }

  let index = 1;
  let saved = 0;

  for (const img of imgs) {
    const src = img.getAttribute('src');
    if (!src) continue;

    const blob = await getBlobFromSrc(src, log);
    if (!blob) {
      log('— Пропущено (CORS/помилка): ' + src);
      continue;
    }

    const { outBlob } = await toJpeg600(blob, bgColor, quality);
    const fileName = `img-${index}.jpg`;
    index++;

    const arr = await outBlob.arrayBuffer();
    imagesDir.file(fileName, arr);
    saved++;
    log(`• Додано: ${folderNameKebab}/${fileName}`);
  }

  if (saved === 0) {
    log('❌ Немає, що зберігати.');
    return;
  }

  const blobZip = await zip.generateAsync({ type: 'blob' });
  saveAs(blobZip, `${folderNameKebab}.zip`);
  log(`✅ Готово: ${folderNameKebab}.zip (лише папка з JPG)`);
}

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
