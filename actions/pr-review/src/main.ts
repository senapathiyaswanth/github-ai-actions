import * as core from "@actions/core";
import * as github from "@actions/github";
import { createProviderFromInputs } from "@github-ai-actions/core";
import { getPRDiff, filterFiles } from "@github-ai-actions/github";
import {
  validateGitHubToken,
  validateAIProvider,
  validateApiKey,
  validateNumberInRange,
  combineValidations,
  assertValid,
  Logger,
  normalizeError,
  formatErrorForDisplay,
} from "@github-ai-actions/utils";
import { Octokit } from "@octokit/rest";

import { PRAnalyzer } from "./analyzer.js";
import { ReviewOutputter } from "./output.js";
import type { PRReviewInputs } from "./types.js";

const logger = new Logger("ai-pr-review");

/** Parse and validate action inputs */
function parseInputs(): PRReviewInputs {
  const githubToken = core.getInput("github-token", { required: true });
  const aiProvider = core.getInput("ai-provider") || "openai";
  const reviewLevel = (core.getInput("review-level") || "detailed") as PRReviewInputs["reviewLevel"];
  const maxFiles = parseInt(core.getInput("max-files") || "50", 10);
  const failOnScore = parseInt(core.getInput("fail-on-score") || "0", 10);
  const excludeRaw = core.getInput("exclude-patterns");
  const excludePatterns = excludeRaw
    ? excludeRaw
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // Validate inputs
  const validation = combineValidations(
    validateGitHubToken(githubToken),
    validateAIProvider(aiProvider),
    validateNumberInRange(maxFiles, 1, 300, "max-files"),
    validateNumberInRange(failOnScore, 0, 100, "fail-on-score"),
  );
  assertValid(validation, "Input Validation");

  const providerKey = aiProvider.toLowerCase();

  return {
    githubToken,
    aiProvider: providerKey as PRReviewInputs["aiProvider"],
    aiModel: core.getInput("ai-model") || undefined,
    openaiApiKey: core.getInput("openai-api-key") || undefined,
    anthropicApiKey: core.getInput("anthropic-api-key") || undefined,
    geminiApiKey: core.getInput("gemini-api-key") || undefined,
    reviewLevel,
    maxFiles,
    excludePatterns,
    postAsComment: core.getInput("post-as-comment") !== "false",
    failOnScore,
    dryRun: core.getInput("dry-run") === "true",
  };
}

/** Main entry point for the AI PR Review action */
async function run(): Promise<void> {
  try {
    logger.section("GitHub AI Actions — AI PR Review v1.0.0");

    const inputs = parseInputs();

    // Validate the action is running on a pull_request event
    const context = github.context;
    if (!context.payload.pull_request) {
      throw new Error(
        "This action must be triggered by a pull_request event. " +
          `Current event: ${context.eventName}`,
      );
    }

    const prNumber = context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    logger.info(`Processing PR #${prNumber} in ${owner}/${repo}`);

    // Initialize Octokit
    const octokit = new Octokit({ auth: inputs.githubToken });

    // Validate provider API key
    const providerKey = `${inputs.aiProvider}-api-key`;
    const keyMap = {
      openai: inputs.openaiApiKey,
      anthropic: inputs.anthropicApiKey,
      gemini: inputs.geminiApiKey,
    };
    const apiKey = keyMap[inputs.aiProvider];
    assertValid(validateApiKey(apiKey, inputs.aiProvider), providerKey);

    // Create AI provider
    const provider = createProviderFromInputs(inputs.aiProvider, {
      openaiApiKey: inputs.openaiApiKey,
      anthropicApiKey: inputs.anthropicApiKey,
      geminiApiKey: inputs.geminiApiKey,
    }, inputs.aiModel);

    // Fetch PR diff
    logger.info("Fetching PR diff from GitHub...");
    let prDiff = await getPRDiff(octokit, owner, repo, prNumber, inputs.maxFiles);

    // Apply exclusion filters
    if (inputs.excludePatterns.length > 0) {
      const originalCount = prDiff.files.length;
      const filteredFiles = filterFiles(prDiff.files, inputs.excludePatterns);
      logger.info(
        `Excluded ${originalCount - filteredFiles.length} files matching patterns: ${inputs.excludePatterns.join(", ")}`,
      );
      prDiff = { ...prDiff, files: filteredFiles, totalFiles: filteredFiles.length };
    }

    if (prDiff.files.length === 0) {
      logger.warn("No files to review after applying exclusion filters");
      core.setOutput("review-comment", "No files to review.");
      core.setOutput("quality-score", "100");
      core.setOutput("issues-found", "[]");
      return;
    }

    // Analyze the PR
    const analyzer = new PRAnalyzer(provider, inputs);
    const analysis = await analyzer.analyze(prDiff);

    // Build and optionally post the review
    const outputter = new ReviewOutputter(octokit, owner, repo, prNumber, inputs.dryRun);

    let commentUrl: string | undefined;
    let commentBody: string;

    if (inputs.postAsComment) {
      const result = await outputter.postReview(analysis);
      commentBody = result.commentBody;
      commentUrl = result.commentUrl;
    } else {
      const result = await outputter.postReview(analysis);
      commentBody = result.commentBody;
      logger.info("post-as-comment is false, skipping GitHub comment");
    }

    // Set action outputs
    core.setOutput("review-comment", commentBody!);
    core.setOutput("quality-score", String(analysis.scoreCard.overall));
    core.setOutput("issues-found", JSON.stringify(analysis.findings));
    if (commentUrl) {
      core.setOutput("comment-url", commentUrl);
    }

    // Fail if score is below threshold
    if (inputs.failOnScore > 0 && analysis.scoreCard.overall < inputs.failOnScore) {
      core.setFailed(
        `Quality score ${analysis.scoreCard.overall} is below the threshold of ${inputs.failOnScore}. ` +
          `Please address the review findings before merging.`,
      );
      return;
    }

    logger.info(`✅ PR Review completed. Score: ${analysis.scoreCard.overall}/100`);
  } catch (error) {
    const err = normalizeError(error);
    logger.error("Action failed with error", err);
    core.setFailed(formatErrorForDisplay(err));
  }
}

export { run, parseInputs };
