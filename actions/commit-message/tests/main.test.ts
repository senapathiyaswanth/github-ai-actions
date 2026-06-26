import * as core from "@actions/core";
import { createProviderFromInputs } from "@github-ai-actions/core";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { run } from "../src/main.js";

// Mock @actions/core
vi.mock("@actions/core", () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  summary: {
    addHeading: vi.fn().mockReturnThis(),
    addCodeBlock: vi.fn().mockReturnThis(),
    write: vi.fn().mockResolvedValue(),
  },
}));

// Mock @github-ai-actions/core
vi.mock("@github-ai-actions/core", () => ({
  createProviderFromInputs: vi.fn(),
}));

describe("ai-commit-message main.ts", () => {
  let mockGenerateStructured: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateStructured = vi.fn().mockResolvedValue({
      type: "feat",
      scope: "auth",
      breaking: false,
      description: "add OAuth2 login support",
      body: "Implements OAuth2 flow using...",
      footer: "",
      fullMessage: "feat(auth): add OAuth2 login support\n\nImplements OAuth2 flow using...",
    });

    vi.mocked(createProviderFromInputs).mockReturnValue({
      generateStructured: mockGenerateStructured,
    } as any);

    // Default valid inputs
    vi.mocked(core.getInput).mockImplementation((name) => {
      const inputs: Record<string, string> = {
        "ai-provider": "openai",
        "openai-api-key": "sk-test",
        diff: "diff --git a/file b/file\n+ added line",
        "commit-types": "feat,fix",
        "max-length": "72",
      };
      return inputs[name] ?? "";
    });
  });

  it("successfully generates a commit message and sets outputs", async () => {
    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(createProviderFromInputs).toHaveBeenCalledWith("openai", expect.any(Object), undefined);
    expect(mockGenerateStructured).toHaveBeenCalled();
    
    expect(core.setOutput).toHaveBeenCalledWith(
      "commit-message",
      "feat(auth): add OAuth2 login support\n\nImplements OAuth2 flow using..."
    );
    expect(core.setOutput).toHaveBeenCalledWith("commit-type", "feat");
    expect(core.setOutput).toHaveBeenCalledWith("commit-scope", "auth");
    expect(core.setOutput).toHaveBeenCalledWith("breaking-change", "false");
    expect(core.setOutput).toHaveBeenCalledWith("subject-line", "feat(auth): add OAuth2 login support");
  });

  it("fails if diff is empty", async () => {
    vi.mocked(core.getInput).mockImplementation((name) => {
      if (name === "diff") return "   \n  ";
      if (name === "openai-api-key") return "sk-test";
      return "";
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining("diff' input is empty"));
    expect(mockGenerateStructured).not.toHaveBeenCalled();
  });

  it("handles provider generation errors gracefully", async () => {
    mockGenerateStructured.mockRejectedValue(new Error("API Rate Limit"));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining("API Rate Limit"));
  });
});
