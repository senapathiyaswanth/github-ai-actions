/**
 * Shared type definitions for GitHub AI Actions utilities.
 */

/** Log levels supported by the Logger */
export type LogLevel = "debug" | "info" | "warn" | "error";

/** Result of an AI text generation operation */
export interface TextResult {
  text: string;
  tokensUsed?: number;
  model?: string;
}

/** Retry configuration options */
export interface RetryOptions {
  /** Maximum number of attempts (including the first) */
  maxAttempts: number;
  /** Base delay in milliseconds */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds */
  maxDelayMs: number;
  /** Jitter factor (0–1). Adds randomness to prevent thundering herd */
  jitterFactor: number;
  /** Optional list of error codes/messages that should NOT trigger retry */
  nonRetryableErrors?: string[];
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Common AI action inputs shared across all actions */
export interface CommonActionInputs {
  githubToken: string;
  aiProvider: "openai" | "anthropic" | "gemini";
  aiModel?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  logLevel?: LogLevel;
  dryRun?: boolean;
}
