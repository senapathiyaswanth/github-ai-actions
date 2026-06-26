import * as core from "@actions/core";
import { createProviderFromInputs } from "@github-ai-actions/core";
import {
  validateAIProvider,
  validateApiKey,
  sanitizeForPrompt,
  truncateToTokenBudget,
  combineValidations,
  assertValid,
  Logger,
  normalizeError,
  formatErrorForDisplay,
} from "@github-ai-actions/utils";

const logger = new Logger("ai-commit-message");

import { SYSTEM_PROMPT } from "./prompts.js";

interface CommitMessageResult {
  type: string;
  scope: string;
  breaking: boolean;
  description: string;
  body: string;
  footer: string;
  fullMessage: string;
}

async function run(): Promise<void> {
  try {
    logger.section("GitHub AI Actions — AI Commit Message Generator v1.0.0");

    const aiProvider = (core.getInput("ai-provider") || "openai").toLowerCase();
    const diff = core.getInput("diff", { required: true });
    const allowedTypes = core.getInput("commit-types") || "feat,fix,docs,style,refactor,perf,test,build,ci,chore";
    const forcedScope = core.getInput("scope");
    const maxLength = parseInt(core.getInput("max-length") || "72", 10);
    const includeBody = core.getInput("include-body") !== "false";
    const context = core.getInput("context");
    const openaiApiKey = core.getInput("openai-api-key") || undefined;
    const anthropicApiKey = core.getInput("anthropic-api-key") || undefined;
    const geminiApiKey = core.getInput("gemini-api-key") || undefined;
    const aiModel = core.getInput("ai-model") || undefined;

    // Validate
    const validation = combineValidations(
      validateAIProvider(aiProvider),
      validateApiKey(
        aiProvider === "openai" ? openaiApiKey : aiProvider === "anthropic" ? anthropicApiKey : geminiApiKey,
        aiProvider,
      ),
    );
    assertValid(validation, "Input Validation");

    if (!diff.trim()) {
      throw new Error("The 'diff' input is empty. Make sure there are staged changes.");
    }

    const provider = createProviderFromInputs(
      aiProvider as "openai" | "anthropic" | "gemini",
      { openaiApiKey, anthropicApiKey, geminiApiKey },
      aiModel,
    );

    // Sanitize and truncate diff
    const sanitizedDiff = sanitizeForPrompt(truncateToTokenBudget(diff, 10_000));

    const scopeInstruction = forcedScope ? `\nForce scope: "${forcedScope}"` : "";
    const contextInstruction = context ? `\nAdditional context: ${context}` : "";
    const bodyInstruction = !includeBody ? "\nDo NOT include a body. Subject line only." : "";
    const typesInstruction = `\nAllowed types: ${allowedTypes}`;

    const userPrompt = `Generate a Conventional Commit message for the following staged changes.

Max subject line length: ${String(maxLength)} characters${scopeInstruction}${typesInstruction}${bodyInstruction}${contextInstruction}

Diff:
\`\`\`diff
${sanitizedDiff}
\`\`\`

Respond with the JSON object only.`;

    const schema = {
      type: "object",
      required: ["type", "scope", "breaking", "description", "body", "footer", "fullMessage"],
    };

    const result = await provider.generateStructured<CommitMessageResult>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      schema,
      maxTokens: 1_024,
      temperature: 0.2,
    });

    // Set outputs
    core.setOutput("commit-message", result.fullMessage);
    core.setOutput("commit-type", result.type);
    core.setOutput("commit-scope", result.scope);
    core.setOutput("breaking-change", String(result.breaking));
    core.setOutput("subject-line", `${result.type}${result.scope ? `(${result.scope})` : ""}${result.breaking ? "!" : ""}: ${result.description}`);

    logger.info("✅ Commit message generated:");
    logger.info(result.fullMessage.split("\n")[0] ?? "");

    // Also log to summary
    await core.summary
      .addHeading("AI Commit Message")
      .addCodeBlock(result.fullMessage, "text")
      .write();
  } catch (error) {
    const err = normalizeError(error);
    logger.error("Action failed", err);
    core.setFailed(formatErrorForDisplay(err));
  }
}

export { run };
