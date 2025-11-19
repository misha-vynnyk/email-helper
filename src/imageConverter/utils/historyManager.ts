/**
 * History Manager for Undo/Redo functionality
 * Tracks state changes and allows reverting
 */

import { LIMITS } from '../constants/limits';
import { ImageFile } from '../types';

export interface HistoryState {
  files: ImageFile[];
  timestamp: number;
  action: string; // Description of what changed
}

export class HistoryManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = LIMITS.MAX_HISTORY_SIZE;

  /**
   * Push a new state to history
   */
  push(files: ImageFile[], action: string): void {
    // Remove any states after current index (when undoing then making new change)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push({
      files: JSON.parse(JSON.stringify(files)), // Deep clone
      timestamp: Date.now(),
      action,
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * Undo to previous state
   */
  undo(): ImageFile[] | null {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].files));
  }

  /**
   * Redo to next state
   */
  redo(): ImageFile[] | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].files));
  }

  /**
   * Can undo?
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Can redo?
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get current action description
   */
  getCurrentAction(): string | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].action;
    }
    return null;
  }

  /**
   * Get previous action (for undo preview)
   */
  getPreviousAction(): string | null {
    if (this.canUndo()) {
      return this.history[this.currentIndex - 1].action;
    }
    return null;
  }

  /**
   * Get next action (for redo preview)
   */
  getNextAction(): string | null {
    if (this.canRedo()) {
      return this.history[this.currentIndex + 1].action;
    }
    return null;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history stats
   */
  getStats(): {
    total: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      total: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }
}
