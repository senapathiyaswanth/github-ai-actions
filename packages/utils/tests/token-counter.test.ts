import { describe, it, expect } from "vitest";

import { estimateTokens, fitsInTokenBudget, truncateToTokenBudget } from "../src/token-counter.js";

describe("token-counter", () => {
  it("estimates tokens correctly", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcdefgh")).toBe(2);
    expect(estimateTokens("a")).toBe(1);
    expect(estimateTokens("")).toBe(0);
  });

  it("checks token budget", () => {
    expect(fitsInTokenBudget("abcd", 1)).toBe(true);
    expect(fitsInTokenBudget("abcde", 1)).toBe(false);
  });

  it("truncates to token budget", () => {
    expect(truncateToTokenBudget("abcdefgh", 2)).toBe("abcdefgh");
    const truncated = truncateToTokenBudget("abcdefgh", 1, "...");
    expect(truncated).toBe("...");
    // 1 token limit -> 4 chars, but suffix "..." is 1 token (length 3 / 4 rounded up).
    // so available = 1 - 1 = 0 tokens.
    // charLimit = 0.
    // text.slice(0, 0) + "..."
  });
});
