import { AIAPIError } from "@github-ai-actions/utils";
import { GoogleGenerativeAI } from "@google/generative-ai";

import type { GenerateTextRequest, GenerateTextResponse, ProviderConfig } from "../types.js";
import { DEFAULT_MODELS } from "../types.js";

import { BaseProvider } from "./base.js";

/**
 * Google Gemini provider implementation.
 * Supports Gemini 2.0 Flash, Gemini 1.5 Pro, and Gemini 1.5 Flash.
 */
export class GeminiProvider extends BaseProvider {
  readonly name = "gemini" as const;
  readonly model: string;

  private readonly client: GoogleGenerativeAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.model = config.model ?? DEFAULT_MODELS.gemini;
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  protected async doGenerateText(
    request: Required<Pick<GenerateTextRequest, "systemPrompt" | "userPrompt" | "maxTokens" | "temperature">> &
      Pick<GenerateTextRequest, "stopSequences">,
  ): Promise<GenerateTextResponse> {
    try {
      const genModel = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: request.systemPrompt,
      });

      const result = await genModel.generateContent({
        contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
        generationConfig: {
          maxOutputTokens: request.maxTokens,
          temperature: request.temperature,
          stopSequences: request.stopSequences,
        },
      });

      const response = result.response;
      const text = response.text();
      if (!text) {
        throw new AIAPIError(this.name, "Empty text response from Gemini API");
      }

      return {
        text,
        model: this.model,
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount ?? 0,
              completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: response.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
        finishReason: normalizeFinishReason(
          response.candidates?.[0]?.finishReason ?? null,
        ),
      };
    } catch (error) {
      if (error instanceof AIAPIError) throw error;
      // Gemini SDK throws generic errors — wrap them
      const msg = error instanceof Error ? error.message : String(error);
      const statusMatch = /(\d{3})/.exec(msg);
      const status = statusMatch?.[1] ? parseInt(statusMatch[1], 10) : undefined;
      throw new AIAPIError(this.name, msg, status);
    }
  }
}

function normalizeFinishReason(
  reason: string | null | undefined,
): GenerateTextResponse["finishReason"] {
  if (!reason) return "unknown";
  const r = reason.toUpperCase();
  if (r === "STOP" || r === "FINISH_REASON_STOP") return "stop";
  if (r === "MAX_TOKENS" || r === "FINISH_REASON_MAX_TOKENS") return "length";
  if (r.includes("SAFETY") || r.includes("RECITATION")) return "content_filter";
  return "unknown";
}
