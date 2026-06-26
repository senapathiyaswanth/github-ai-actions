import type { PRReviewInputs, ReviewAnalysis } from "./types.js";

const REVIEW_LEVEL_INSTRUCTIONS: Record<PRReviewInputs["reviewLevel"], string> = {
  quick: `
Perform a QUICK review focusing only on critical issues:
- Critical bugs that will cause runtime failures
- Obvious security vulnerabilities
- Missing error handling
Be concise. Focus on the top 3-5 most important issues.`,

  detailed: `
Perform a DETAILED review covering:
- Bugs and logical errors
- Security vulnerabilities and input validation
- Code smells and anti-patterns
- Performance issues
- Missing tests or documentation
- API design and maintainability
Provide specific, actionable feedback with examples.`,

  thorough: `
Perform a THOROUGH review examining every aspect:
- All bugs, edge cases, and error conditions
- Security vulnerabilities (OWASP Top 10 patterns)
- Performance and algorithmic complexity
- Code organization and SOLID principles
- Test coverage and quality
- Documentation completeness
- Accessibility and internationalization (if applicable)
- Dependency security
Be comprehensive and educational. Explain WHY each issue matters.`,
};

/**
 * Build the system prompt for PR review.
 */
export function buildSystemPrompt(reviewLevel: PRReviewInputs["reviewLevel"]): string {
  return `You are an expert code reviewer with deep knowledge of software engineering best practices, security, and performance optimization.

${REVIEW_LEVEL_INSTRUCTIONS[reviewLevel]}

You MUST respond with a valid JSON object matching this exact structure:
{
  "findings": [
    {
      "severity": "critical|high|medium|low|info",
      "category": "Bug|Security|Performance|Code Quality|Maintainability|Testing|Documentation|Style",
      "title": "Short descriptive title",
      "description": "Detailed explanation of the issue",
      "file": "path/to/file.ts (optional)",
      "line": 42 (optional line number),
      "suggestion": "How to fix it (optional)",
      "codeExample": "Fixed code example (optional)"
    }
  ],
  "scoreCard": {
    "overall": 75,
    "breakdown": {
      "correctness": 80,
      "security": 70,
      "maintainability": 75,
      "performance": 85,
      "style": 65
    },
    "summary": "Overall assessment in 2-3 sentences"
  },
  "summary": "Executive summary of the PR (3-5 sentences)",
  "suggestedAction": "approve|comment|request_changes"
}

Scoring guidelines:
- 90-100: Excellent, production-ready
- 75-89: Good, minor improvements suggested
- 60-74: Acceptable, several improvements needed
- 40-59: Needs significant work before merging
- 0-39: Major issues, request changes

Be fair, constructive, and specific. Focus on what matters most.`;
}

/**
 * Build the user prompt containing the actual diff to review.
 */
export function buildUserPrompt(
  prTitle: string,
  prBody: string | null,
  diffContent: string,
  fileList: string[],
  stats: { totalFiles: number; additions: number; deletions: number },
): string {
  const fileListStr = fileList.slice(0, 20).join("\n- ");
  const moreFiles = fileList.length > 20 ? `\n... and ${fileList.length - 20} more files` : "";

  return `## Pull Request: ${prTitle}

**Description:**
${prBody ?? "No description provided."}

**Statistics:**
- Files changed: ${stats.totalFiles}
- Additions: +${stats.additions}
- Deletions: -${stats.deletions}

**Files changed:**
- ${fileListStr}${moreFiles}

## Diff

\`\`\`diff
${diffContent}
\`\`\`

Please review this pull request and respond with the JSON analysis.`;
}

/**
 * Build a prompt for analyzing a specific file in detail.
 */
export function buildFileAnalysisPrompt(filename: string, patch: string): string {
  return `Analyze the following changes to \`${filename}\`:

\`\`\`diff
${patch}
\`\`\`

Focus specifically on issues in this file. Return your analysis as JSON.`;
}

/** Parse AI response into a ReviewAnalysis, with validation */
export function parseReviewAnalysis(rawAnalysis: unknown): ReviewAnalysis {
  if (typeof rawAnalysis !== "object" || rawAnalysis === null) {
    throw new Error("AI response is not a valid object");
  }

  const analysis = rawAnalysis as Record<string, unknown>;

  if (!Array.isArray(analysis.findings)) {
    throw new Error("AI response missing 'findings' array");
  }

  if (typeof analysis.scoreCard !== "object" || analysis.scoreCard === null) {
    throw new Error("AI response missing 'scoreCard' object");
  }

  if (typeof analysis.summary !== "string") {
    throw new Error("AI response missing 'summary' string");
  }

  return rawAnalysis as ReviewAnalysis;
}
