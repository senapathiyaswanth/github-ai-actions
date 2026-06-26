/**
 * Core type definitions for the AI provider abstraction layer.
 * All AI interactions in GitHub AI Actions go through these interfaces.
 */

/** Supported AI provider names */
export type ProviderName = "openai" | "anthropic" | "gemini";

/** Configuration for selecting and initializing an AI provider */
export interface ProviderConfig {
  /** Which provider to use */
  provider: ProviderName;
  /** API key for the selected provider */
  apiKey: string;
  /** Optional model override (uses provider default if not set) */
  model?: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Max retry attempts for transient failures */
  maxRetries?: number;
  /** Organization ID (OpenAI only) */
  organizationId?: string;
  /** Base URL override (for proxies or local models) */
  baseUrl?: string;
}

/** Request for generating text from an AI model */
export interface GenerateTextRequest {
  /** System-level instructions for the AI */
  systemPrompt: string;
  /** User message / task description */
  userPrompt: string;
  /** Maximum tokens to generate in the response */
  maxTokens?: number;
  /** Sampling temperature (0 = deterministic, 1 = creative) */
  temperature?: number;
  /** Stop sequences to terminate generation */
  stopSequences?: string[];
}

/** Response from a text generation request */
export interface GenerateTextResponse {
  /** Generated text content */
  text: string;
  /** Model used for generation */
  model: string;
  /** Token usage information */
  usage?: TokenUsage;
  /** Finish reason from the provider */
  finishReason?: "stop" | "length" | "content_filter" | "unknown";
}

/** Token usage statistics */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Request for generating structured JSON output */
export interface GenerateStructuredRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  /** JSON Schema describing the expected output structure */
  schema: Record<string, unknown>;
  /** Example of the expected output for few-shot guidance */
  example?: T;
  maxTokens?: number;
  temperature?: number;
}

/** The core AI provider interface — all providers must implement this */
export interface AIProvider {
  /** Provider identifier */
  readonly name: ProviderName;
  /** Model being used */
  readonly model: string;

  /**
   * Generate free-form text.
   * All prompt injection protection should happen before calling this.
   */
  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;

  /**
   * Generate structured JSON output conforming to a schema.
   * Prefer this over generateText when you need parseable output.
   */
  generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<T>;

  /**
   * Check if the provider is properly configured and reachable.
   * Used for startup validation.
   */
  healthCheck(): Promise<boolean>;
}

/** Default model for each provider */
export const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
  gemini: "gemini-2.0-flash",
};

/** Default max output tokens */
export const DEFAULT_MAX_TOKENS = 4_096;

/** Default temperature for code review tasks (low = deterministic) */
export const DEFAULT_TEMPERATURE = 0.1;
