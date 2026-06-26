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
  },
}));

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@github-ai-actions/core", () => ({
  createProviderFromInputs: vi.fn(),
}));

vi.mock("@github-ai-actions/github", () => ({
  getCommitsBetween: vi.fn(),
  parseConventionalCommit: vi.fn().mockReturnValue({
    type: "feat",
    scope: "",
    breaking: false,
    description: "add stuff",
    sha: "abc",
  }),
  groupCommitsByType: vi.fn(),
  determineSemVerBump: vi.fn().mockReturnValue("minor"),
}));

describe("ai-release-notes main.ts", () => {
  let mockGenerateStructured: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateStructured = vi.fn().mockResolvedValue({
      title: "v1.0.0",
      highlights: ["Did things"],
      sections: { Features: ["Feat 1"] },
      breakingChanges: [],
      summary: "Summary",
    });

    vi.mocked(createProviderFromInputs).mockReturnValue({
      generateStructured: mockGenerateStructured,
    } as any);

    vi.mocked(githubWrappers.getCommitsBetween).mockResolvedValue([
      { sha: "abc", message: "feat: add stuff" } as any
    ]);

    vi.mocked(core.getInput).mockImplementation((name) => {
      const inputs: Record<string, string> = {
        "github-token": "gh-token",
        "from-tag": "v0.9.0",
        "to-tag": "v1.0.0",
        "ai-provider": "openai",
        "openai-api-key": "sk-test",
      };
      return inputs[name] ?? "";
    });
  });

  it("generates release notes and sets outputs", async () => {
    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(githubWrappers.getCommitsBetween).toHaveBeenCalledWith(expect.any(Object), "test-owner", "test-repo", "v0.9.0", "v1.0.0");
    expect(mockGenerateStructured).toHaveBeenCalled();
    
    expect(core.setOutput).toHaveBeenCalledWith("release-notes", expect.any(String));
    expect(core.setOutput).toHaveBeenCalledWith("breaking-changes", "[]");
    expect(core.setOutput).toHaveBeenCalledWith("version-bump", "minor");
  });

  it("handles zero commits gracefully", async () => {
    vi.mocked(githubWrappers.getCommitsBetween).mockResolvedValue([]);

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(mockGenerateStructured).not.toHaveBeenCalled();
    expect(core.setOutput).toHaveBeenCalledWith("release-notes", "No changes found in this release.");
  });

  it("fails if inputs are invalid", async () => {
    vi.mocked(core.getInput).mockReturnValue(""); // missing required inputs

    await run();

    expect(core.setFailed).toHaveBeenCalled();
  });
});
