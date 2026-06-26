import { GitHubAPIError } from "@github-ai-actions/utils";
import type { Octokit } from "@octokit/rest";

/** A parsed commit from the GitHub API */
export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  /** First line of the commit message (subject) */
  subject: string;
  /** Body of the commit message (everything after the first blank line) */
  body: string;
}

/** Parsed Conventional Commit */
export interface ConventionalCommit extends CommitInfo {
  type: string;
  scope?: string;
  breaking: boolean;
  description: string;
}

/**
 * Fetch commits between two refs (tags, SHAs, or branch names).
 * Returns up to 250 commits for performance.
 */
export async function getCommitsBetween(
  octokit: Octokit,
  owner: string,
  repo: string,
  base: string,
  head = "HEAD",
  maxCommits = 250,
): Promise<CommitInfo[]> {
  try {
    const { data } = await octokit.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${base}...${head}`,
      per_page: 100,
    });

    return data.commits
      .slice(0, maxCommits)
      .map((commit) => {
        const message = commit.commit.message ?? "";
        const lines = message.split("\n");
        const subject = lines[0] ?? "";
        const body = lines.slice(2).join("\n").trim();

        return {
          sha: commit.sha,
          message,
          author:
            commit.commit.author?.name ?? commit.author?.login ?? "Unknown",
          date: commit.commit.author?.date ?? new Date().toISOString(),
          url: commit.html_url,
          subject,
          body,
        };
      });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("getCommitsBetween", msg);
  }
}

/**
 * Parse a conventional commit message.
 * Format: type(scope)!: description
 */
export function parseConventionalCommit(commit: CommitInfo): ConventionalCommit {
  // Regex: type(scope)!: description
  const regex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
  const match = regex.exec(commit.subject);

  if (!match) {
    return {
      ...commit,
      type: "chore",
      scope: undefined,
      breaking: commit.body.includes("BREAKING CHANGE:"),
      description: commit.subject,
    };
  }

  const [, type, scope, bang, description] = match;
  const breaking = bang === "!" || commit.body.includes("BREAKING CHANGE:");

  return {
    ...commit,
    type: type ?? "chore",
    scope: scope ?? undefined,
    breaking,
    description: description ?? commit.subject,
  };
}

/**
 * Group commits by their Conventional Commit type.
 */
export function groupCommitsByType(
  commits: ConventionalCommit[],
): Record<string, ConventionalCommit[]> {
  return commits.reduce<Record<string, ConventionalCommit[]>>((acc, commit) => {
    const type = commit.type;
    return { ...acc, [type]: [...(acc[type] ?? []), commit] };
  }, {});
}

/**
 * Determine the semantic version bump based on commits.
 * BREAKING CHANGE = major, feat = minor, fix/perf/etc. = patch.
 */
export function determineSemVerBump(commits: ConventionalCommit[]): "major" | "minor" | "patch" {
  if (commits.some((c) => c.breaking)) return "major";
  if (commits.some((c) => c.type === "feat")) return "minor";
  return "patch";
}
