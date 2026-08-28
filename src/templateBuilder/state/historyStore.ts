import { create } from "zustand";

import type { BuilderNode } from "../types";

/** The subset of `BuilderState` that undo/redo actually covers — tree shape only (`rootIds`,
 * `nodes`). `shell` (title/fonts/colors) is deliberately excluded: `commit()` in builderStore.ts
 * is scoped to `CanvasTree`, and shell settings live outside that scope — see the comment on
 * `updateShellConfig`. */
export interface BuilderSnapshot {
  rootIds: string[];
  nodes: Record<string, BuilderNode>;
}

interface HistoryState {
  past: BuilderSnapshot[];
  future: BuilderSnapshot[];
  lastCommitAt: number | null;
}

const MAX_HISTORY = 100;
/** Commits within this window of the previous one merge into the same undo step — keeps a fast
 * burst of commits (e.g. every keystroke in an Inspector text field) as one undo step instead of
 * one per keystroke. Deliberately a plain module constant, not user-configurable: see the "Open
 * questions" note in canva-plan-v1.md for the reasoning behind 500ms as a starting value. */
const COALESCE_WINDOW_MS = 500;

const historyStore = create<HistoryState>(() => ({ past: [], future: [], lastCommitAt: null }));

/** Records `snapshot` — the tree state BEFORE an about-to-happen mutation — as a new undo step,
 * unless it lands within `COALESCE_WINDOW_MS` of the previous commit, in which case the
 * previous "before" snapshot is already the correct one for the combined step and this call is
 * a no-op beyond bumping `lastCommitAt`. Any commit (coalesced or not) clears `future`: redoing
 * after a fresh edit doesn't make sense once the timeline has branched. */
export function pushHistorySnapshot(snapshot: BuilderSnapshot, now: number): void {
  const { past, lastCommitAt } = historyStore.getState();
  if (lastCommitAt !== null && now - lastCommitAt < COALESCE_WINDOW_MS) {
    historyStore.setState({ future: [], lastCommitAt: now });
    return;
  }
  historyStore.setState({ past: [...past, snapshot].slice(-MAX_HISTORY), future: [], lastCommitAt: now });
}

/** Pops the most recent undo step (or returns `null` if there isn't one), pushing `current` onto
 * the redo stack so `redoToSnapshot` can restore it later. Resets `lastCommitAt` to `null` so the
 * very next real commit always starts a fresh undo step instead of coalescing with whatever
 * happened right before the undo. Does not apply the snapshot itself — the caller (builderStore's
 * `undo()`) is responsible for that, since this module has no access to the live store. */
export function undoToSnapshot(current: BuilderSnapshot): BuilderSnapshot | null {
  const { past, future } = historyStore.getState();
  if (past.length === 0) return null;
  const previous = past[past.length - 1];
  historyStore.setState({ past: past.slice(0, -1), future: [...future, current], lastCommitAt: null });
  return previous;
}

/** Symmetric counterpart to `undoToSnapshot`. */
export function redoToSnapshot(current: BuilderSnapshot): BuilderSnapshot | null {
  const { past, future } = historyStore.getState();
  if (future.length === 0) return null;
  const next = future[future.length - 1];
  historyStore.setState({ past: [...past, current], future: future.slice(0, -1), lastCommitAt: null });
  return next;
}

export function useCanUndo(): boolean {
  return historyStore((s) => s.past.length > 0);
}

export function useCanRedo(): boolean {
  return historyStore((s) => s.future.length > 0);
}

/** Clears both stacks — called from `resetBuilderState()` (a full document reset isn't something
 * a subsequent Ctrl+Z should partially claw back). */
export function resetHistory(): void {
  historyStore.setState({ past: [], future: [], lastCommitAt: null });
}
