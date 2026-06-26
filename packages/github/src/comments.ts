import { GitHubAPIError, Logger } from "@github-ai-actions/utils";
import type { Octokit } from "@octokit/rest";

const logger = new Logger("github:comments");

/**
 * Post a general comment on a pull request.
 * Checks for existing AI review comment and updates it if found.
 */
export async function postOrUpdatePRComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  markerComment = "<!-- github-ai-actions-review -->",
): Promise<{ commentId: number; isNew: boolean }> {
  try {
    // Check for existing AI review comment
    const existing = await findExistingComment(octokit, owner, repo, prNumber, markerComment);

    if (existing) {
      logger.debug(`Updating existing review comment #${existing.id}`);
      await octokit.issues.updateComment({
        owner,
        repo,
        comment_id: existing.id,
        body,
      });
      return { commentId: existing.id, isNew: false };
    }

    logger.debug("Creating new review comment");
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
    return { commentId: data.id, isNew: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("postOrUpdatePRComment", msg);
  }
}

/** Post an inline review comment on a specific file/line */
export async function createInlineReviewComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  commitSha: string,
  filePath: string,
  line: number,
  body: string,
): Promise<number> {
  try {
    const { data } = await octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: commitSha,
      path: filePath,
      line,
      body,
    });
    return data.id;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("createInlineReviewComment", msg);
  }
}

/** Submit a complete PR review with multiple inline comments */
export async function submitPRReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  commitSha: string,
  body: string,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" = "COMMENT",
): Promise<number> {
  try {
    const { data } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: commitSha,
      body,
      event,
    });
    return data.id;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new GitHubAPIError("submitPRReview", msg);
  }
}

/** Find an existing comment by a marker string */
async function findExistingComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  marker: string,
): Promise<{ id: number } | null> {
  const comments = await octokit.paginate(octokit.issues.listComments, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  const found = comments.find((c) => c.body?.includes(marker));
  return found ? { id: found.id } : null;
}
