/**
 * useLocalStorage Hook
 * Provides localStorage synchronization for React state
 */

import { useState } from "react";

import { logger } from "../utils/logger";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.warn("useLocalStorage", `Error reading ${key}`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      logger.error("useLocalStorage", `Error saving ${key}`, error);
    }
  };

  return [storedValue, setValue] as const;
}
