/**
 * Єдине джерело правди про структурні маркери конвертера.
 * Споживачі: CheatsheetPanel (шпаргалка), EditorSelectionToolbar (плаваючий тулбар),
 * useEditorHotkeys (гарячі клавіші), useMarkerHighlighter (підсвічування в редакторі).
 *
 * Як маркери розпізнає форматер (formatter.ts / ttt / alphaone):
 * - heading — як справжні HTML-теги (/<h1[^>]*>…<\/h1>/gi тощо);
 * - insert (oneBrSymbol) — як літеральний символ у тексті (utils.addOneBr);
 * - wrapper — як літеральні текстові пари open([\s\S]*?)close.
 * Advanced-конвеєр wrapper-маркери НЕ підтримує (worksInAdvanced: false).
 */

export type HeadingTag = "h1" | "h4" | "h5" | "h6";

export interface HeadingMarker {
  kind: "heading";
  tag: HeadingTag;
  labelEn: string;
  labelUk: string;
  hint?: string;
  /** Цифра для Cmd/Ctrl+Alt+<digit> */
  hotkeyDigit: number;
}

export interface InsertMarker {
  kind: "insert";
  /** Літеральний текст для вставки (oneBrSymbol) */
  text: string;
  labelEn: string;
  labelUk: string;
  hint?: string;
}

export interface WrapperMarker {
  kind: "wrapper";
  open: string;
  close: string;
  /** Короткий підпис для кнопки тулбара */
  short: string;
  labelEn: string;
  labelUk: string;
  hint?: string;
  worksInAdvanced: false;
}

export type Marker = HeadingMarker | InsertMarker | WrapperMarker;

export function buildMarkers(oneBrSymbol: string): Marker[] {
  return [
    { kind: "heading", tag: "h1", labelEn: "Headline", labelUk: "Заголовок", hint: "headline", hotkeyDigit: 1 },
    { kind: "heading", tag: "h4", labelEn: "Padding", labelUk: "Відступ", hint: "padding both sides", hotkeyDigit: 4 },
    { kind: "heading", tag: "h5", labelEn: "Button", labelUk: "Кнопка", hint: "button", hotkeyDigit: 5 },
    { kind: "heading", tag: "h6", labelEn: "Small text", labelUk: "Малий текст", hint: "small text", hotkeyDigit: 6 },
    { kind: "insert", text: oneBrSymbol, labelEn: "Line break", labelUk: "Перенос рядка", hint: "1 <br>" },
    { kind: "wrapper", open: "i-r-s", close: "i-r-s-e", short: "i-r", labelEn: "Image right", labelUk: "Фото праворуч", hint: "wrap only normal text, no picture", worksInAdvanced: false },
    { kind: "wrapper", open: "i-l-s", close: "i-l-s-e", short: "i-l", labelEn: "Image left", labelUk: "Фото ліворуч", hint: "wrap only normal text, no picture", worksInAdvanced: false },
    { kind: "wrapper", open: "sign-i", close: "sign-i-e", short: "sign", labelEn: "Signature", labelUk: "Підпис", worksInAdvanced: false },
    { kind: "wrapper", open: "ftr-s", close: "ftr-e", short: "ftr", labelEn: "Footer", labelUk: "Футер", worksInAdvanced: false },
    { kind: "wrapper", open: "ftr-c", close: "ftr-c-e", short: "ftr-c", labelEn: "Centered footer", labelUk: "Футер по центру", worksInAdvanced: false },
  ];
}

/** Усі літеральні текстові токени, які варто підсвічувати в редакторі. */
export function getHighlightTokens(oneBrSymbol: string): string[] {
  const tokens: string[] = [];
  for (const marker of buildMarkers(oneBrSymbol)) {
    if (marker.kind === "insert") tokens.push(marker.text);
    if (marker.kind === "wrapper") tokens.push(marker.open, marker.close);
  }
  return tokens.filter(Boolean);
}
