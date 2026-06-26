/** Input types for the AI PR Review action */
export interface PRReviewInputs {
  githubToken: string;
  aiProvider: "openai" | "anthropic" | "gemini";
  aiModel?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  reviewLevel: "quick" | "detailed" | "thorough";
  maxFiles: number;
  excludePatterns: string[];
  postAsComment: boolean;
  failOnScore: number;
  dryRun: boolean;
}

/** The complete analysis result from the AI */
export interface ReviewAnalysis {
  findings: ReviewFinding[];
  scoreCard: ReviewScoreCard;
  summary: string;
  suggestedAction: "approve" | "comment" | "request_changes";
}

/** A single code review finding */
export interface ReviewFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: ReviewCategory;
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion?: string;
  codeExample?: string;
}

/** Categories of review findings */
export type ReviewCategory =
  | "Bug"
  | "Security"
  | "Performance"
  | "Code Quality"
  | "Maintainability"
  | "Testing"
  | "Documentation"
  | "Style";

/** Quality score breakdown */
export interface ReviewScoreCard {
  overall: number;
  breakdown: {
    correctness: number;
    security: number;
    maintainability: number;
    performance: number;
    style: number;
  };
  summary: string;
}
