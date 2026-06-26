/**
 * @github-ai-actions/github
 *
 * GitHub API utilities for GitHub AI Actions.
 * Provides typed wrappers around Octokit for common operations.
 */

// Pull Request
export type { PRFile, PRMetadata, PRDiff } from "./pull-request.js";
export { getPRMetadata, getPRFiles, getPRDiff, filterFiles } from "./pull-request.js";

// Commits
export type { CommitInfo, ConventionalCommit } from "./commits.js";
export {
  getCommitsBetween,
  parseConventionalCommit,
  groupCommitsByType,
  determineSemVerBump,
} from "./commits.js";

// Comments
export {
  postOrUpdatePRComment,
  createInlineReviewComment,
  submitPRReview,
} from "./comments.js";

// Repository
export type { RepoContext, FileContent } from "./repo.js";
export {
  getRepoContext,
  getFileContent,
  upsertFileContent,
  createBranch,
  createPullRequest,
} from "./repo.js";
