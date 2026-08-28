import { pushHistorySnapshot, redoToSnapshot, resetHistory, undoToSnapshot, type BuilderSnapshot } from "../state/historyStore";

function snap(rootIds: string[]): BuilderSnapshot {
  return { rootIds, nodes: {} };
}

describe("historyStore", () => {
  beforeEach(() => {
    resetHistory();
  });

  it("undoToSnapshot returns null when past is empty", () => {
    expect(undoToSnapshot(snap(["current"]))).toBeNull();
  });

  it("redoToSnapshot returns null when future is empty", () => {
    expect(redoToSnapshot(snap(["current"]))).toBeNull();
  });

  it("commit then undo returns the state BEFORE the mutation", () => {
    pushHistorySnapshot(snap(["before"]), 0);

    expect(undoToSnapshot(snap(["after"]))).toEqual(snap(["before"]));
  });

  it("commit, undo, then redo returns the state AFTER the mutation", () => {
    pushHistorySnapshot(snap(["before"]), 0);
    undoToSnapshot(snap(["after"]));

    expect(redoToSnapshot(snap(["before"]))).toEqual(snap(["after"]));
  });

  it("a new commit after undo clears the redo stack", () => {
    pushHistorySnapshot(snap(["a"]), 0);
    undoToSnapshot(snap(["b"]));

    pushHistorySnapshot(snap(["c"]), 1000); // gap > COALESCE_WINDOW_MS — a real new commit, not a coalesce

    expect(redoToSnapshot(snap(["d"]))).toBeNull();
  });

  it("two commits within COALESCE_WINDOW_MS merge into one undo step", () => {
    pushHistorySnapshot(snap(["a"]), 0);
    pushHistorySnapshot(snap(["b"]), 100); // within the 500ms window

    expect(undoToSnapshot(snap(["c"]))).toEqual(snap(["a"])); // first "before" snapshot still wins
    expect(undoToSnapshot(snap(["never"]))).toBeNull(); // only one step total
  });

  it("two commits with a gap greater than COALESCE_WINDOW_MS remain two separate steps", () => {
    pushHistorySnapshot(snap(["a"]), 0);
    pushHistorySnapshot(snap(["b"]), 600);

    expect(undoToSnapshot(snap(["c"]))).toEqual(snap(["b"]));
    expect(undoToSnapshot(snap(["never"]))).toEqual(snap(["a"]));
  });

  it("past is capped at MAX_HISTORY entries — the 101st commit discards the oldest snapshot", () => {
    for (let i = 0; i < 101; i++) pushHistorySnapshot(snap([`s${i}`]), i * 1000);

    let popped: BuilderSnapshot | null = null;
    for (let i = 0; i < 100; i++) popped = undoToSnapshot(snap(["current"]));

    expect(popped).toEqual(snap(["s1"])); // s0 evicted — s1 is the oldest survivor
    expect(undoToSnapshot(snap(["current"]))).toBeNull(); // exactly 100 entries, no more
  });
});
