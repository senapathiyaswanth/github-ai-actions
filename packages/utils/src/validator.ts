import type { ValidationResult } from "./types.js";

/**
 * Input validation utilities for GitHub Actions inputs.
 * Prevents prompt injection and validates action parameters.
 */

/** Maximum length for text inputs sent to AI APIs (prevents token abuse) */
export const MAX_DIFF_LENGTH = 100_000;
export const MAX_PROMPT_LENGTH = 50_000;
export const MAX_DESCRIPTION_LENGTH = 5_000;

/** Validate a GitHub token format */
export function validateGitHubToken(token: string): ValidationResult {
  const errors: string[] = [];

  if (!token || token.trim().length === 0) {
    errors.push("GitHub token is required and cannot be empty");
  } else if (
    !token.startsWith("ghp_") &&
    !token.startsWith("ghs_") &&
    !token.startsWith("github_pat_") &&
    token !== "GITHUB_TOKEN" // Allow the literal string in tests
  ) {
    // Don't error — just warn. Some enterprise tokens have different prefixes.
    // We validate by attempting API calls, not by format.
  }

  return { valid: errors.length === 0, errors };
}

/** Validate an AI provider selection */
export function validateAIProvider(provider: string): ValidationResult {
  const validProviders = ["openai", "anthropic", "gemini"];
  const errors: string[] = [];

  if (!validProviders.includes(provider.toLowerCase())) {
    errors.push(`Invalid AI provider "${provider}". Must be one of: ${validProviders.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validate API key is present and non-empty */
export function validateApiKey(key: string | undefined, provider: string): ValidationResult {
  const errors: string[] = [];

  if (!key || key.trim().length === 0) {
    errors.push(`API key for provider "${provider}" is required but not provided`);
  } else if (key.includes(" ")) {
    errors.push(`API key for provider "${provider}" appears malformed (contains spaces)`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Sanitize text before including in AI prompts.
 * Prevents prompt injection attacks by escaping special sequences.
 */
export function sanitizeForPrompt(text: string, maxLength = MAX_PROMPT_LENGTH): string {
  if (!text) return "";

  let sanitized = text
    // Remove potential prompt injection patterns
    .replace(/\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/g, "")
    // Limit excessive repetition that could abuse tokens
    .replace(/(.)\1{500,}/g, "$1[...repeated...]")
    // Trim excessive whitespace
    .replace(/\n{5,}/g, "\n\n\n");

  // Hard truncate with informative suffix
  if (sanitized.length > maxLength) {
    sanitized =
      sanitized.slice(0, maxLength) +
      `\n\n[Content truncated at ${maxLength.toLocaleString()} characters to fit within API limits]`;
  }

  return sanitized;
}

/** Validate a numeric range input */
export function validateNumberInRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
): ValidationResult {
  const errors: string[] = [];

  if (Number.isNaN(value)) {
    errors.push(`${fieldName} must be a valid number, got NaN`);
  } else if (value < min || value > max) {
    errors.push(`${fieldName} must be between ${min} and ${max}, got ${value}`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a semantic version string */
export function validateSemVer(version: string): ValidationResult {
  const semverRegex = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\dA-Za-z-\.]+))?$/;
  const errors: string[] = [];

  if (!semverRegex.test(version)) {
    errors.push(`"${version}" is not a valid semantic version (expected format: x.y.z or vx.y.z)`);
  }

  return { valid: errors.length === 0, errors };
}

/** Combine multiple validation results into one */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return { valid: allErrors.length === 0, errors: allErrors };
}

/** Throw an error if validation failed */
export function assertValid(result: ValidationResult, context?: string): void {
  if (!result.valid) {
    const prefix = context ? `[${context}] ` : "";
    throw new Error(`${prefix}Validation failed:\n${result.errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}
