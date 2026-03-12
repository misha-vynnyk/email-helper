import { useState, useRef, useCallback, useEffect } from "react";

const LOG_LIMIT = 500;

export function useAppDiagnostics(showLogsPanel: boolean) {
  const [log, setLog] = useState<string[]>([]);
  const [unseenLogCount, setUnseenLogCount] = useState(0);

  const logBufferRef = useRef<string[]>([]);
  const showLogsPanelRef = useRef(showLogsPanel);

  useEffect(() => {
    showLogsPanelRef.current = showLogsPanel;
    if (showLogsPanel) {
      setLog([...logBufferRef.current]);
      setUnseenLogCount(0);
    } else {
      setLog([]);
      setUnseenLogCount(0);
    }
  }, [showLogsPanel]);

  const addLog = useCallback((message: string) => {
    const next = [...logBufferRef.current, message];
    const bounded = next.length <= LOG_LIMIT ? next : next.slice(next.length - LOG_LIMIT);
    logBufferRef.current = bounded;

    if (showLogsPanelRef.current) {
      setLog([...bounded]);
      return;
    }
    setUnseenLogCount((prev) => Math.min(prev + 1, LOG_LIMIT));
  }, []);

  const clearLogs = useCallback(() => {
    logBufferRef.current = [];
    setLog([]);
    setUnseenLogCount(0);
  }, []);

  return {
    log,
    unseenLogCount,
    addLog,
    clearLogs,
  };
}
