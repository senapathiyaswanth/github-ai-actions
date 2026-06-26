import { describe, it, expect } from "vitest";

import { buildSystemPrompt, buildUserPrompt, parseReviewAnalysis } from "../src/prompts.js";

describe("buildSystemPrompt", () => {
  it("includes quick level instructions", () => {
    const prompt = buildSystemPrompt("quick");
    expect(prompt).toContain("QUICK");
    expect(prompt).toContain("critical issues");
  });

  it("includes detailed level instructions", () => {
    const prompt = buildSystemPrompt("detailed");
    expect(prompt).toContain("DETAILED");
  });

  it("includes thorough level instructions", () => {
    const prompt = buildSystemPrompt("thorough");
    expect(prompt).toContain("THOROUGH");
    expect(prompt).toContain("OWASP");
  });

  it("always includes JSON schema instructions", () => {
    const prompt = buildSystemPrompt("detailed");
    expect(prompt).toContain("findings");
    expect(prompt).toContain("scoreCard");
    expect(prompt).toContain("severity");
  });
});

describe("buildUserPrompt", () => {
  const mockDiff = "--- a/file.ts\n+++ b/file.ts\n@@ -1 +1 @@\n-old\n+new";

  it("includes PR title", () => {
    const prompt = buildUserPrompt("Fix auth bug", null, mockDiff, ["file.ts"], {
      totalFiles: 1,
      additions: 1,
      deletions: 1,
    });
    expect(prompt).toContain("Fix auth bug");
  });

  it("handles null PR body", () => {
    const prompt = buildUserPrompt("Test PR", null, mockDiff, [], {
      totalFiles: 0,
      additions: 0,
      deletions: 0,
    });
    expect(prompt).toContain("No description provided");
  });

  it("includes statistics", () => {
    const prompt = buildUserPrompt("PR", "body", mockDiff, ["a.ts", "b.ts"], {
      totalFiles: 2,
      additions: 10,
      deletions: 5,
    });
    expect(prompt).toContain("Files changed: 2");
    expect(prompt).toContain("+10");
    expect(prompt).toContain("-5");
  });

  it("truncates file list at 20 entries", () => {
    const files = Array.from({ length: 25 }, (_, i) => `file${i}.ts`);
    const prompt = buildUserPrompt("PR", null, mockDiff, files, {
      totalFiles: 25,
      additions: 0,
      deletions: 0,
    });
    expect(prompt).toContain("5 more files");
  });
});

describe("parseReviewAnalysis", () => {
  const validAnalysis = {
    findings: [
      {
        severity: "high",
        category: "Security",
        title: "SQL injection",
        description: "User input not sanitized",
      },
    ],
    scoreCard: {
      overall: 70,
      breakdown: {
        correctness: 80,
        security: 60,
        maintainability: 75,
        performance: 80,
        style: 70,
      },
      summary: "Good code with security issues",
    },
    summary: "Overall good PR with one security concern",
    suggestedAction: "request_changes",
  };

  it("accepts valid analysis", () => {
    const result = parseReviewAnalysis(validAnalysis);
    expect(result.findings).toHaveLength(1);
    expect(result.scoreCard.overall).toBe(70);
  });

  it("throws for null input", () => {
    expect(() => parseReviewAnalysis(null)).toThrow();
  });

  it("throws for missing findings", () => {
    expect(() =>
      parseReviewAnalysis({ scoreCard: {}, summary: "test", suggestedAction: "approve" }),
    ).toThrow("findings");
  });

  it("throws for missing scoreCard", () => {
    expect(() =>
      parseReviewAnalysis({ findings: [], summary: "test", suggestedAction: "approve" }),
    ).toThrow("scoreCard");
  });
});
