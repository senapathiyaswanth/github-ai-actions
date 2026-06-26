import * as core from "@actions/core";
import { createProviderFromInputs } from "@github-ai-actions/core";
import * as githubWrappers from "@github-ai-actions/github";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { PRAnalyzer } from "../src/analyzer.js";
import { run, parseInputs } from "../src/main.js";
import { ReviewOutputter } from "../src/output.js";


vi.mock("@actions/core", () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
}));

vi.mock("@actions/github", () => ({
  context: {
    repo: { owner: "test-owner", repo: "test-repo" },
    payload: { pull_request: { number: 123 } },
    eventName: "pull_request",
  },
}));

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@github-ai-actions/core", () => ({
  createProviderFromInputs: vi.fn(),
}));

vi.mock("@github-ai-actions/github", () => ({
  getPRDiff: vi.fn(),
  filterFiles: vi.fn(),
}));

vi.mock("../src/analyzer.js", () => ({
  PRAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      scoreCard: { overall: 90 },
      findings: [],
    }),
  })),
}));

vi.mock("../src/output.js", () => ({
  ReviewOutputter: vi.fn().mockImplementation(() => ({
    postReview: vi.fn().mockResolvedValue({
      commentBody: "Mock Review",
      commentUrl: "https://github.com/mock/123",
    }),
  })),
}));

describe("ai-pr-review main.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(githubWrappers.getPRDiff).mockResolvedValue({
      files: [{ filename: "src/index.ts", additions: 10, deletions: 0, patch: "+ const x = 1;" }],
      totalFiles: 1,
    } as any);

    vi.mocked(githubWrappers.filterFiles).mockImplementation((files) => files);

    vi.mocked(core.getInput).mockImplementation((name) => {
      const inputs: Record<string, string> = {
        "github-token": "gh-token",
        "ai-provider": "openai",
        "openai-api-key": "sk-test",
        "review-level": "detailed",
        "max-files": "50",
        "fail-on-score": "0",
        "post-as-comment": "true",
      };
      return inputs[name] ?? "";
    });
  });

  it("successfully parses inputs and completes PR review workflow", async () => {
    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(githubWrappers.getPRDiff).toHaveBeenCalled();
    
    expect(core.setOutput).toHaveBeenCalledWith("review-comment", "Mock Review");
    expect(core.setOutput).toHaveBeenCalledWith("quality-score", "90");
    expect(core.setOutput).toHaveBeenCalledWith("issues-found", "[]");
    expect(core.setOutput).toHaveBeenCalledWith("comment-url", "https://github.com/mock/123");
  });

  it("handles empty diff gracefully", async () => {
    vi.mocked(githubWrappers.getPRDiff).mockResolvedValue({ files: [], totalFiles: 0 });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("review-comment", "No files to review.");
  });

  it("fails if quality score is below threshold", async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "fail-on-score") return "95";
      if (name === "github-token") return "gh-token";
      if (name === "openai-api-key") return "sk-test";
      return "";
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining("Quality score 90 is below the threshold of 95"));
  });

  it("fails if inputs are invalid", async () => {
    vi.mocked(core.getInput).mockReturnValue(""); // Missing github-token

    await run();

    expect(core.setFailed).toHaveBeenCalled();
  });
});
