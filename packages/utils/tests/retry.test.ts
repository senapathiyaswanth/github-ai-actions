import * as core from "@actions/core";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { withRetry, withTimeout, sleep } from "../src/retry.js";

vi.mock("@actions/core", () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));

describe("sleep", () => {
  it("resolves after the given duration", async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0, jitterFactor: 0 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on second attempt", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Server error"))
      .mockResolvedValue("success");

    const result = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 10,
      jitterFactor: 0,
    });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting all attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Persistent error"));

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 10, jitterFactor: 0 }),
    ).rejects.toThrow("3 attempts");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry on non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 1,
        maxDelayMs: 10,
        jitterFactor: 0,
        nonRetryableErrors: ["401"],
      }),
    ).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("withTimeout", () => {
  it("resolves if fn completes within timeout", async () => {
    const fn = async () => {
      await sleep(10);
      return "done";
    };
    const result = await withTimeout(fn, 500);
    expect(result).toBe("done");
  });

  it("rejects with timeout error if fn exceeds timeout", async () => {
    const fn = async () => {
      await sleep(500);
      return "too late";
    };
    await expect(withTimeout(fn, 50)).rejects.toThrow("timed out");
  });

  it("propagates fn errors", async () => {
    const fn = async (): Promise<string> => {
      throw new Error("fn error");
    };
    await expect(withTimeout(fn, 500)).rejects.toThrow("fn error");
  });
});
