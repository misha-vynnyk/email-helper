/**
 * @jest-environment jsdom
 *
 * jsdom не має DragEvent — стенд тут: plain Event(bubbles, cancelable) із
 * вручну присвоєними dataTransfer/clientX/clientY (усе, що читає хук і
 * insertImagesAtPoint). Той самий підхід, що editorCommands.test.ts
 * використовує для DOM-можливостей, яких немає в jsdom.
 */
import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";

import { useEditorImageDrop } from "../hooks/internal/useEditorImageDrop";

function createEditor(html = ""): HTMLDivElement {
  const editor = document.createElement("div");
  editor.innerHTML = html;
  document.body.appendChild(editor);
  return editor;
}

function fakeDataTransfer(opts: { types: string[]; files?: File[]; html?: string }) {
  return {
    types: opts.types,
    files: opts.files ?? [],
    getData: (type: string) => (type === "text/html" ? opts.html ?? "" : ""),
  } as unknown as DataTransfer;
}

function fireDrag(editor: HTMLElement, type: string, dataTransfer: DataTransfer, extra: Partial<{ clientX: number; clientY: number }> = {}): boolean {
  const event = new Event(type, { bubbles: true, cancelable: true }) as unknown as DragEvent;
  Object.assign(event, { dataTransfer, clientX: extra.clientX ?? 0, clientY: extra.clientY ?? 0 });
  let notPrevented = true;
  act(() => {
    notPrevented = editor.dispatchEvent(event);
  });
  return notPrevented; // false => preventDefault() was called
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useEditorImageDrop", () => {
  it("dragover з файловим drag превентиться (інакше drop не спрацює)", () => {
    const editor = createEditor();
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorImageDrop({ editorRef }));

    const prevented = !fireDrag(editor, "dragover", fakeDataTransfer({ types: ["Files"] }));

    expect(prevented).toBe(true);
  });

  it("dragover без релевантних types НЕ превентиться", () => {
    const editor = createEditor();
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorImageDrop({ editorRef }));

    const prevented = !fireDrag(editor, "dragover", fakeDataTransfer({ types: ["text/plain"] }));

    expect(prevented).toBe(false);
  });

  it("drop без зображень НЕ превентиться — нативна поведінка (напр. переміщення тексту) лишається неторкнутою", () => {
    const editor = createEditor("<p>content</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorImageDrop({ editorRef }));

    // text/html без <img> — звичайне перетягнуте посилання чи текст
    const prevented = !fireDrag(editor, "drop", fakeDataTransfer({ types: ["text/html"], html: '<a href="https://x.test">link</a>' }));

    expect(prevented).toBe(false);
    expect(editor.innerHTML).toBe("<p>content</p>");
  });

  it("drop із зображенням превентиться і вставляє <img>", () => {
    const editor = createEditor("<p>content</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    renderHook(() => useEditorImageDrop({ editorRef }));

    const prevented = !fireDrag(editor, "drop", fakeDataTransfer({ types: ["text/html"], html: '<img src="https://example.com/pic.jpg">' }));

    expect(prevented).toBe(true);
    expect(editor.querySelector("img")?.src).toBe("https://example.com/pic.jpg");
  });

  it("isDragOver: true на dragenter-кандидат, false після drop", () => {
    const editor = createEditor();
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    const { result } = renderHook(() => useEditorImageDrop({ editorRef }));

    expect(result.current.isDragOver).toBe(false);

    fireDrag(editor, "dragenter", fakeDataTransfer({ types: ["Files"] }));
    expect(result.current.isDragOver).toBe(true);

    fireDrag(editor, "drop", fakeDataTransfer({ types: ["Files"], files: [] }));
    expect(result.current.isDragOver).toBe(false);
  });

  it("isDragOver лишається true при dragleave вкладеного елемента, доки лічильник не дійде до 0 (без блимання)", () => {
    const editor = createEditor("<p><span>nested</span></p>");
    const child = editor.querySelector("span")!;
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    const { result } = renderHook(() => useEditorImageDrop({ editorRef }));

    fireDrag(editor, "dragenter", fakeDataTransfer({ types: ["Files"] })); // enter editor
    fireDrag(child, "dragenter", fakeDataTransfer({ types: ["Files"] })); // enter nested child (bubbles)
    expect(result.current.isDragOver).toBe(true);

    fireDrag(child, "dragleave", fakeDataTransfer({ types: ["Files"] })); // leave nested child — still inside editor
    expect(result.current.isDragOver).toBe(true);

    fireDrag(editor, "dragleave", fakeDataTransfer({ types: ["Files"] })); // leave editor itself
    expect(result.current.isDragOver).toBe(false);
  });

  it("прибирає листенери після unmount", () => {
    const editor = createEditor("<p>content</p>");
    const editorRef: RefObject<HTMLDivElement> = { current: editor };
    const { unmount } = renderHook(() => useEditorImageDrop({ editorRef }));

    unmount();
    fireDrag(editor, "drop", fakeDataTransfer({ types: ["text/html"], html: '<img src="https://example.com/pic.jpg">' }));

    expect(editor.querySelector("img")).toBeNull();
  });
});
