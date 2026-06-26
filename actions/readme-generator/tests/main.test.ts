import * as core from "@actions/core";
import { createProviderFromInputs } from "@github-ai-actions/core";
import * as githubWrappers from "@github-ai-actions/github";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { run } from "../src/main.js";

vi.mock("@actions/core", () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  summary: {
    addHeading: vi.fn().mockReturnThis(),
    addRaw: vi.fn().mockReturnThis(),
    write: vi.fn().mockResolvedValue(),
  },
}));

vi.mock("@actions/github", () => ({
  context: {
    repo: { owner: "test-owner", repo: "test-repo" },
    payload: { repository: { default_branch: "main" } },
  },
}));

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@github-ai-actions/core", () => ({
  createProviderFromInputs: vi.fn(),
}));

vi.mock("@github-ai-actions/github", () => ({
  getRepoContext: vi.fn(),
  getFileContent: vi.fn(),
  upsertFileContent: vi.fn(),
  createBranch: vi.fn(),
  createPullRequest: vi.fn(),
}));

describe("ai-readme-generator main.ts", () => {
  let mockGenerateText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateText = vi.fn().mockResolvedValue({
      text: "# Generated README\nThis is a test readme.",
    });

    vi.mocked(createProviderFromInputs).mockReturnValue({
      generateText: mockGenerateText,
    } as any);

    vi.mocked(githubWrappers.getRepoContext).mockResolvedValue({
      fullName: "test-owner/test-repo",
      description: "Test repo",
      language: "TypeScript",
      topics: ["test"],
    } as any);

    vi.mocked(githubWrappers.getFileContent).mockResolvedValue();

    vi.mocked(core.getInput).mockImplementation((name) => {
      const inputs: Record<string, string> = {
        "github-token": "gh-token",
        "ai-provider": "openai",
        "openai-api-key": "sk-test",
        "create-pr": "true",
      };
      return inputs[name] ?? "";
    });
  });

  it("generates readme and creates a PR", async () => {
    vi.mocked(githubWrappers.createPullRequest).mockResolvedValue({
      url: "https://github.com/test/pull/1",
      number: 1,
    });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(mockGenerateText).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("readme-content", "# Generated README\nThis is a test readme.");
    
    expect(githubWrappers.createBranch).toHaveBeenCalledWith(expect.any(Object), "test-owner", "test-repo", "ai/update-readme", "main");
    expect(githubWrappers.upsertFileContent).toHaveBeenCalled();
    expect(githubWrappers.createPullRequest).toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("pr-url", "https://github.com/test/pull/1");
  });

  it("skips PR creation if create-pr is false", async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "create-pr") return "false";
      if (name === "github-token") return "gh-token";
      if (name === "openai-api-key") return "sk-test";
      return "";
    });

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(githubWrappers.createBranch).not.toHaveBeenCalled();
    expect(githubWrappers.createPullRequest).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("readme-content", expect.any(String));
  });

  it("fails if inputs are invalid", async () => {
    vi.mocked(core.getInput).mockReturnValue(""); // missing required inputs

    await run();

    expect(core.setFailed).toHaveBeenCalled();
  });
});
