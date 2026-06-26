import type { AIProvider } from "@github-ai-actions/core";
import type { PRDiff } from "@github-ai-actions/github";
import {
  sanitizeForPrompt,
  truncateToTokenBudget,
  Logger,
} from "@github-ai-actions/utils";

import { buildSystemPrompt, buildUserPrompt, parseReviewAnalysis } from "./prompts.js";
import type { PRReviewInputs, ReviewAnalysis } from "./types.js";

const logger = new Logger("pr-review:analyzer");

/** Maximum characters for diff content sent to AI */
const MAX_DIFF_CHARS = 80_000;

/**
 * Core analysis engine for PR review.
 * Orchestrates the AI call and validates the response.
 */
export class PRAnalyzer {
  constructor(
    private readonly provider: AIProvider,
    private readonly inputs: PRReviewInputs,
  ) {}

  /**
   * Analyze a pull request diff and return structured review findings.
   */
  async analyze(prDiff: PRDiff): Promise<ReviewAnalysis> {
    logger.section("Starting AI PR Analysis");
    logger.info(`Analyzing PR #${prDiff.metadata.number}: "${prDiff.metadata.title}"`);
    logger.info(`Provider: ${this.provider.name} (${this.provider.model})`);
    logger.info(`Files: ${prDiff.files.length}, +${prDiff.totalAdditions} -${prDiff.totalDeletions}`);

    const systemPrompt = buildSystemPrompt(this.inputs.reviewLevel);

    // Truncate diff to prevent token overflow
    const truncatedDiff = truncateToTokenBudget(prDiff.rawDiff, 15_000);
    const sanitizedDiff = sanitizeForPrompt(truncatedDiff, MAX_DIFF_CHARS);

    const userPrompt = buildUserPrompt(
      prDiff.metadata.title,
      prDiff.metadata.body,
      sanitizedDiff,
      prDiff.files.map((f) => f.filename),
      {
        totalFiles: prDiff.totalFiles,
        additions: prDiff.totalAdditions,
        deletions: prDiff.totalDeletions,
      },
    );

    logger.debug("Sending to AI provider", {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      diffLength: sanitizedDiff.length,
    });

    const schema = {
      type: "object",
      properties: {
        findings: { type: "array" },
        scoreCard: { type: "object" },
        summary: { type: "string" },
        suggestedAction: { type: "string" },
      },
      required: ["findings", "scoreCard", "summary", "suggestedAction"],
    };

    const rawAnalysis = await this.provider.generateStructured<ReviewAnalysis>({
      systemPrompt,
      userPrompt,
      schema,
      maxTokens: 8_192,
      temperature: 0.1,
    });

    const analysis = parseReviewAnalysis(rawAnalysis);

    logger.info("Analysis complete", {
      findingsCount: analysis.findings.length,
      overallScore: analysis.scoreCard.overall,
      suggestedAction: analysis.suggestedAction,
    });

    return analysis;
  }
}
