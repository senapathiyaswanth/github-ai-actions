import { AIAPIError } from "@github-ai-actions/utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { AnthropicProvider } from "../../src/providers/anthropic.js";

vi.mock("@actions/core", () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  const Anthropic = vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
  (Anthropic as any).APIError = class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  };
  return { default: Anthropic, __mockCreate: mockCreate };
});

describe("AnthropicProvider", () => {
  const baseConfig = { provider: "anthropic" as const, apiKey: "sk-ant-test" };
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import("@anthropic-ai/sdk");
    mockCreate = (module as any).__mockCreate;
  });

  it("initializes with Claude 3.5 Sonnet as default", () => {
    const provider = new AnthropicProvider(baseConfig);
    expect(provider.model).toBe("claude-3-5-sonnet-20241022");
    expect(provider.name).toBe("anthropic");
  });

  describe("generateText", () => {
    it("returns text from successful response", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Code review complete" }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "end_turn",
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const provider = new AnthropicProvider(baseConfig);
      const result = await provider.generateText({
        systemPrompt: "You are a code reviewer",
        userPrompt: "Review this diff",
      });

      expect(result.text).toBe("Code review complete");
      expect(result.finishReason).toBe("stop"); // end_turn -> stop
      expect(result.usage?.promptTokens).toBe(100);
      expect(result.usage?.completionTokens).toBe(50);
      expect(result.usage?.totalTokens).toBe(150);
    });

    it("normalizes max_tokens stop reason to length", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Truncated..." }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "max_tokens",
        usage: { input_tokens: 100, output_tokens: 4096 },
      });

      const provider = new AnthropicProvider(baseConfig);
      const result = await provider.generateText({
        systemPrompt: "test",
        userPrompt: "test",
      });

      expect(result.finishReason).toBe("length");
    });

    it("throws AIAPIError on API failure", async () => {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      mockCreate.mockRejectedValue(new (Anthropic as any).APIError("Unauthorized", 401));

      const provider = new AnthropicProvider(baseConfig);
      await expect(
        provider.generateText({ systemPrompt: "test", userPrompt: "test" }),
      ).rejects.toThrow(AIAPIError);
    });

    it("throws when response has no text block", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "tool_use", id: "abc", name: "tool", input: {} }],
        model: "claude-3-5-sonnet-20241022",
        stop_reason: "tool_use",
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const provider = new AnthropicProvider(baseConfig);
      await expect(
        provider.generateText({ systemPrompt: "test", userPrompt: "test" }),
      ).rejects.toThrow("No text block");
    });
  });
});
