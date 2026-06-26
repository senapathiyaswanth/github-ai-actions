/**
 * @github-ai-actions/utils
 *
 * Shared utilities for GitHub AI Actions.
 * Provides logging, validation, formatting, retry logic, and error handling.
 */

// Types
export type { LogLevel, TextResult, RetryOptions, ValidationResult, CommonActionInputs } from "./types.js";

// Logger
export { Logger, logger } from "./logger.js";

// Validation
export {
  validateGitHubToken,
  validateAIProvider,
  validateApiKey,
  validateNumberInRange,
  validateSemVer,
  sanitizeForPrompt,
  combineValidations,
  assertValid,
  MAX_DIFF_LENGTH,
  MAX_PROMPT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "./validator.js";

// Formatting
export type { Severity, Finding, ScoreCard } from "./formatter.js";
export {
  formatScoreBar,
  formatSeverityBadge,
  formatFinding,
  formatFindings,
  formatScoreCard,
  formatReviewHeader,
  formatReleaseNotes,
  escapeMarkdown,
  codeBlock,
} from "./formatter.js";

// Retry
export {
  withRetry,
  withTimeout,
  sleep,
  DEFAULT_RETRY_OPTIONS,
} from "./retry.js";

// Token counter
export {
  estimateTokens,
  fitsInTokenBudget,
  truncateToTokenBudget,
  MODEL_TOKEN_LIMITS,
  MODEL_OUTPUT_LIMITS,
} from "./token-counter.js";

// Error handling
export {
  ActionError,
  ProviderConfigError,
  AIAPIError,
  GitHubAPIError,
  ValidationError,
  normalizeError,
  extractErrorMessage,
  formatErrorForDisplay,
} from "./error-handler.js";
