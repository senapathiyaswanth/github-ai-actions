import { logger } from "./logger.js";
import type { RetryOptions } from "./types.js";

/** Default retry options */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitterFactor: 0.25,
  nonRetryableErrors: ["401", "403", "invalid_api_key", "authentication"],
};

/**
 * Execute a function with exponential backoff retry logic.
 * Handles rate limits, transient network errors, and API 5xx responses.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this error is non-retryable
      if (isNonRetryable(lastError, opts.nonRetryableErrors ?? [])) {
        logger.debug(`Non-retryable error encountered: ${lastError.message}`);
        throw lastError;
      }

      if (attempt === opts.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff + jitter
      const exponential = opts.baseDelayMs * Math.pow(2, attempt - 1);
      const capped = Math.min(exponential, opts.maxDelayMs);
      const jitter = capped * opts.jitterFactor * Math.random();
      const delay = Math.round(capped + jitter);

      // Check for Retry-After header hint in error message
      const retryAfter = extractRetryAfter(lastError.message);
      const actualDelay = retryAfter !== null ? retryAfter * 1_000 : delay;

      logger.warn(
        `Attempt ${attempt}/${opts.maxAttempts} failed: ${lastError.message}. ` +
          `Retrying in ${actualDelay}ms...`,
      );

      await sleep(actualDelay);
    }
  }

  throw new Error(
    `Operation failed after ${opts.maxAttempts} attempts. ` +
      `Last error: ${lastError?.message ?? "Unknown error"}`,
  );
}

/** Sleep for a given number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if an error is non-retryable based on keywords */
function isNonRetryable(error: Error, nonRetryableErrors: string[]): boolean {
  const message = error.message.toLowerCase();
  return nonRetryableErrors.some((pattern) => message.includes(pattern.toLowerCase()));
}

/** Extract Retry-After seconds from an error message */
function extractRetryAfter(message: string): number | null {
  const match = /retry.after[:\s]+(\d+)/i.exec(message);
  return match?.[1] !== undefined ? parseInt(match[1], 10) : null;
}

/**
 * Timeout wrapper — rejects if fn takes longer than timeoutMs.
 */
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
}
