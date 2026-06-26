import * as core from "@actions/core";
import * as github from "@actions/github";
import { createProviderFromInputs } from "@github-ai-actions/core";
import {
  getRepoContext,
  getFileContent,
  upsertFileContent,
  createBranch,
  createPullRequest,
} from "@github-ai-actions/github";
import {
  validateGitHubToken,
  validateAIProvider,
  validateApiKey,
  sanitizeForPrompt,
  combineValidations,
  assertValid,
  Logger,
  normalizeError,
  formatErrorForDisplay,
} from "@github-ai-actions/utils";
import { Octokit } from "@octokit/rest";

const logger = new Logger("ai-readme-generator");

import { SYSTEM_PROMPT } from "./prompts.js";

async function run(): Promise<void> {
  try {
    logger.section("GitHub AI Actions — AI README Generator v1.0.0");

    const githubToken = core.getInput("github-token", { required: true });
    const aiProvider = (core.getInput("ai-provider") || "openai").toLowerCase();
    const outputPath = core.getInput("output-path") || "README.md";
    const sections = core.getInput("sections") || "overview,installation,usage,configuration,contributing,license";
    const createPR = core.getInput("create-pr") !== "false";
    const prBranch = core.getInput("pr-branch") || "ai/update-readme";
    const prTitle = core.getInput("pr-title") || "docs: update README with AI-generated content";
    const additionalContext = core.getInput("additional-context");
    const includeBadges = core.getInput("include-badges") !== "false";
    const openaiApiKey = core.getInput("openai-api-key") || undefined;
    const anthropicApiKey = core.getInput("anthropic-api-key") || undefined;
    const geminiApiKey = core.getInput("gemini-api-key") || undefined;
    const aiModel = core.getInput("ai-model") || undefined;

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
    const { owner, repo } = context.repo;
    const defaultBranch = context.payload.repository?.default_branch as string ?? "main";

    // Gather repo context
    logger.info("Gathering repository context...");
    const repoCtx = await getRepoContext(octokit, owner, repo);
    const existingReadme = await getFileContent(octokit, owner, repo, outputPath);
    const packageJson = await getFileContent(octokit, owner, repo, "package.json");

    const provider = createProviderFromInputs(
      aiProvider as "openai" | "anthropic" | "gemini",
      { openaiApiKey, anthropicApiKey, geminiApiKey },
      aiModel,
    );

    const repoInfo = [
      `Repository: ${repoCtx.fullName}`,
      `Description: ${repoCtx.description ?? "Not provided"}`,
      `Language: ${repoCtx.language ?? "Unknown"}`,
      `Topics: ${repoCtx.topics.join(", ") || "None"}`,
      `License: ${repoCtx.license ?? "Not specified"}`,
      `Homepage: ${repoCtx.homepage ?? "Not set"}`,
      packageJson ? `\npackage.json content:\n${packageJson.content.slice(0, 2000)}` : "",
      additionalContext ? `\nAdditional context from maintainer:\n${additionalContext}` : "",
    ].join("\n");

    const badgesSection = includeBadges
      ? `\nInclude these badges at the top (use placeholder URLs for now):
      - GitHub Actions CI badge
      - License badge
      - npm version badge (if applicable)`
      : "";

    const userPrompt = `Generate a README.md for the following GitHub repository.

${sanitizeForPrompt(repoInfo, 10_000)}

Sections to include: ${sections}${badgesSection}

${existingReadme ? `\nExisting README (use as reference for content, but rewrite professionally):\n${existingReadme.content.slice(0, 5000)}` : "\nNo existing README found. Generate from scratch."}

Generate the complete README.md content now.`;

    logger.info("Generating README with AI...");
    const response = await provider.generateText({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 8_192,
      temperature: 0.4,
    });

    const readmeContent = response.text;

    // Set output
    core.setOutput("readme-content", readmeContent);

    if (createPR) {
      logger.info(`Creating PR on branch: ${prBranch}`);
      try {
        await createBranch(octokit, owner, repo, prBranch, defaultBranch);
      } catch (branchError) {
        // Branch may already exist — continue
        logger.warn(`Branch ${prBranch} may already exist: ${(branchError as Error).message}`);
      }

      await upsertFileContent(
        octokit,
        owner,
        repo,
        outputPath,
        readmeContent,
        "docs: update README with AI-generated content",
        prBranch,
        existingReadme?.sha,
      );

      const pr = await createPullRequest(
        octokit,
        owner,
        repo,
        prTitle,
        `## 🤖 AI-Generated README\n\nThis PR was created by [GitHub AI Actions](https://github.com/github-ai-actions/github-ai-actions).\n\nPlease review the generated content before merging.`,
        prBranch,
        defaultBranch,
      );

      core.setOutput("pr-url", pr.url);
      core.setOutput("pr-number", String(pr.number));
      logger.info(`✅ PR created: ${pr.url}`);
    }

    await core.summary
      .addHeading("AI-Generated README")
      .addRaw(readmeContent.slice(0, 5000))
      .write();

    logger.info("✅ README generation complete");
  } catch (error) {
    const err = normalizeError(error);
    logger.error("Action failed", err);
    core.setFailed(formatErrorForDisplay(err));
  }
}

export { run };
