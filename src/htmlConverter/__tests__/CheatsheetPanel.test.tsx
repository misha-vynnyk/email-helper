/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";

import { CheatsheetPanel } from "../components/CheatsheetPanel";

const writeText = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

// handleCopy is async (awaits navigator.clipboard.writeText before setState) —
// flush that microtask inside act() so React doesn't warn about unwrapped updates.
async function clickAndFlush(el: HTMLElement) {
  await act(async () => {
    fireEvent.click(el);
    await Promise.resolve();
  });
}

describe("CheatsheetPanel", () => {
  it("закрита за замовчуванням — маркери не в DOM", () => {
    render(<CheatsheetPanel />);
    expect(screen.queryByText("Заголовок")).not.toBeInTheDocument();
  });

  it("розкриває повний список маркерів реєстру, включно з ftr-c (раніше був відсутній)", () => {
    render(<CheatsheetPanel oneBrSymbol='§' />);
    fireEvent.click(screen.getByText("Шпаргалка позначок"));

    expect(screen.getByText("Заголовок")).toBeInTheDocument();
    expect(screen.getByText("Відступ")).toBeInTheDocument();
    expect(screen.getByText("Кнопка")).toBeInTheDocument();
    expect(screen.getByText("Малий текст")).toBeInTheDocument();
    expect(screen.getByText("Перенос рядка")).toBeInTheDocument();
    expect(screen.getByText("Фото праворуч")).toBeInTheDocument();
    expect(screen.getByText("Фото ліворуч")).toBeInTheDocument();
    expect(screen.getByText("Підпис")).toBeInTheDocument();
    expect(screen.getByText("Футер")).toBeInTheDocument();
    expect(screen.getByText("Футер по центру")).toBeInTheDocument();
  });

  it("відображає кастомний oneBrSymbol у чіпі", () => {
    render(<CheatsheetPanel oneBrSymbol='~~' />);
    fireEvent.click(screen.getByText("Шпаргалка позначок"));
    expect(screen.getByText("~~")).toBeInTheDocument();
  });

  it("копіює heading-маркер як голий тег", async () => {
    render(<CheatsheetPanel />);
    fireEvent.click(screen.getByText("Шпаргалка позначок"));

    await clickAndFlush(screen.getByTitle('Копіювати "h1"'));
    expect(writeText).toHaveBeenCalledWith("h1");
  });

  it("копіює wrapper-маркер як пару рядків із порожнім рядком між ними", async () => {
    render(<CheatsheetPanel />);
    fireEvent.click(screen.getByText("Шпаргалка позначок"));

    await clickAndFlush(screen.getByText("i-r-s … i-r-s-e"));
    expect(writeText).toHaveBeenCalledWith("i-r-s\n\ni-r-s-e");
  });

  it("копіює insert-маркер (oneBrSymbol) як є", async () => {
    render(<CheatsheetPanel oneBrSymbol='§' />);
    fireEvent.click(screen.getByText("Шпаргалка позначок"));

    await clickAndFlush(screen.getByTitle('Копіювати "§"'));
    expect(writeText).toHaveBeenCalledWith("§");
  });

  it("повторний клік по заголовку шпаргалки згортає її", () => {
    render(<CheatsheetPanel />);
    const toggle = screen.getByText("Шпаргалка позначок");
    fireEvent.click(toggle);
    expect(screen.getByText("Заголовок")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText("Заголовок")).not.toBeInTheDocument();
  });
});
