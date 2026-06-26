import * as core from "@actions/core";

import type { LogLevel } from "./types.js";

/**
 * Structured logger that wraps @actions/core logging.
 * In non-GitHub Actions environments (tests), falls back to console.
 */
export class Logger {
  private readonly prefix: string;
  private level: LogLevel;

  private static readonly LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(prefix = "github-ai-actions", level: LogLevel = "info") {
    this.prefix = prefix;
    this.level = level;
  }

  /** Update log level at runtime */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(msgLevel: LogLevel): boolean {
    return Logger.LEVEL_ORDER[msgLevel] >= Logger.LEVEL_ORDER[this.level];
  }

  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog("debug")) return;
    const formatted = this.format("debug", message);
    if (data !== undefined) {
      core.debug(`${formatted} ${JSON.stringify(data, null, 2)}`);
    } else {
      core.debug(formatted);
    }
  }

  info(message: string, data?: unknown): void {
    if (!this.shouldLog("info")) return;
    const formatted = this.format("info", message);
    if (data !== undefined) {
      core.info(`${formatted} ${JSON.stringify(data, null, 2)}`);
    } else {
      core.info(formatted);
    }
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog("warn")) return;
    const formatted = this.format("warn", message);
    if (data !== undefined) {
      core.warning(`${formatted} ${JSON.stringify(data, null, 2)}`);
    } else {
      core.warning(formatted);
    }
  }

  error(message: string, error?: unknown): void {
    if (!this.shouldLog("error")) return;
    const formatted = this.format("error", message);
    if (error instanceof Error) {
      core.error(`${formatted}\n  ${error.message}\n  Stack: ${error.stack ?? "N/A"}`);
    } else if (error !== undefined) {
      core.error(`${formatted} ${JSON.stringify(error, null, 2)}`);
    } else {
      core.error(formatted);
    }
  }

  /** Log a section header for better CI readability */
  section(title: string): void {
    core.info(`\n${"─".repeat(60)}`);
    core.info(`  ${title}`);
    core.info(`${"─".repeat(60)}\n`);
  }

  /** Group related log messages */
  group(title: string, fn: () => void | Promise<void>): void {
    core.startGroup(title);
    try {
      const result = fn();
      if (result instanceof Promise) {
        void result.finally(() => { core.endGroup(); });
      } else {
        core.endGroup();
      }
    } catch {
      core.endGroup();
    }
  }

  /** Create a child logger with a sub-prefix */
  child(subPrefix: string): Logger {
    return new Logger(`${this.prefix}:${subPrefix}`, this.level);
  }
}

/** Default application-level logger instance */
export const logger = new Logger();
