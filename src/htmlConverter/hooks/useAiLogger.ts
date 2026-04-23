import { useState, useEffect, useRef } from "react";

export function useAiLogger(enabled: boolean) {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      return;
    }

    const connect = () => {
      // Connect to the AI backend WebSocket via Vite proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ai-api/api/ws/logs`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        setLogs((prev) => [...prev, "[System] Connected to AI Terminal."]);
      };

      ws.onmessage = (event) => {
        setLogs((prev) => {
          const newLogs = [...prev, event.data];
          // Keep only the last 200 logs to prevent memory leaks
          if (newLogs.length > 200) {
            return newLogs.slice(newLogs.length - 200);
          }
          return newLogs;
        });
      };

      ws.onclose = () => {
        setConnected(false);
        setLogs((prev) => [...prev, "[System] Disconnected from AI Terminal. Reconnecting in 3s..."]);
        // Attempt to reconnect if still enabled
        if (wsRef.current) {
          setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null; // Prevent reconnect
        ws.close();
      }
    };
  }, [enabled]);

  return {
    aiLogs: logs,
    aiConnected: connected,
    clearAiLogs: () => setLogs([]),
  };
}
