import Anthropic from "@anthropic-ai/sdk";
import { AIAPIError } from "@github-ai-actions/utils";

import type { GenerateTextRequest, GenerateTextResponse, ProviderConfig } from "../types.js";
import { DEFAULT_MODELS } from "../types.js";

import { BaseProvider } from "./base.js";

/**
 * Anthropic provider implementation.
 * Supports Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus.
 */
export class AnthropicProvider extends BaseProvider {
  readonly name = "anthropic" as const;
  readonly model: string;

  private readonly client: Anthropic;

  constructor(config: ProviderConfig) {
    super(config);
    this.model = config.model ?? DEFAULT_MODELS.anthropic;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      maxRetries: 0, // Handled by BaseProvider
      timeout: this.timeoutMs,
    });
  }

  protected async doGenerateText(
    request: Required<Pick<GenerateTextRequest, "systemPrompt" | "userPrompt" | "maxTokens" | "temperature">> &
      Pick<GenerateTextRequest, "stopSequences">,
  ): Promise<GenerateTextResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userPrompt }],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stop_sequences: request.stopSequences,
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (textBlock?.type !== "text") {
        throw new AIAPIError(this.name, "No text block in Anthropic response");
      }

      return {
        text: textBlock.text,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: normalizeStopReason(response.stop_reason),
      };
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new AIAPIError(this.name, `${error.status ?? "?"}: ${error.message}`, error.status);
      }
      throw error;
    }
  }
}

function normalizeStopReason(
  reason: string | null | undefined,
): GenerateTextResponse["finishReason"] {
  switch (reason) {
    case "end_turn":
      return "stop";
    case "max_tokens":
      return "length";
    case "stop_sequence":
      return "stop";
    default:
      return "unknown";
  }
}
