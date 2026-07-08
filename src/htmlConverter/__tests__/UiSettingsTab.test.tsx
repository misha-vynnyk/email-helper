/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

// UiSettingsTab (via useElectronAPI) and useHtmlConverterSettings both pull in
// config/api.ts, which uses import.meta.env (Vite-only syntax the ts-jest CJS
// transform can't parse) — stub both out for tests.
jest.mock("@/hooks/useElectronAPI", () => ({ useElectronAPI: () => null }));
jest.mock("@/config/api", () => ({ getApiBase: () => "", isApiAvailable: () => true, apiCall: jest.fn(), API_URL: "", default: "" }));

import { UiSettingsTab } from "../components/UiSettingsTab";
import { DEFAULT_UI_SETTINGS, UiSettings } from "../hooks/useHtmlConverterSettings";

function renderTab(overrides: Partial<UiSettings> = {}) {
  const ui: UiSettings = { ...DEFAULT_UI_SETTINGS, ...overrides };
  const setUi = jest.fn();
  render(<UiSettingsTab ui={ui} setUi={setUi} uploadMode='playwright' setUploadMode={jest.fn()} />);
  return { setUi };
}

describe("UiSettingsTab — секція «Редактор»", () => {
  // Ці три перемикачі позначені бейджем "Beta" (BetaBadge всередині <Label>),
  // тож текст лейбла більше не дорівнює точно назві — матчимо регексом.
  it("усі три перемикачі вимкнені за замовчуванням", () => {
    renderTab();
    expect(screen.getByLabelText(/Тулбар при виділенні/)).toHaveAttribute("aria-checked", "false");
    expect(screen.getByLabelText(/Підсвічування позначок/)).toHaveAttribute("aria-checked", "false");
    expect(screen.getByLabelText(/Гарячі клавіші/)).toHaveAttribute("aria-checked", "false");
  });

  it("відображає перемикачі як увімкнені, коли відповідні прапорці true", () => {
    renderTab({ editorSelectionToolbar: true, editorMarkerHighlight: true, editorHotkeys: true });
    expect(screen.getByLabelText(/Тулбар при виділенні/)).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText(/Підсвічування позначок/)).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText(/Гарячі клавіші/)).toHaveAttribute("aria-checked", "true");
  });

  it("клік по «Тулбар при виділенні» оновлює тільки editorSelectionToolbar", () => {
    const { setUi } = renderTab();
    fireEvent.click(screen.getByLabelText(/Тулбар при виділенні/));

    expect(setUi).toHaveBeenCalledTimes(1);
    const updater = setUi.mock.calls[0][0] as (prev: UiSettings) => UiSettings;
    expect(updater(DEFAULT_UI_SETTINGS)).toEqual({ ...DEFAULT_UI_SETTINGS, editorSelectionToolbar: true });
  });

  it("клік по «Підсвічування позначок» оновлює тільки editorMarkerHighlight", () => {
    const { setUi } = renderTab();
    fireEvent.click(screen.getByLabelText(/Підсвічування позначок/));

    const updater = setUi.mock.calls[0][0] as (prev: UiSettings) => UiSettings;
    expect(updater(DEFAULT_UI_SETTINGS)).toEqual({ ...DEFAULT_UI_SETTINGS, editorMarkerHighlight: true });
  });

  it("клік по «Гарячі клавіші» оновлює тільки editorHotkeys", () => {
    const { setUi } = renderTab();
    fireEvent.click(screen.getByLabelText(/Гарячі клавіші/));

    const updater = setUi.mock.calls[0][0] as (prev: UiSettings) => UiSettings;
    expect(updater(DEFAULT_UI_SETTINGS)).toEqual({ ...DEFAULT_UI_SETTINGS, editorHotkeys: true });
  });

  it("вимикає editorHotkeys, коли він уже увімкнений", () => {
    const { setUi } = renderTab({ editorHotkeys: true });
    fireEvent.click(screen.getByLabelText(/Гарячі клавіші/));

    const updater = setUi.mock.calls[0][0] as (prev: UiSettings) => UiSettings;
    expect(updater({ ...DEFAULT_UI_SETTINGS, editorHotkeys: true })).toMatchObject({ editorHotkeys: false });
  });

  it("показує перелік комбінацій гарячих клавіш у підказці", () => {
    renderTab();
    expect(screen.getByText(/⌘\/Ctrl\+⌥\+1\/4\/5\/6/)).toBeInTheDocument();
  });

  it("три нові фічі редактора позначені бейджем Beta, а решта перемикачів — ні", () => {
    // getByLabelText resolves to the form CONTROL (the Switch), not the <label>
    // itself, so the badge text is checked on the <label> element directly.
    renderTab();
    const labelFor = (id: string) => document.querySelector(`label[for="${id}"]`);

    expect(labelFor("editorSelectionToolbar")).toHaveTextContent("Beta");
    expect(labelFor("editorMarkerHighlight")).toHaveTextContent("Beta");
    expect(labelFor("editorHotkeys")).toHaveTextContent("Beta");
    expect(labelFor("showLogsPanel")).not.toHaveTextContent("Beta");
  });
});
