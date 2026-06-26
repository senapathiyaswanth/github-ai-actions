import { describe, it, expect, vi } from "vitest";

import { postOrUpdatePRComment, createInlineReviewComment, submitPRReview } from "../src/comments.js";

describe("comments", () => {
  it("creates a new PR comment if none exists", async () => {
    const octokit = {
      paginate: vi.fn().mockResolvedValue([]),
      issues: {
        listComments: vi.fn(),
        createComment: vi.fn().mockResolvedValue({ data: { id: 10 } }),
      },
    } as any;

    const result = await postOrUpdatePRComment(octokit, "owner", "repo", 1, "body");
    expect(result).toEqual({ commentId: 10, isNew: true });
    expect(octokit.issues.createComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      issue_number: 1,
      body: "body",
    });
  });

  it("updates an existing PR comment", async () => {
    const octokit = {
      paginate: vi.fn().mockResolvedValue([{ id: 42, body: "<!-- github-ai-actions-review -->\nold" }]),
      issues: {
        listComments: vi.fn(),
        updateComment: vi.fn().mockResolvedValue({}),
      },
    } as any;

    const result = await postOrUpdatePRComment(octokit, "owner", "repo", 1, "new body");
    expect(result).toEqual({ commentId: 42, isNew: false });
    expect(octokit.issues.updateComment).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      comment_id: 42,
      body: "new body",
    });
  });

  it("throws GitHubAPIError on postOrUpdatePRComment failure", async () => {
    const octokit = {
      paginate: vi.fn().mockRejectedValue(new Error("API Error")),
      issues: { listComments: vi.fn() },
    } as any;

    await expect(postOrUpdatePRComment(octokit, "o", "r", 1, "b")).rejects.toThrow("API Error");
  });

  it("creates inline review comment", async () => {
    const octokit = {
      pulls: {
        createReviewComment: vi.fn().mockResolvedValue({ data: { id: 99 } }),
      },
    } as any;

    const result = await createInlineReviewComment(octokit, "o", "r", 1, "sha", "file.ts", 10, "bad code");
    expect(result).toBe(99);
    expect(octokit.pulls.createReviewComment).toHaveBeenCalledWith({
      owner: "o",
      repo: "r",
      pull_number: 1,
      commit_id: "sha",
      path: "file.ts",
      line: 10,
      body: "bad code",
    });
  });

  it("throws on inline review comment failure", async () => {
    const octokit = {
      pulls: { createReviewComment: vi.fn().mockRejectedValue(new Error("Fail")) },
    } as any;

    await expect(createInlineReviewComment(octokit, "o", "r", 1, "sha", "f", 1, "b")).rejects.toThrow("Fail");
  });

  it("submits a PR review", async () => {
    const octokit = {
      pulls: {
        createReview: vi.fn().mockResolvedValue({ data: { id: 77 } }),
      },
    } as any;

    const result = await submitPRReview(octokit, "o", "r", 1, "sha", "body", "APPROVE");
    expect(result).toBe(77);
    expect(octokit.pulls.createReview).toHaveBeenCalledWith({
      owner: "o",
      repo: "r",
      pull_number: 1,
      commit_id: "sha",
      body: "body",
      event: "APPROVE",
    });
  });

  it("throws on submit PR review failure", async () => {
    const octokit = {
      pulls: { createReview: vi.fn().mockRejectedValue(new Error("Fail")) },
    } as any;

    await expect(submitPRReview(octokit, "o", "r", 1, "sha", "b")).rejects.toThrow("Fail");
  });
});
