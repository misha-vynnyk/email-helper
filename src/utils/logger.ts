/**
 * Centralized logger utility
 * Provides consistent logging across the application
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  showTimestamp: boolean;
  enableDebugInProduction: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: true,
  level: "info",
  showTimestamp: false,
  enableDebugInProduction: false,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    // In production, skip debug logs unless explicitly enabled
    if (level === "debug" && import.meta.env.PROD && !this.config.enableDebugInProduction) {
      return false;
    }

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = this.config.showTimestamp ? `[${new Date().toISOString()}] ` : "";
    const levelStr = level.toUpperCase().padEnd(5);
    return `${timestamp}[${levelStr}] [${context}] ${message}`;
  }

  debug(context: string, message: string, data?: any): void {
    if (!this.shouldLog("debug")) return;
    console.debug(this.formatMessage("debug", context, message), data);
  }

  info(context: string, message: string, data?: any): void {
    if (!this.shouldLog("info")) return;
    console.info(this.formatMessage("info", context, message), data);
  }

  warn(context: string, message: string, data?: any): void {
    if (!this.shouldLog("warn")) return;
    console.warn(this.formatMessage("warn", context, message), data);
  }

  error(context: string, message: string, error?: any): void {
    if (!this.shouldLog("error")) return;
    console.error(this.formatMessage("error", context, message), error);
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger({
  level: import.meta.env.DEV ? "debug" : "warn",
  showTimestamp: false,
  enableDebugInProduction: false,
});

// Export class for testing
export { Logger };
