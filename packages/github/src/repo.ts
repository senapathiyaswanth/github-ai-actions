import { GitHubAPIError } from "@github-ai-actions/utils";
import type { Octokit } from "@octokit/rest";

/** Repository context for AI operations */
export interface RepoContext {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  language: string | null;
  topics: string[];
  defaultBranch: string;
  isPrivate: boolean;
  homepage: string | null;
  starsCount: number;
  license: string | null;
}

/** File content from the GitHub API */
export interface FileContent {
  path: string;
  content: string;
  sha: string;
  encoding: string;
}

/**
 * Fetch repository context for AI-powered operations.
 */
export async function getRepoContext(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<RepoContext> {
  try {
    const { data } = await octokit.repos.get({ owner, repo });

    return {
      owner,
      repo,
      fullName: data.full_name,
      description: data.description,
      language: data.language ?? null,
      topics: data.topics ?? [],
      defaultBranch: data.default_branch,
      isPrivate: data.private,
      homepage: data.homepage ?? null,
      starsCount: data.stargazers_count,
      license: data.license?.name ?? null,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("getRepoContext", msg);
  }
}

/**
 * Read a file from a repository.
 * Returns null if file doesn't exist (404).
 */
export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<FileContent | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(data) || data.type !== "file") {
      return null;
    }

    // Decode base64 content
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return {
      path: data.path,
      content,
      sha: data.sha,
      encoding: data.encoding,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("getFileContent", msg);
  }
}

/**
 * Create or update a file in a repository.
 */
export async function upsertFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  existingSha?: string,
): Promise<{ sha: string; url: string }> {
  try {
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      sha: existingSha,
    });

    return {
      sha: data.content?.sha ?? "",
      url: data.content?.html_url ?? "",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("upsertFileContent", msg);
  }
}

/**
 * Create a new branch in a repository.
 */
export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  fromRef: string,
): Promise<void> {
  try {
    // Get the SHA of fromRef
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${fromRef}`,
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("createBranch", msg);
  }
}

/**
 * Create a pull request.
 */
export async function createPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string,
): Promise<{ number: number; url: string }> {
  try {
    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    });

    return { number: data.number, url: data.html_url };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("createPullRequest", msg);
  }
}
