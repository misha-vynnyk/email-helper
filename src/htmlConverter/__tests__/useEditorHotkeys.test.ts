/**
 * @jest-environment jsdom
 *
 * Editor.focus() у toggleHeading/insertTextAtCaret безумовно колапсує
 * selection в jsdom при СПРАВЖНІЙ зміні фокусу (на відміну від реальних
 * браузерів) — редактор фокусується одразу після створення, до встановлення
 * тестового виділення, так само як у реальному використанні: keydown взагалі
 * не долітає до редактора, доки він не в фокусі, тож internal focus() під час
 * обробки гарячої клавіші завжди no-op.
 */
import { renderHook } from "@testing-library/react";
import type { RefObject } from "react";

import { useEditorHotkeys } from "../hooks/internal/useEditorHotkeys";

function createEditor(html: string): HTMLDivElement {
  const editor = document.createElement("div");
  editor.setAttribute("contenteditable", "true");
  editor.innerHTML = html;
  document.body.appendChild(editor);
  editor.focus();
  return editor;
}

function selectTextIn(node: Node, start = 0, end = (node.textContent ?? "").length): void {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
}

function press(editor: HTMLElement, init: KeyboardEventInit): boolean {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  return editor.dispatchEvent(event); // false => preventDefault() was called
}

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("useEditorHotkeys", () => {
  it("не реагує, коли вимкнено", () => {
    const editor = createEditor("<p>title</p>");
    selectTextIn(editor.querySelector("p")!.firstChild!);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: false, oneBrSymbol: "§" }));

    const notPrevented = press(editor, { code: "Digit1", ctrlKey: true, altKey: true });

    expect(notPrevented).toBe(true);
    expect(editor.innerHTML).toBe("<p>title</p>");
  });

  it("Ctrl+Alt+1 перетворює блок на h1", () => {
    const editor = createEditor("<p>title</p>");
    selectTextIn(editor.querySelector("p")!.firstChild!);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "§" }));

    const prevented = !press(editor, { code: "Digit1", ctrlKey: true, altKey: true });

    expect(prevented).toBe(true);
    expect(editor.innerHTML).toBe("<h1>title</h1>");
  });

  it("Cmd(meta)+Alt+5 перетворює блок на h5 (macOS)", () => {
    const editor = createEditor("<p>btn</p>");
    selectTextIn(editor.querySelector("p")!.firstChild!);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "§" }));

    press(editor, { code: "Digit5", metaKey: true, altKey: true });

    expect(editor.innerHTML).toBe("<h5>btn</h5>");
  });

  it("Ctrl+Alt+0 повертає активний заголовок до звичайного блока", () => {
    const editor = createEditor("<h4>quote</h4>");
    selectTextIn(editor.querySelector("h4")!.firstChild!);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "§" }));

    press(editor, { code: "Digit0", ctrlKey: true, altKey: true });

    expect(editor.innerHTML).toBe("<p>quote</p>");
  });

  it("Ctrl+Alt+0 без активного заголовка нічого не змінює (але preventDefault все одно спрацьовує)", () => {
    const editor = createEditor("<p>plain</p>");
    selectTextIn(editor.querySelector("p")!.firstChild!);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "§" }));

    const prevented = !press(editor, { code: "Digit0", ctrlKey: true, altKey: true });

    expect(prevented).toBe(true);
    expect(editor.innerHTML).toBe("<p>plain</p>");
  });

  it("Ctrl+Shift+Enter вставляє oneBrSymbol у позицію курсора", () => {
    const editor = createEditor("<p>onetwo</p>");
    const textNode = editor.querySelector("p")!.firstChild!;
    selectTextIn(textNode, 3, 3);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "§" }));

    press(editor, { key: "Enter", code: "Enter", ctrlKey: true, shiftKey: true });

    expect(editor.textContent).toBe("one§two");
  });

  it("використовує кастомний oneBrSymbol", () => {
    const editor = createEditor("<p>x</p>");
    selectTextIn(editor.querySelector("p")!.firstChild!, 1, 1);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "~~" }));

    press(editor, { key: "Enter", code: "Enter", ctrlKey: true, shiftKey: true });

    expect(editor.textContent).toBe("x~~");
  });

  it("ігнорує цифрові натискання без модифікатора Ctrl/Cmd+Alt", () => {
    const editor = createEditor("<p>title</p>");
    selectTextIn(editor.querySelector("p")!.firstChild!);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "§" }));

    press(editor, { code: "Digit1", altKey: true }); // no ctrl/meta
    press(editor, { code: "Digit1", ctrlKey: true }); // no alt

    expect(editor.innerHTML).toBe("<p>title</p>");
  });

  it("прибирає листенер після unmount", () => {
    const editor = createEditor("<p>title</p>");
    selectTextIn(editor.querySelector("p")!.firstChild!);
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    const { unmount } = renderHook(() => useEditorHotkeys({ editorRef, enabled: true, oneBrSymbol: "§" }));

    unmount();
    press(editor, { code: "Digit1", ctrlKey: true, altKey: true });

    expect(editor.innerHTML).toBe("<p>title</p>");
  });
});
