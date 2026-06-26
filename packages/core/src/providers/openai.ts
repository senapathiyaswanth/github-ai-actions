import { AIAPIError } from "@github-ai-actions/utils";
import OpenAI from "openai";

import type { GenerateTextRequest, GenerateTextResponse, ProviderConfig } from "../types.js";
import { DEFAULT_MODELS } from "../types.js";

import { BaseProvider } from "./base.js";

/**
 * OpenAI provider implementation.
 * Supports GPT-4o, GPT-4o-mini, and any OpenAI-compatible model.
 */
export class OpenAIProvider extends BaseProvider {
  readonly name = "openai" as const;
  readonly model: string;

  private readonly client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.model = config.model ?? DEFAULT_MODELS.openai;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.baseUrl,
      maxRetries: 0, // We handle retries ourselves in BaseProvider
      timeout: this.timeoutMs,
    });
  }

  protected async doGenerateText(
    request: Required<Pick<GenerateTextRequest, "systemPrompt" | "userPrompt" | "maxTokens" | "temperature">> &
      Pick<GenerateTextRequest, "stopSequences">,
  ): Promise<GenerateTextResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stop: request.stopSequences,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new AIAPIError(this.name, "No completion choices returned");
      }

      const content = choice.message.content;
      if (!content) {
        throw new AIAPIError(this.name, "Empty content in completion response");
      }

      return {
        text: content,
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        finishReason: normalizeFinishReason(choice.finish_reason),
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AIAPIError(
          this.name,
          `${error.status ?? "?"}: ${error.message}`,
          error.status,
        );
      }
      throw error;
    }
  }
}

function normalizeFinishReason(
  reason: string | null | undefined,
): GenerateTextResponse["finishReason"] {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "content_filter":
      return "content_filter";
    default:
      return "unknown";
  }
}
