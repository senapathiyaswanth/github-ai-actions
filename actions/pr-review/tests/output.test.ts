import * as githubWrappers from "@github-ai-actions/github";
import { describe, it, expect, vi } from "vitest";

import { ReviewOutputter } from "../src/output.js";

vi.mock("@github-ai-actions/github", () => ({
  postOrUpdatePRComment: vi.fn(),
}));

describe("ReviewOutputter", () => {
  const analysis = {
    findings: [
      {
        severity: "high",
        category: "security",
        title: "Bad code",
        description: "Fix it",
        file: "index.ts",
        line: 10,
        suggestion: "do better",
      },
    ],
    scoreCard: {
      overall: 80,
      breakdown: { security: 80 },
      summary: "average",
    },
    summary: "Overall analysis",
    suggestedAction: "comment",
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts review when dryRun is false", async () => {
    vi.mocked(githubWrappers.postOrUpdatePRComment).mockResolvedValue({
      commentId: 42,
      isNew: true,
    });

    const outputter = new ReviewOutputter({} as any, "owner", "repo", 1, false);
    const result = await outputter.postReview(analysis);

    expect(githubWrappers.postOrUpdatePRComment).toHaveBeenCalled();
    expect(result.commentId).toBe(42);
    expect(result.commentUrl).toBe("https://github.com/owner/repo/pull/1#issuecomment-42");
    expect(result.commentBody).toContain("## 📝 Summary");
    expect(result.commentBody).toContain("Bad code");
  });

  it("does not post review when dryRun is true", async () => {
    const outputter = new ReviewOutputter({} as any, "owner", "repo", 1, true);
    const result = await outputter.postReview(analysis);

    expect(githubWrappers.postOrUpdatePRComment).not.toHaveBeenCalled();
    expect(result.commentId).toBeUndefined();
    expect(result.commentUrl).toBeUndefined();
    expect(result.commentBody).toContain("## 📝 Summary");
  });
});
