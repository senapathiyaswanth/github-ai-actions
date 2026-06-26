import { describe, it, expect, vi } from "vitest";

import { parseConventionalCommit, groupCommitsByType, determineSemVerBump, type CommitInfo } from "../src/commits.js";
import { filterFiles, getPRMetadata, getPRFiles, getPRDiff, type PRFile } from "../src/pull-request.js";

const mockFile = (filename: string): PRFile => ({
  filename,
  status: "modified",
  additions: 5,
  deletions: 2,
  changes: 7,
  patch: "@@ -1,5 +1,5 @@",
});

describe("filterFiles", () => {
  it("returns all files when no patterns provided", () => {
    const files = [mockFile("src/index.ts"), mockFile("README.md")];
    expect(filterFiles(files, [])).toHaveLength(2);
  });

  it("excludes files matching wildcard pattern", () => {
    const files = [mockFile("src/index.ts"), mockFile("src/index.test.ts"), mockFile("README.md")];
    const filtered = filterFiles(files, ["*.test.ts"]);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((f) => !f.filename.endsWith(".test.ts"))).toBe(true);
  });

  it("handles multiple exclude patterns", () => {
    const files = [
      mockFile("src/index.ts"),
      mockFile("dist/bundle.js"),
      mockFile("coverage/report.html"),
    ];
    const filtered = filterFiles(files, ["dist/*", "coverage/*"]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.filename).toBe("src/index.ts");
  });
});

describe("getPRMetadata, getPRFiles, getPRDiff", () => {
  it("getPRMetadata fetches metadata", async () => {
    const octokit = {
      pulls: {
        get: vi.fn().mockResolvedValue({
          data: {
            number: 1, title: "Title", body: "Body", user: { login: "user" },
            base: { ref: "main" }, head: { ref: "feat" }, draft: false, labels: [{ name: "bug" }],
            created_at: "time", updated_at: "time",
          }
        })
      }
    };
    const meta = await getPRMetadata(octokit, "o", "r", 1);
    expect(meta.author).toBe("user");
    expect(meta.labels).toEqual(["bug"]);
  });

  it("getPRMetadata throws GitHubAPIError on failure", async () => {
    const octokit = { pulls: { get: vi.fn().mockRejectedValue(new Error("Fail")) } };
    await expect(getPRMetadata(octokit, "o", "r", 1)).rejects.toThrow("Fail");
  });

  it("getPRFiles fetches files", async () => {
    const octokit = {
      pulls: { listFiles: vi.fn() },
      paginate: vi.fn().mockResolvedValue([{
        filename: "a.ts", status: "added", additions: 10, deletions: 0, changes: 10, patch: "+ code"
      }])
    };
    const files = await getPRFiles(octokit, "o", "r", 1);
    expect(files[0].filename).toBe("a.ts");
    expect(files[0].status).toBe("added");
  });

  it("getPRFiles throws GitHubAPIError on failure", async () => {
    const octokit = { pulls: { listFiles: vi.fn() }, paginate: vi.fn().mockRejectedValue(new Error("Fail")) };
    await expect(getPRFiles(octokit, "o", "r", 1)).rejects.toThrow("Fail");
  });

  it("getPRDiff builds diff and returns metadata", async () => {
    const octokit = {
      pulls: { 
        get: vi.fn().mockResolvedValue({ data: {
          number: 1, title: "T", base: { ref: "m" }, head: { ref: "f" }, labels: []
        }}),
        listFiles: vi.fn()
      },
      paginate: vi.fn().mockResolvedValue([{
        filename: "a.ts", status: "added", additions: 10, deletions: 0, changes: 10, patch: "+ code"
      }])
    };
    const diff = await getPRDiff(octokit, "o", "r", 1);
    expect(diff.totalAdditions).toBe(10);
    expect(diff.rawDiff).toContain("--- a/a.ts");
    expect(diff.rawDiff).toContain("+ code");
  });
});

const mockCommit = (subject: string, body = ""): CommitInfo => ({
  sha: "abc123",
  message: body ? `${subject}\n\n${body}` : subject,
  author: "Test Author",
  date: "2026-01-01T00:00:00Z",
  url: "https://github.com/test",
  subject,
  body,
});

describe("parseConventionalCommit", () => {
  it("parses feat commit", () => {
    const commit = parseConventionalCommit(mockCommit("feat: add AI provider"));
    expect(commit.type).toBe("feat");
    expect(commit.description).toBe("add AI provider");
    expect(commit.breaking).toBe(false);
  });

  it("parses fix commit with scope", () => {
    const commit = parseConventionalCommit(mockCommit("fix(core): handle null response"));
    expect(commit.type).toBe("fix");
    expect(commit.scope).toBe("core");
    expect(commit.description).toBe("handle null response");
  });

  it("detects breaking change via ! notation", () => {
    const commit = parseConventionalCommit(mockCommit("feat!: remove deprecated API"));
    expect(commit.breaking).toBe(true);
  });

  it("detects breaking change via footer", () => {
    const commit = parseConventionalCommit(
      mockCommit("feat: new API", "BREAKING CHANGE: Old API removed"),
    );
    expect(commit.breaking).toBe(true);
  });

  it("falls back to chore for non-conventional commits", () => {
    const commit = parseConventionalCommit(mockCommit("Update README"));
    expect(commit.type).toBe("chore");
    expect(commit.description).toBe("Update README");
  });
});

describe("groupCommitsByType", () => {
  it("groups commits by type", () => {
    const commits = [
      parseConventionalCommit(mockCommit("feat: feature A")),
      parseConventionalCommit(mockCommit("feat: feature B")),
      parseConventionalCommit(mockCommit("fix: bug fix")),
    ];
    const groups = groupCommitsByType(commits);
    expect(groups["feat"]).toHaveLength(2);
    expect(groups["fix"]).toHaveLength(1);
  });
});

describe("determineSemVerBump", () => {
  it("returns major for breaking changes", () => {
    const commits = [parseConventionalCommit(mockCommit("feat!: breaking"))];
    expect(determineSemVerBump(commits)).toBe("major");
  });

  it("returns minor for features without breaking changes", () => {
    const commits = [parseConventionalCommit(mockCommit("feat: new feature"))];
    expect(determineSemVerBump(commits)).toBe("minor");
  });

  it("returns patch for fixes without features", () => {
    const commits = [parseConventionalCommit(mockCommit("fix: bug fix"))];
    expect(determineSemVerBump(commits)).toBe("patch");
  });

  it("returns major over minor over patch (priority)", () => {
    const commits = [
      parseConventionalCommit(mockCommit("feat: new feature")),
      parseConventionalCommit(mockCommit("feat!: breaking change")),
    ];
    expect(determineSemVerBump(commits)).toBe("major");
  });
});
