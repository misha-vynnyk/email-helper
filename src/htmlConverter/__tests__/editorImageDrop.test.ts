/**
 * @jest-environment jsdom
 *
 * jsdom не має DataTransfer/DragEvent/document.caretRangeFromPoint — стенди
 * тут: dataTransfer-подібний plain object (лише {files, getData} — усе, що
 * читає extractDroppedImageSources) і ручне присвоєння
 * document.caretRangeFromPoint (той самий санкціонований патерн, що й
 * useMarkerHighlighter для feature-detect CSS.highlights).
 */
import { extractDroppedImageSources, insertImagesAtPoint } from "../utils/editorImageDrop";

function fakeDataTransfer(opts: { files?: File[]; html?: string }): DataTransfer {
  return {
    files: opts.files ?? [],
    getData: (type: string) => (type === "text/html" ? opts.html ?? "" : ""),
  } as unknown as DataTransfer;
}

function createEditor(html: string): HTMLDivElement {
  const editor = document.createElement("div");
  editor.innerHTML = html;
  document.body.appendChild(editor);
  return editor;
}

afterEach(() => {
  document.body.innerHTML = "";
  delete (document as unknown as { caretRangeFromPoint?: unknown }).caretRangeFromPoint;
  delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL;
});

describe("extractDroppedImageSources", () => {
  it("повертає [] для null dataTransfer", () => {
    expect(extractDroppedImageSources(null)).toEqual([]);
  });

  it("пріоритезує локальні файли-зображення, ігноруючи не-зображення", () => {
    (URL as unknown as { createObjectURL: (f: File) => string }).createObjectURL = () => "blob:mock-1";
    const imageFile = new File(["x"], "photo.png", { type: "image/png" });
    const textFile = new File(["x"], "notes.txt", { type: "text/plain" });
    const dt = fakeDataTransfer({ files: [imageFile, textFile] });

    const result = extractDroppedImageSources(dt);

    expect(result).toEqual([{ src: "blob:mock-1", alt: "photo.png" }]);
  });

  it("якщо файлів немає — витягує <img> з text/html (перетягнення із веб-сторінки)", () => {
    const dt = fakeDataTransfer({ html: '<img src="https://example.com/pic.jpg" alt="Pic">' });

    expect(extractDroppedImageSources(dt)).toEqual([{ src: "https://example.com/pic.jpg", alt: "Pic" }]);
  });

  it("приймає data: src з text/html", () => {
    const dt = fakeDataTransfer({ html: '<img src="data:image/png;base64,AAA">' });

    expect(extractDroppedImageSources(dt)).toEqual([{ src: "data:image/png;base64,AAA", alt: undefined }]);
  });

  it("відхиляє blob:/відносний src із чужої вкладки — неможливо використати в цьому origin", () => {
    const dt = fakeDataTransfer({ html: '<img src="blob:https://other-tab.example/xyz">' });

    expect(extractDroppedImageSources(dt)).toEqual([]);
  });

  it("звичайне перетягнуте посилання (<a>, без <img>) не дає жодного джерела", () => {
    const dt = fakeDataTransfer({ html: '<a href="https://example.com/page">click here</a>' });

    expect(extractDroppedImageSources(dt)).toEqual([]);
  });

  it("повертає [] коли немає ні файлів, ні html", () => {
    expect(extractDroppedImageSources(fakeDataTransfer({}))).toEqual([]);
  });
});

describe("insertImagesAtPoint", () => {
  it("нічого не робить для порожнього списку джерел (dispatchInput не викликається)", () => {
    const editor = createEditor("<p>content</p>");
    const onInput = jest.fn();
    editor.addEventListener("input", onInput);

    insertImagesAtPoint(editor, 0, 0, []);

    expect(editor.innerHTML).toBe("<p>content</p>");
    expect(onInput).not.toHaveBeenCalled();
  });

  it("без caretRangeFromPoint — додає в кінець редактора", () => {
    const editor = createEditor("<p>existing</p>");
    const onInput = jest.fn();
    editor.addEventListener("input", onInput);

    insertImagesAtPoint(editor, 10, 10, [{ src: "https://example.com/a.jpg", alt: "A" }]);

    expect(editor.innerHTML).toBe('<p>existing</p><div><img src="https://example.com/a.jpg" alt="A"></div>');
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("з caretRangeFromPoint — вставляє одразу після найближчого блокового предка точки drop", () => {
    const editor = createEditor("<p>first</p><p>second</p>");
    const firstP = editor.querySelectorAll("p")[0];
    (document as unknown as { caretRangeFromPoint: (x: number, y: number) => Range }).caretRangeFromPoint = () => {
      const range = document.createRange();
      range.setStart(firstP.firstChild!, 2);
      range.collapse(true);
      return range;
    };

    insertImagesAtPoint(editor, 5, 5, [{ src: "https://example.com/mid.jpg" }]);

    expect(editor.innerHTML).toBe('<p>first</p><div><img src="https://example.com/mid.jpg"></div><p>second</p>');
  });

  it("кілька зображень вставляються по порядку, суміжно, з ОДНИМ dispatchInput", () => {
    const editor = createEditor("<p>content</p>");
    const onInput = jest.fn();
    editor.addEventListener("input", onInput);

    insertImagesAtPoint(editor, 0, 0, [{ src: "https://a.test/1.jpg" }, { src: "https://a.test/2.jpg" }]);

    expect(editor.innerHTML).toBe('<p>content</p><div><img src="https://a.test/1.jpg"></div><div><img src="https://a.test/2.jpg"></div>');
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("не викликає range.deleteContents — існуюче виділення в редакторі лишається неторкнутим", () => {
    const editor = createEditor("<p>keep me selected</p>");
    const textNode = editor.querySelector("p")!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 4);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    insertImagesAtPoint(editor, 0, 0, [{ src: "https://example.com/b.jpg" }]);

    expect(editor.textContent).toContain("keep me selected");
  });
});
