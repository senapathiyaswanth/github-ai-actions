import { AIAPIError, withRetry, withTimeout, Logger } from "@github-ai-actions/utils";

import type {
  AIProvider,
  GenerateStructuredRequest,
  GenerateTextRequest,
  GenerateTextResponse,
  ProviderConfig,
  ProviderName,
} from "../types.js";
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from "../types.js";

/**
 * Abstract base class for all AI providers.
 * Implements common retry/timeout/error-handling logic so individual
 * providers only need to implement the raw API call.
 */
export abstract class BaseProvider implements AIProvider {
  abstract readonly name: ProviderName;
  abstract readonly model: string;

  protected readonly config: ProviderConfig;
  protected readonly logger: Logger;
  protected readonly timeoutMs: number;
  protected readonly maxRetries: number;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.timeoutMs = config.timeoutMs ?? 120_000; // 2 minutes default
    this.maxRetries = config.maxRetries ?? 3;
    this.logger = new Logger(`provider:${config.provider}`);
  }

  async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
    const temperature = request.temperature ?? DEFAULT_TEMPERATURE;

    this.logger.debug(`Generating text with ${this.model}`, {
      maxTokens,
      temperature,
      systemPromptLength: request.systemPrompt.length,
      userPromptLength: request.userPrompt.length,
    });

    return withRetry(
      () =>
        withTimeout(
          () => this.doGenerateText({ ...request, maxTokens, temperature }),
          this.timeoutMs,
        ),
      {
        maxAttempts: this.maxRetries,
        baseDelayMs: 1_000,
        maxDelayMs: 30_000,
        jitterFactor: 0.2,
        nonRetryableErrors: ["401", "403", "invalid_api_key", "authentication"],
      },
    );
  }

  async generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<T> {
    this.logger.debug(`Generating structured output with ${this.model}`);

    const schemaDescription = JSON.stringify(request.schema, null, 2);
    const exampleSection = request.example
      ? `\n\nExample output:\n${JSON.stringify(request.example, null, 2)}`
      : "";

    const enhancedSystemPrompt = [
      request.systemPrompt,
      `\n\nYou MUST respond with valid JSON that strictly matches this schema:`,
      `\`\`\`json`,
      schemaDescription,
      `\`\`\``,
      exampleSection,
      `\n\nRespond ONLY with the JSON object. No markdown fences, no explanation.`,
    ].join("\n");

    const response = await this.generateText({
      systemPrompt: enhancedSystemPrompt,
      userPrompt: request.userPrompt,
      maxTokens: request.maxTokens,
      temperature: request.temperature ?? 0.0, // Structured output: deterministic
    });

    return this.parseStructuredResponse<T>(response.text);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.generateText({
        systemPrompt: "You are a helpful assistant.",
        userPrompt: 'Reply with "OK" and nothing else.',
        maxTokens: 10,
        temperature: 0,
      });
      return true;
    } catch {
      return false;
    }
  }

  /** Parse JSON from AI response, with fallback extraction */
  protected parseStructuredResponse<T>(text: string): T {
    // Try direct parse first
    try {
      return JSON.parse(text) as T;
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = /```(?:json)?\s*([\s\S]*?)```/s.exec(text);
      if (jsonMatch?.[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim()) as T;
        } catch {
          // Fall through
        }
      }

      // Try to find bare JSON object/array
      const objectMatch = /(\{[\s\S]*\}|\[[\s\S]*\])/s.exec(text);
      if (objectMatch?.[1]) {
        try {
          return JSON.parse(objectMatch[1]) as T;
        } catch {
          // Fall through
        }
      }

      throw new AIAPIError(
        this.name,
        `Failed to parse structured response as JSON. Raw response:\n${text.slice(0, 500)}`,
      );
    }
  }

  /**
   * Provider-specific implementation of text generation.
   * Must be implemented by each concrete provider.
   */
  protected abstract doGenerateText(
    request: Required<Pick<GenerateTextRequest, "systemPrompt" | "userPrompt" | "maxTokens" | "temperature">> &
      Pick<GenerateTextRequest, "stopSequences">,
  ): Promise<GenerateTextResponse>;
}
