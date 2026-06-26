import { AIAPIError } from "@github-ai-actions/utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { OpenAIProvider } from "../../src/providers/openai.js";

vi.mock("@actions/core", () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
}));

// Mock the openai SDK
vi.mock("openai", () => {
  const mockCreate = vi.fn();
  const OpenAI = vi.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
  // Attach APIError class
  (OpenAI as any).APIError = class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  };
  return { default: OpenAI, __mockCreate: mockCreate };
});

describe("OpenAIProvider", () => {
  const baseConfig = { provider: "openai" as const, apiKey: "sk-test-key" };
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import("openai");
    mockCreate = (module as any).__mockCreate;
  });

  it("initializes with default model", () => {
    const provider = new OpenAIProvider(baseConfig);
    expect(provider.model).toBe("gpt-4o");
    expect(provider.name).toBe("openai");
  });

  it("initializes with custom model", () => {
    const provider = new OpenAIProvider({ ...baseConfig, model: "gpt-4o-mini" });
    expect(provider.model).toBe("gpt-4o-mini");
  });

  describe("generateText", () => {
    it("returns text from successful API call", async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: { content: "Generated text" },
            finish_reason: "stop",
          },
        ],
        model: "gpt-4o",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const provider = new OpenAIProvider(baseConfig);
      const result = await provider.generateText({
        systemPrompt: "You are a code reviewer",
        userPrompt: "Review this code",
      });

      expect(result.text).toBe("Generated text");
      expect(result.model).toBe("gpt-4o");
      expect(result.usage?.totalTokens).toBe(15);
      expect(result.finishReason).toBe("stop");
    });

    it("throws AIAPIError on API failure", async () => {
      const { default: OpenAI } = await import("openai");
      mockCreate.mockRejectedValue(new (OpenAI as any).APIError("Bad Request", 400));

      const provider = new OpenAIProvider(baseConfig);
      await expect(
        provider.generateText({
          systemPrompt: "test",
          userPrompt: "test",
        }),
      ).rejects.toThrow("Operation failed");
    });

    it("throws when response has no choices", async () => {
      mockCreate.mockResolvedValue({ choices: [], model: "gpt-4o" });

      const provider = new OpenAIProvider(baseConfig);
      await expect(
        provider.generateText({ systemPrompt: "test", userPrompt: "test" }),
      ).rejects.toThrow("No completion choices");
    });
  });

  describe("generateStructured", () => {
    it("parses JSON response", async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: { content: '{"score": 85, "issues": []}' },
            finish_reason: "stop",
          },
        ],
        model: "gpt-4o",
      });

      const provider = new OpenAIProvider(baseConfig);
      const result = await provider.generateStructured<{ score: number; issues: string[] }>({
        systemPrompt: "Review code",
        userPrompt: "Analyze this",
        schema: { score: "number", issues: "string[]" },
      });

      expect(result.score).toBe(85);
      expect(result.issues).toEqual([]);
    });

    it("extracts JSON from markdown code blocks", async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: { content: '```json\n{"score": 90}\n```' },
            finish_reason: "stop",
          },
        ],
        model: "gpt-4o",
      });

      const provider = new OpenAIProvider(baseConfig);
      const result = await provider.generateStructured<{ score: number }>({
        systemPrompt: "Review",
        userPrompt: "Go",
        schema: {},
      });

      expect(result.score).toBe(90);
    });
  });
});
