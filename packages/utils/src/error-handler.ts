/**
 * Centralized error handling for GitHub AI Actions.
 * Normalizes errors from different sources (API providers, GitHub, network).
 */

/** Structured error with context */
export class ActionError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown>;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code = "ACTION_ERROR",
    context: Record<string, unknown> = {},
    isRetryable = false,
  ) {
    super(message);
    this.name = "ActionError";
    this.code = code;
    this.context = context;
    this.isRetryable = isRetryable;
  }
}

/** Error thrown when AI provider configuration is invalid */
export class ProviderConfigError extends ActionError {
  constructor(provider: string, reason: string) {
    super(`AI provider "${provider}" configuration error: ${reason}`, "PROVIDER_CONFIG_ERROR", {
      provider,
    });
    this.name = "ProviderConfigError";
  }
}

/** Error thrown when AI API call fails */
export class AIAPIError extends ActionError {
  public readonly statusCode?: number;

  constructor(provider: string, message: string, statusCode?: number) {
    const isRetryable = statusCode !== undefined && (statusCode === 429 || statusCode >= 500);
    super(`AI API error from "${provider}": ${message}`, "AI_API_ERROR", { provider, statusCode }, isRetryable);
    this.name = "AIAPIError";
    this.statusCode = statusCode;
  }
}

/** Error thrown when GitHub API call fails */
export class GitHubAPIError extends ActionError {
  constructor(operation: string, message: string, statusCode?: number) {
    const isRetryable = statusCode !== undefined && statusCode >= 500;
    super(`GitHub API error during "${operation}": ${message}`, "GITHUB_API_ERROR", {
      operation,
      statusCode,
    }, isRetryable);
    this.name = "GitHubAPIError";
  }
}

/** Error thrown when input validation fails */
export class ValidationError extends ActionError {
  constructor(field: string, message: string) {
    super(`Validation error for "${field}": ${message}`, "VALIDATION_ERROR", { field });
    this.name = "ValidationError";
  }
}

/**
 * Normalize any thrown value into an Error instance.
 * Handles string throws, undefined, and nested error objects.
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (typeof error === "object" && error !== null) {
    const msg =
      "message" in error && typeof (error as Record<string, unknown>).message === "string"
        ? (error as Record<string, unknown>).message as string
        : JSON.stringify(error);
    return new Error(msg);
  }
  return new Error("An unknown error occurred");
}

/**
 * Extract a meaningful error message from various error shapes.
 * Handles OpenAI, Anthropic, and Gemini error formats.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Try to extract nested API error messages
    const msg = error.message;
    // OpenAI: { error: { message: "..." } }
    try {
      const parsed = JSON.parse(msg) as Record<string, unknown>;
      if (
        typeof parsed.error === "object" &&
        parsed.error !== null &&
        "message" in parsed.error
      ) {
        return String((parsed.error as Record<string, unknown>).message);
      }
    } catch {
      // Not JSON, use message as-is
    }
    return msg;
  }
  return normalizeError(error).message;
}

/** Format an error for display in GitHub Actions UI */
export function formatErrorForDisplay(error: unknown): string {
  const err = normalizeError(error);

  if (err instanceof ActionError) {
    return [
      `Error [${err.code}]: ${err.message}`,
      Object.keys(err.context).length > 0
        ? `Context: ${JSON.stringify(err.context, null, 2)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return err.message;
}
