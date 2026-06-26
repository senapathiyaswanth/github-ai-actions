import { describe, it, expect, vi } from "vitest";

import { getRepoContext, getFileContent, upsertFileContent, createBranch, createPullRequest } from "../src/repo.js";

describe("repo", () => {
  it("getRepoContext returns correct context", async () => {
    const octokit = {
      repos: {
        get: vi.fn().mockResolvedValue({
          data: {
            full_name: "o/r",
            description: "desc",
            language: "ts",
            topics: ["a"],
            default_branch: "main",
            private: false,
            homepage: "home",
            stargazers_count: 10,
            license: { name: "MIT" },
          },
        }),
      },
    } as any;

    const ctx = await getRepoContext(octokit, "o", "r");
    expect(ctx.fullName).toBe("o/r");
    expect(ctx.license).toBe("MIT");
  });

  it("getRepoContext throws error on failure", async () => {
    const octokit = { repos: { get: vi.fn().mockRejectedValue(new Error("Fail")) } } as any;
    await expect(getRepoContext(octokit, "o", "r")).rejects.toThrow("Fail");
  });

  it("getFileContent decodes base64 content", async () => {
    const octokit = {
      repos: {
        getContent: vi.fn().mockResolvedValue({
          data: {
            type: "file",
            path: "f",
            sha: "s",
            encoding: "base64",
            content: Buffer.from("hello").toString("base64"),
          },
        }),
      },
    } as any;

    const file = await getFileContent(octokit, "o", "r", "f");
    expect(file?.content).toBe("hello");
  });

  it("getFileContent returns null for directory or 404", async () => {
    const octokitArray = { repos: { getContent: vi.fn().mockResolvedValue({ data: [] }) } } as any;
    expect(await getFileContent(octokitArray, "o", "r", "f")).toBeNull();

    const octokit404 = { repos: { getContent: vi.fn().mockRejectedValue(new Error("404 Not Found")) } } as any;
    expect(await getFileContent(octokit404, "o", "r", "f")).toBeNull();
  });

  it("getFileContent throws on arbitrary failure", async () => {
    const octokit = { repos: { getContent: vi.fn().mockRejectedValue(new Error("500 Fail")) } } as any;
    await expect(getFileContent(octokit, "o", "r", "f")).rejects.toThrow("500 Fail");
  });

  it("upsertFileContent", async () => {
    const octokit = {
      repos: {
        createOrUpdateFileContents: vi.fn().mockResolvedValue({
          data: { content: { sha: "abc", html_url: "url" } },
        }),
      },
    } as any;

    const res = await upsertFileContent(octokit, "o", "r", "p", "content", "msg", "b");
    expect(res.sha).toBe("abc");
  });

  it("upsertFileContent throws on arbitrary failure", async () => {
    const octokit = { repos: { createOrUpdateFileContents: vi.fn().mockRejectedValue(new Error("500 Fail")) } } as any;
    await expect(upsertFileContent(octokit, "o", "r", "p", "c", "m", "b")).rejects.toThrow("500 Fail");
  });

  it("createBranch", async () => {
    const octokit = {
      git: {
        getRef: vi.fn().mockResolvedValue({ data: { object: { sha: "abc" } } }),
        createRef: vi.fn().mockResolvedValue({}),
      },
    } as any;

    await createBranch(octokit, "o", "r", "new", "main");
    expect(octokit.git.createRef).toHaveBeenCalledWith({ owner: "o", repo: "r", ref: "refs/heads/new", sha: "abc" });
  });

  it("createBranch throws on arbitrary failure", async () => {
    const octokit = { git: { getRef: vi.fn().mockRejectedValue(new Error("500 Fail")) } } as any;
    await expect(createBranch(octokit, "o", "r", "n", "m")).rejects.toThrow("500 Fail");
  });

  it("createPullRequest", async () => {
    const octokit = {
      pulls: {
        create: vi.fn().mockResolvedValue({ data: { number: 1, html_url: "url" } }),
      },
    } as any;

    const res = await createPullRequest(octokit, "o", "r", "t", "b", "h", "base");
    expect(res.number).toBe(1);
  });

  it("createPullRequest throws on arbitrary failure", async () => {
    const octokit = { pulls: { create: vi.fn().mockRejectedValue(new Error("500 Fail")) } } as any;
    await expect(createPullRequest(octokit, "o", "r", "t", "b", "h", "b2")).rejects.toThrow("500 Fail");
  });
});
