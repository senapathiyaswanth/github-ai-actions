import { describe, it, expect, vi } from "vitest";

import { PRAnalyzer } from "../src/analyzer.js";

vi.mock("../src/prompts.js", () => ({
  buildSystemPrompt: vi.fn().mockReturnValue("system prompt"),
  buildUserPrompt: vi.fn().mockReturnValue("user prompt"),
  parseReviewAnalysis: vi.fn().mockImplementation((data) => data),
}));

describe("PRAnalyzer", () => {
  it("analyzes PR diff and returns structured findings", async () => {
    const mockProvider = {
      name: "mock",
      model: "mock-model",
      generateStructured: vi.fn().mockResolvedValue({
        findings: [{ file: "index.ts", line: 10, issue: "fix it" }],
        scoreCard: { overall: 85, security: 90, performance: 80, maintainability: 85 },
        summary: "looks good",
        suggestedAction: "merge",
      }),
    } as any;

    const analyzer = new PRAnalyzer(mockProvider, { reviewLevel: "detailed" } as any);

    const prDiff = {
      metadata: { number: 1, title: "Test PR", body: "body" },
      files: [{ filename: "index.ts", patch: "+ const x = 1;" }],
      rawDiff: "diff",
      totalFiles: 1,
      totalAdditions: 1,
      totalDeletions: 0,
    } as any;

    const result = await analyzer.analyze(prDiff);

    expect(mockProvider.generateStructured).toHaveBeenCalled();
    expect(result.scoreCard.overall).toBe(85);
    expect(result.findings.length).toBe(1);
    expect(result.suggestedAction).toBe("merge");
  });
});
