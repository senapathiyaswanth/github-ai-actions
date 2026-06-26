import { describe, it, expect, vi } from "vitest";

import { getCommitsBetween, parseConventionalCommit, groupCommitsByType, determineSemVerBump } from "../src/commits.js";

describe("commits", () => {
  it("getCommitsBetween success", async () => {
    const octokit = {
      repos: {
        compareCommitsWithBasehead: vi.fn().mockResolvedValue({
          data: {
            commits: [
              {
                sha: "123",
                commit: {
                  message: "feat: add stuff\n\nbody here",
                  author: { name: "Test", date: "2024-01-01" },
                },
                author: { login: "testlogin" },
                html_url: "http://test",
              },
            ],
          },
        }),
      },
    } as any;

    const commits = await getCommitsBetween(octokit, "owner", "repo", "v1", "v2");
    expect(commits.length).toBe(1);
    expect(commits[0].subject).toBe("feat: add stuff");
    expect(commits[0].body).toBe("body here");
  });

  it("getCommitsBetween handles empty message or author", async () => {
    const octokit = {
      repos: {
        compareCommitsWithBasehead: vi.fn().mockResolvedValue({
          data: {
            commits: [
              {
                sha: "123",
                commit: {},
                html_url: "http://test",
              },
            ],
          },
        }),
      },
    } as any;

    const commits = await getCommitsBetween(octokit, "owner", "repo", "v1", "v2");
    expect(commits.length).toBe(1);
    expect(commits[0].subject).toBe("");
    expect(commits[0].author).toBe("Unknown");
  });

  it("getCommitsBetween throws error on failure", async () => {
    const octokit = {
      repos: {
        compareCommitsWithBasehead: vi.fn().mockRejectedValue(new Error("API Fail")),
      },
    } as any;

    await expect(getCommitsBetween(octokit, "o", "r", "b")).rejects.toThrow("API Fail");
  });

  it("parses conventional commits correctly", () => {
    const parsed = parseConventionalCommit({
      subject: "feat(auth)!: break stuff",
      body: "",
    } as any);

    expect(parsed.type).toBe("feat");
    expect(parsed.scope).toBe("auth");
    expect(parsed.breaking).toBe(true);
    expect(parsed.description).toBe("break stuff");
  });

  it("groups commits by type", () => {
    const grouped = groupCommitsByType([
      { type: "feat" } as any,
      { type: "fix" } as any,
      { type: "feat" } as any,
    ]);

    expect(grouped.feat.length).toBe(2);
    expect(grouped.fix.length).toBe(1);
  });

  it("determines semver bump", () => {
    expect(determineSemVerBump([{ type: "chore", breaking: false }] as any)).toBe("patch");
    expect(determineSemVerBump([{ type: "feat", breaking: false }] as any)).toBe("minor");
    expect(determineSemVerBump([{ type: "fix", breaking: true }] as any)).toBe("major");
  });
});
