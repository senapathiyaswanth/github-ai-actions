import * as core from "@actions/core";
import * as github from "@actions/github";
import { createProviderFromInputs } from "@github-ai-actions/core";
import {
  getCommitsBetween,
  parseConventionalCommit,
  groupCommitsByType,
  determineSemVerBump,
} from "@github-ai-actions/github";
import {
  validateGitHubToken,
  validateAIProvider,
  validateApiKey,
  validateSemVer,
  sanitizeForPrompt,
  formatReleaseNotes,
  combineValidations,
  assertValid,
  Logger,
  normalizeError,
  formatErrorForDisplay,
} from "@github-ai-actions/utils";
import { Octokit } from "@octokit/rest";

const logger = new Logger("ai-release-notes");

import { SYSTEM_PROMPT } from "./prompts.js";

async function run(): Promise<void> {
  try {
    logger.section("GitHub AI Actions — AI Release Notes Generator v1.0.0");

    const githubToken = core.getInput("github-token", { required: true });
    const aiProvider = (core.getInput("ai-provider") || "openai").toLowerCase();
    const fromTag = core.getInput("from-tag", { required: true });
    const toTag = core.getInput("to-tag") || "HEAD";
    const tone = core.getInput("tone") || "user-friendly";
    const outputFile = core.getInput("output-file");
    const openaiApiKey = core.getInput("openai-api-key") || undefined;
    const anthropicApiKey = core.getInput("anthropic-api-key") || undefined;
    const geminiApiKey = core.getInput("gemini-api-key") || undefined;
    const aiModel = core.getInput("ai-model") || undefined;

    // Validate
    const apiKey = aiProvider === "openai" ? openaiApiKey : aiProvider === "anthropic" ? anthropicApiKey : geminiApiKey;
    assertValid(
      combineValidations(
        validateGitHubToken(githubToken),
        validateAIProvider(aiProvider),
        validateApiKey(apiKey, aiProvider),
      ),
      "Input Validation",
    );

    const octokit = new Octokit({ auth: githubToken });
    const context = github.context;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    logger.info(`Generating release notes from ${fromTag} to ${toTag}`);

    // Fetch commits
    const rawCommits = await getCommitsBetween(octokit, owner, repo, fromTag, toTag);
    logger.info(`Found ${rawCommits.length} commits`);

    if (rawCommits.length === 0) {
      logger.warn("No commits found between the specified tags");
      core.setOutput("release-notes", "No changes found in this release.");
      core.setOutput("breaking-changes", "[]");
      core.setOutput("version-bump", "patch");
      return;
    }

    // Parse commits
    const parsedCommits = rawCommits.map(parseConventionalCommit);
    const groups = groupCommitsByType(parsedCommits);
    const versionBump = determineSemVerBump(parsedCommits);

    // Build commit summary for AI
    const commitSummary = parsedCommits
      .slice(0, 100)
      .map((c) => `- [${c.type}${c.scope ? `(${c.scope})` : ""}${c.breaking ? "!" : ""}] ${c.description} (${c.sha.slice(0, 7)})`)
      .join("\n");

    const provider = createProviderFromInputs(
      aiProvider as "openai" | "anthropic" | "gemini",
      { openaiApiKey, anthropicApiKey, geminiApiKey },
      aiModel,
    );

    const userPrompt = `Generate release notes for the following commits.

Release: ${fromTag} → ${toTag}
Date: ${new Date().toISOString().split("T")[0]}
Tone: ${tone}
Total commits: ${rawCommits.length}

Commits:
${sanitizeForPrompt(commitSummary, 20_000)}

Respond with the JSON object only.`;

    const result = await provider.generateStructured<{
      title: string;
      highlights: string[];
      sections: Record<string, string[]>;
      breakingChanges: string[];
      summary: string;
    }>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      schema: { type: "object" },
      maxTokens: 4_096,
      temperature: 0.3,
    });

    // Format release notes
    const date = new Date().toISOString().split("T")[0] ?? new Date().toLocaleDateString();
    const releaseNotes = formatReleaseNotes(toTag, date, result.sections, result.breakingChanges);

    // Set outputs
    core.setOutput("release-notes", releaseNotes);
    core.setOutput("breaking-changes", JSON.stringify(result.breakingChanges));
    core.setOutput("version-bump", versionBump);

    // Write to file if requested
    if (outputFile) {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(outputFile, releaseNotes, "utf-8");
      logger.info(`Release notes written to ${outputFile}`);
    }

    // Write to GitHub Actions summary
    await core.summary
      .addHeading(`Release Notes: ${toTag}`)
      .addRaw(releaseNotes)
      .write();

    logger.info(`✅ Release notes generated. Suggested version bump: ${versionBump}`);
  } catch (error) {
    const err = normalizeError(error);
    logger.error("Action failed", err);
    core.setFailed(formatErrorForDisplay(err));
  }
}

export { run };
