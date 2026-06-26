/**
 * Token estimation utilities.
 * Provides rough estimates of token counts without requiring an API call.
 * Based on OpenAI's rule-of-thumb: ~4 characters per token.
 */

const CHARS_PER_TOKEN = 4;

/**
 * Estimate the number of tokens in a string.
 * This is an approximation suitable for pre-flight checks.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Check if text fits within a token budget.
 * Returns true if the text is estimated to be within limits.
 */
export function fitsInTokenBudget(text: string, maxTokens: number): boolean {
  return estimateTokens(text) <= maxTokens;
}

/**
 * Truncate text to fit within a token budget.
 * Preserves the beginning of the text and adds a truncation notice.
 */
export function truncateToTokenBudget(
  text: string,
  maxTokens: number,
  suffix = "\n\n[... content truncated to fit token limit ...]",
): string {
  if (fitsInTokenBudget(text, maxTokens)) {
    return text;
  }

  const suffixTokens = estimateTokens(suffix);
  const availableTokens = maxTokens - suffixTokens;
  const charLimit = availableTokens * CHARS_PER_TOKEN;

  return text.slice(0, charLimit) + suffix;
}

/** Common model context windows for reference */
export const MODEL_TOKEN_LIMITS: Record<string, number> = {
  "gpt-4o": 128_000,
  "gpt-4o-mini": 128_000,
  "gpt-4-turbo": 128_000,
  "gpt-3.5-turbo": 16_385,
  "claude-3-5-sonnet-20241022": 200_000,
  "claude-3-5-haiku-20241022": 200_000,
  "claude-3-opus-20240229": 200_000,
  "gemini-2.0-flash": 1_000_000,
  "gemini-1.5-pro": 2_000_000,
  "gemini-1.5-flash": 1_000_000,
};

/** Get the output token limit for a given model */
export const MODEL_OUTPUT_LIMITS: Record<string, number> = {
  "gpt-4o": 16_384,
  "gpt-4o-mini": 16_384,
  "claude-3-5-sonnet-20241022": 8_192,
  "claude-3-5-haiku-20241022": 8_192,
  "gemini-2.0-flash": 8_192,
  "gemini-1.5-pro": 8_192,
};
