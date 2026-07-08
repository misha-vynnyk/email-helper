/**
 * @jest-environment jsdom
 *
 * jsdom не має document.execCommand — тести покривають Range-fallback гілки,
 * якими користується і продакшн-код, коли execCommand відсутній/повертає false.
 *
 * Editor.focus() у продакшн-коді (toggleHeading/insertTextAtCaret) — jsdom
 * (на відміну від реальних браузерів) при СПРАВЖНІЙ зміні фокусу безумовно
 * колапсує selection у (element, 0) (HTMLOrSVGElement-impl.js), але вважає
 * елемент фокусованим лише за наявності РЕАЛЬНОГО атрибута contenteditable
 * (не просто властивості .contentEditable). Тому редактор явно фокусується
 * ОДРАЗУ після створення — до встановлення тестового виділення — так само,
 * як у реальному браузері фокус вже стоїть на редакторі до завершення
 * mouse-виділення тексту; повторний internal focus() тоді стає no-op і
 * виділення, встановлене тестом, зберігається.
 */
import { getActiveHeading, insertTextAtCaret, toggleHeading, wrapSelectionWithMarkers } from "../utils/editorCommands";

function createEditor(html: string): HTMLDivElement {
  const editor = document.createElement("div");
  editor.setAttribute("contenteditable", "true");
  editor.innerHTML = html;
  document.body.appendChild(editor);
  editor.focus();
  return editor;
}

function selectNodeContents(node: Node): void {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
}

function setCaret(node: Node, offset: number): void {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
}

afterEach(() => {
  document.body.innerHTML = "";
  window.getSelection()?.removeAllRanges();
});

describe("getActiveHeading", () => {
  it("повертає тег heading-предка", () => {
    const editor = createEditor("<h5>button text</h5>");
    selectNodeContents(editor.querySelector("h5")!.firstChild!);
    expect(getActiveHeading(editor)).toBe("h5");
  });

  it("повертає null для звичайного параграфа", () => {
    const editor = createEditor("<p>plain</p>");
    selectNodeContents(editor.querySelector("p")!.firstChild!);
    expect(getActiveHeading(editor)).toBeNull();
  });

  it("повертає null, коли selection поза редактором", () => {
    const editor = createEditor("<h1>inside</h1>");
    const outside = document.createElement("p");
    outside.textContent = "outside";
    document.body.appendChild(outside);
    selectNodeContents(outside.firstChild!);
    expect(getActiveHeading(editor)).toBeNull();
  });
});

describe("toggleHeading (fallback)", () => {
  it("перетворює <p> на <h1> і диспатчить input", () => {
    const editor = createEditor("<p>title</p>");
    const onInput = jest.fn();
    editor.addEventListener("input", onInput);
    selectNodeContents(editor.querySelector("p")!.firstChild!);

    toggleHeading(editor, "h1");

    expect(editor.innerHTML).toBe("<h1>title</h1>");
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("повторний клік по активному heading повертає <p>", () => {
    const editor = createEditor("<h1>title</h1>");
    selectNodeContents(editor.querySelector("h1")!.firstChild!);

    toggleHeading(editor, "h1");

    expect(editor.innerHTML).toBe("<p>title</p>");
  });

  it("перемикає h5 → h6 напряму", () => {
    const editor = createEditor("<h5>text</h5>");
    selectNodeContents(editor.querySelector("h5")!.firstChild!);

    toggleHeading(editor, "h6");

    expect(editor.innerHTML).toBe("<h6>text</h6>");
  });

  it("обгортає голий текстовий вузол", () => {
    const editor = createEditor("bare text");
    selectNodeContents(editor.firstChild!);

    toggleHeading(editor, "h1");

    expect(editor.innerHTML).toBe("<h1>bare text</h1>");
  });
});

describe("insertTextAtCaret (fallback)", () => {
  it("вставляє текст у позицію курсора і диспатчить input", () => {
    const editor = createEditor("<p>onetwo</p>");
    const onInput = jest.fn();
    editor.addEventListener("input", onInput);
    setCaret(editor.querySelector("p")!.firstChild!, 3);

    insertTextAtCaret(editor, "§");

    expect(editor.textContent).toBe("one§two");
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("замінює виділення на текст", () => {
    const editor = createEditor("<p>DELETE</p>");
    selectNodeContents(editor.querySelector("p")!.firstChild!);

    insertTextAtCaret(editor, "§");

    expect(editor.textContent).toBe("§");
  });
});

describe("wrapSelectionWithMarkers", () => {
  it("ставить маркери окремими рядками навколо одного блока", () => {
    const editor = createEditor("<p>content</p>");
    const onInput = jest.fn();
    editor.addEventListener("input", onInput);
    selectNodeContents(editor.querySelector("p")!.firstChild!);

    wrapSelectionWithMarkers(editor, "i-r-s", "i-r-s-e");

    expect(editor.innerHTML).toBe("<div>i-r-s</div><p>content</p><div>i-r-s-e</div>");
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("обгортає діапазон із кількох блоків", () => {
    const editor = createEditor("<p>first</p><p>second</p><p>third</p>");
    const paragraphs = editor.querySelectorAll("p");
    const range = document.createRange();
    range.setStart(paragraphs[0].firstChild!, 2);
    range.setEnd(paragraphs[1].firstChild!, 3);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    wrapSelectionWithMarkers(editor, "ftr-s", "ftr-e");

    expect(editor.innerHTML).toBe("<div>ftr-s</div><p>first</p><p>second</p><div>ftr-e</div><p>third</p>");
  });

  it("працює при виділенні всього редактора (select all)", () => {
    const editor = createEditor("<p>first</p><p>last</p>");
    selectNodeContents(editor);

    wrapSelectionWithMarkers(editor, "sign-i", "sign-i-e");

    expect(editor.innerHTML).toBe("<div>sign-i</div><p>first</p><p>last</p><div>sign-i-e</div>");
  });

  it("нічого не робить без виділення в редакторі", () => {
    const editor = createEditor("<p>content</p>");
    const outside = document.createElement("p");
    outside.textContent = "outside";
    document.body.appendChild(outside);
    selectNodeContents(outside.firstChild!);

    wrapSelectionWithMarkers(editor, "i-l-s", "i-l-s-e");

    expect(editor.innerHTML).toBe("<p>content</p>");
  });
});
