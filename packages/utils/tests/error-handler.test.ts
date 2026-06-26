import { describe, it, expect } from "vitest";

import {
  ActionError,
  ProviderConfigError,
  AIAPIError,
  GitHubAPIError,
  ValidationError,
  normalizeError,
  extractErrorMessage,
  formatErrorForDisplay,
} from "../src/error-handler.js";

describe("ActionError", () => {
  it("creates error with code and context", () => {
    const err = new ActionError("Test error", "TEST_CODE", { foo: "bar" });
    expect(err.message).toBe("Test error");
    expect(err.code).toBe("TEST_CODE");
    expect(err.context).toEqual({ foo: "bar" });
    expect(err.isRetryable).toBe(false);
    expect(err.name).toBe("ActionError");
  });

  it("is instanceof Error", () => {
    const err = new ActionError("test");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("ProviderConfigError", () => {
  it("includes provider name in message", () => {
    const err = new ProviderConfigError("openai", "Missing API key");
    expect(err.message).toContain("openai");
    expect(err.message).toContain("Missing API key");
    expect(err.code).toBe("PROVIDER_CONFIG_ERROR");
  });
});

describe("AIAPIError", () => {
  it("marks 429 as retryable", () => {
    const err = new AIAPIError("openai", "Rate limit", 429);
    expect(err.isRetryable).toBe(true);
    expect(err.statusCode).toBe(429);
  });

  it("marks 500 as retryable", () => {
    const err = new AIAPIError("anthropic", "Server error", 500);
    expect(err.isRetryable).toBe(true);
  });

  it("marks 401 as non-retryable", () => {
    const err = new AIAPIError("openai", "Unauthorized", 401);
    expect(err.isRetryable).toBe(false);
  });
});

describe("GitHubAPIError", () => {
  it("includes operation in message", () => {
    const err = new GitHubAPIError("getPRDiff", "Not Found", 404);
    expect(err.message).toContain("getPRDiff");
    expect(err.code).toBe("GITHUB_API_ERROR");
  });
});

describe("ValidationError", () => {
  it("includes field name", () => {
    const err = new ValidationError("github-token", "is required");
    expect(err.message).toContain("github-token");
    expect(err.code).toBe("VALIDATION_ERROR");
  });
});

describe("normalizeError", () => {
  it("returns Error instances as-is", () => {
    const original = new Error("original");
    expect(normalizeError(original)).toBe(original);
  });

  it("converts strings to Error", () => {
    const err = normalizeError("string error");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("string error");
  });

  it("converts objects with message to Error", () => {
    const err = normalizeError({ message: "obj error" });
    expect(err.message).toBe("obj error");
  });

  it("handles null/undefined", () => {
    const err = normalizeError(null);
    expect(err).toBeInstanceOf(Error);
  });

  it("handles objects without message prop in normalizeError", () => {
    const obj = { code: 500 };
    const err = normalizeError(obj);
    expect(err.message).toBe('{"code":500}');
  });
});

describe("extractErrorMessage", () => {
  it("extracts message from Error", () => {
    expect(extractErrorMessage(new Error("test"))).toBe("test");
  });

  it("handles non-Error values", () => {
    expect(typeof extractErrorMessage("plain string")).toBe("string");
  });

  it("extracts nested JSON message from Error", () => {
    const error = new Error(JSON.stringify({ error: { message: "Nested JSON API error" } }));
    expect(extractErrorMessage(error)).toBe("Nested JSON API error");
  });

  it("handles non-JSON error messages safely in extractErrorMessage", () => {
    const error = new Error("Plain text error");
    expect(extractErrorMessage(error)).toBe("Plain text error");
  });
});

describe("formatErrorForDisplay", () => {
  it("formats ActionError with code", () => {
    const err = new ActionError("Something failed", "MY_CODE", { detail: "info" });
    const result = formatErrorForDisplay(err);
    expect(result).toContain("MY_CODE");
    expect(result).toContain("Something failed");
  });

  it("formats regular Error", () => {
    const result = formatErrorForDisplay(new Error("plain error"));
    expect(result).toBe("plain error");
  });
});
