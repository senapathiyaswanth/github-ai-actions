import { GitHubAPIError } from "@github-ai-actions/utils";
import type { Octokit } from "@octokit/rest";

/** A parsed file change from a PR diff */
export interface PRFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previousFilename?: string;
  contentsUrl?: string;
  rawUrl?: string;
}

/** Pull request metadata */
export interface PRMetadata {
  number: number;
  title: string;
  body: string | null;
  author: string;
  baseBranch: string;
  headBranch: string;
  isDraft: boolean;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

/** Full PR diff info */
export interface PRDiff {
  metadata: PRMetadata;
  files: PRFile[];
  rawDiff: string;
  totalAdditions: number;
  totalDeletions: number;
  totalFiles: number;
}

/**
 * Fetch pull request metadata.
 */
export async function getPRMetadata(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PRMetadata> {
  try {
    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      author: pr.user?.login ?? "unknown",
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      isDraft: pr.draft ?? false,
      labels: pr.labels.map((l) => l.name),
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("getPRMetadata", msg);
  }
}

/**
 * Fetch all files changed in a pull request.
 * Handles pagination automatically.
 */
export async function getPRFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  maxFiles = 100,
): Promise<PRFile[]> {
  try {
    const files = await octokit.paginate(octokit.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    return files.slice(0, maxFiles).map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
      previousFilename: file.previous_filename,
      contentsUrl: file.contents_url,
      rawUrl: file.raw_url,
    }));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("getPRFiles", msg);
  }
}

/**
 * Get the full diff for a pull request.
 * Returns both structured file data and the raw diff string.
 */
export async function getPRDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  maxFiles = 50,
): Promise<PRDiff> {
  const [metadata, files] = await Promise.all([
    getPRMetadata(octokit, owner, repo, prNumber),
    getPRFiles(octokit, owner, repo, prNumber, maxFiles),
  ]);

  // Build a readable raw diff from file patches
  const rawDiff = files
    .filter((f) => f.patch)
    .map((f) => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch ?? ""}`)
    .join("\n\n");

  return {
    metadata,
    files,
    rawDiff,
    totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
    totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
    totalFiles: files.length,
  };
}

/**
 * Filter PR files by patterns (glob-style simple matching).
 * Used to exclude test files, generated files, etc.
 */
export function filterFiles(files: PRFile[], excludePatterns: string[]): PRFile[] {
  if (excludePatterns.length === 0) return files;

  return files.filter((file) => {
    return !excludePatterns.some((pattern) => matchesPattern(file.filename, pattern));
  });
}

/** Simple glob-style pattern matching */
function matchesPattern(filename: string, pattern: string): boolean {
  // Convert glob to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`).test(filename);
}
