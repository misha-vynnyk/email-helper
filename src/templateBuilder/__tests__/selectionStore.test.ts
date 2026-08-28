import { clearMultiSelection, getSelectedIds, removeIdsFromSelection, selectBlock, toggleBlockSelection } from "../state/selectionStore";

describe("selectionStore — multi-select (selectedIds)", () => {
  beforeEach(() => {
    selectBlock(null);
    clearMultiSelection();
  });

  it("toggleBlockSelection adds an id, and removes it again on a second toggle", () => {
    toggleBlockSelection("a");
    expect(getSelectedIds().has("a")).toBe(true);

    toggleBlockSelection("a");
    expect(getSelectedIds().has("a")).toBe(false);
  });

  it("toggleBlockSelection holds multiple ids independently", () => {
    toggleBlockSelection("a");
    toggleBlockSelection("b");

    expect(getSelectedIds()).toEqual(new Set(["a", "b"]));
  });

  it("selectBlock(null) does not clear selectedIds — the two fields are independent", () => {
    toggleBlockSelection("a");

    selectBlock(null);

    expect(getSelectedIds().has("a")).toBe(true);
  });

  it("removeIdsFromSelection removes only the given ids", () => {
    toggleBlockSelection("a");
    toggleBlockSelection("b");

    removeIdsFromSelection(["a"]);

    expect(getSelectedIds()).toEqual(new Set(["b"]));
  });

  it("removeIdsFromSelection is a no-op when none of the given ids are selected", () => {
    toggleBlockSelection("a");

    removeIdsFromSelection(["z"]);

    expect(getSelectedIds()).toEqual(new Set(["a"]));
  });

  it("clearMultiSelection empties selectedIds", () => {
    toggleBlockSelection("a");
    toggleBlockSelection("b");

    clearMultiSelection();

    expect(getSelectedIds().size).toBe(0);
  });
});
