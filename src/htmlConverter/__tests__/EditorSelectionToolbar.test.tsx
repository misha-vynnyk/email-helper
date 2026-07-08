/**
 * @jest-environment jsdom
 *
 * jsdom's Range.getBoundingClientRect() always returns an all-zero rect (no
 * layout engine), and the toolbar treats a zero-size rect as "nothing
 * selected" — so it's stubbed here to a plausible non-zero box.
 *
 * Editor.focus() inside toggleHeading/insertTextAtCaret unconditionally
 * collapses the selection in jsdom on a genuine focus change (unlike real
 * browsers) — the selection helpers below focus the editor first, mirroring
 * real usage where the mousedown that starts a text selection already
 * focuses the contenteditable div, so the internal focus() call the button
 * handlers make later is a no-op.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";

import { EditorSelectionToolbar } from "../components/EditorSelectionToolbar";
import type { ConverterMode } from "../hooks/useHtmlConverterLogic";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key: string, defaultValue?: string) => defaultValue ?? _key }),
}));

function Harness({ converterMode = "simple" as ConverterMode, oneBrSymbol = "§", enabled = true, html = "<p>select me please</p>" }: { converterMode?: ConverterMode; oneBrSymbol?: string; enabled?: boolean; html?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={editorRef} contentEditable suppressContentEditableWarning data-testid='editor' dangerouslySetInnerHTML={{ __html: html }} />
      <EditorSelectionToolbar editorRef={editorRef} converterMode={converterMode} oneBrSymbol={oneBrSymbol} enabled={enabled} />
    </>
  );
}

function selectFirstParagraphText(start = 0, end?: number) {
  const editor = screen.getByTestId("editor");
  editor.focus();
  const textNode = editor.querySelector("p")!.firstChild!;
  const range = document.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end ?? (textNode.textContent ?? "").length);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}

function selectHeadingText(tag: string) {
  const editor = screen.getByTestId("editor");
  editor.focus();
  const textNode = editor.querySelector(tag)!.firstChild!;
  const range = document.createRange();
  range.selectNodeContents(textNode);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new Event("selectionchange"));
}

function flush(ms = 200) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

// jsdom has no layout engine — Range.prototype.getBoundingClientRect doesn't
// exist at all (not just zeroed), so it must be assigned, not spied on.
const originalGetBoundingClientRect = Range.prototype.getBoundingClientRect;

beforeEach(() => {
  jest.useFakeTimers();
  Range.prototype.getBoundingClientRect = jest.fn(
    () =>
      ({
        width: 60,
        height: 16,
        top: 100,
        left: 100,
        right: 160,
        bottom: 116,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect
  );
});

afterEach(() => {
  jest.useRealTimers();
  Range.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  window.getSelection()?.removeAllRanges();
});

describe("EditorSelectionToolbar — показ/приховування", () => {
  it("не рендериться, коли вимкнено налаштуванням", () => {
    render(<Harness enabled={false} />);
    selectFirstParagraphText();
    flush();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("не рендериться без виділення тексту", () => {
    render(<Harness />);
    flush();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("зʼявляється при виділенні тексту в редакторі", () => {
    render(<Harness />);
    selectFirstParagraphText();
    flush();
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("ховається, коли виділення знімається (collapse)", () => {
    render(<Harness />);
    selectFirstParagraphText();
    flush();
    expect(screen.getByRole("toolbar")).toBeInTheDocument();

    act(() => {
      window.getSelection()?.removeAllRanges();
      document.dispatchEvent(new Event("selectionchange"));
    });
    flush();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  it("не показується для виділення поза редактором", () => {
    render(
      <>
        <Harness />
        <p data-testid='outside'>outside text</p>
      </>
    );
    const outside = screen.getByTestId("outside").firstChild!;
    act(() => {
      const range = document.createRange();
      range.selectNodeContents(outside);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    flush();
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });
});

describe("EditorSelectionToolbar — заголовки", () => {
  it("клік по H1 перетворює блок під курсором на <h1>", () => {
    render(<Harness />);
    selectFirstParagraphText();
    flush();

    fireEvent.click(screen.getByRole("button", { name: "H1" }));

    expect(screen.getByTestId("editor").querySelector("h1")).not.toBeNull();
  });

  it("повторний клік по активному H5 повертає звичайний блок (toggle)", () => {
    render(<Harness html='<h5>button text</h5>' />);
    selectHeadingText("h5");
    flush();

    const button = screen.getByRole("button", { name: "H5" });
    fireEvent.click(button); // h5 -> p
    const editor = screen.getByTestId("editor");
    expect(editor.innerHTML).toBe("<p>button text</p>");
  });

  it("mousedown на кнопці викликає preventDefault (не знімає виділення)", () => {
    render(<Harness />);
    selectFirstParagraphText();
    flush();

    const button = screen.getByRole("button", { name: "H1" });
    const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    const notPrevented = button.dispatchEvent(event);

    expect(notPrevented).toBe(false);
  });

  it("H1/H4/H5/H6 доступні і активні навіть в advanced-режимі", () => {
    render(<Harness converterMode='advanced' />);
    selectFirstParagraphText();
    flush();

    for (const tag of ["H1", "H4", "H5", "H6"]) {
      expect(screen.getByRole("button", { name: tag })).not.toBeDisabled();
    }
  });
});

describe("EditorSelectionToolbar — вставка § та wrapper-маркери", () => {
  it("клік по § вставляє oneBrSymbol, замінюючи виділення", () => {
    render(<Harness oneBrSymbol='§' />);
    selectFirstParagraphText(0, 6); // "select"
    flush();

    fireEvent.click(screen.getByRole("button", { name: "§" }));

    expect(screen.getByTestId("editor").textContent).toBe("§ me please");
  });

  it("клік по wrapper-кнопці (i-r) обгортає виділення парою маркерів у simple-режимі", () => {
    render(<Harness converterMode='simple' />);
    selectFirstParagraphText();
    flush();

    const wrapperButton = screen.getByRole("button", { name: "i-r" });
    expect(wrapperButton).not.toBeDisabled();
    fireEvent.click(wrapperButton);

    const editor = screen.getByTestId("editor");
    expect(editor.textContent).toContain("i-r-s");
    expect(editor.textContent).toContain("i-r-s-e");
  });

  it("wrapper-кнопки вимкнені в advanced-режимі з підказкою на обгортці", () => {
    render(<Harness converterMode='advanced' />);
    selectFirstParagraphText();
    flush();

    const wrapperButton = screen.getByRole("button", { name: "i-r" });
    expect(wrapperButton).toBeDisabled();
    expect(wrapperButton.parentElement).toHaveAttribute("title", "Не підтримується в advanced-режимі");

    fireEvent.click(wrapperButton);
    expect(screen.getByTestId("editor").textContent).not.toContain("i-r-s");
  });

  it("рендерить усі п'ять wrapper-чіпів реєстру, включно з ftr-c", () => {
    render(<Harness />);
    selectFirstParagraphText();
    flush();

    for (const short of ["i-r", "i-l", "sign", "ftr", "ftr-c"]) {
      expect(screen.getByRole("button", { name: short })).toBeInTheDocument();
    }
  });
});
