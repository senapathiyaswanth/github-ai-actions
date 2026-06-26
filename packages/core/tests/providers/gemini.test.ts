import { describe, it, expect, vi, beforeEach } from "vitest";

import { GeminiProvider } from "../../src/providers/gemini.js";

vi.mock("@actions/core", () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
}));

const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => {
  const GoogleGenerativeAI = vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  }));
  return { GoogleGenerativeAI };
});

describe("GeminiProvider", () => {
  const baseConfig = { provider: "gemini" as const, apiKey: "gemini-test-key" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with Gemini 2.0 Flash as default", () => {
    const provider = new GeminiProvider(baseConfig);
    expect(provider.model).toBe("gemini-2.0-flash");
    expect(provider.name).toBe("gemini");
  });

  describe("generateText", () => {
    it("returns text from successful response", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Gemini analysis complete",
          candidates: [{ finishReason: "STOP" }],
          usageMetadata: {
            promptTokenCount: 200,
            candidatesTokenCount: 100,
            totalTokenCount: 300,
          },
        },
      });

      const provider = new GeminiProvider(baseConfig);
      const result = await provider.generateText({
        systemPrompt: "You are a code reviewer",
        userPrompt: "Review this code",
      });

      expect(result.text).toBe("Gemini analysis complete");
      expect(result.finishReason).toBe("stop");
      expect(result.usage?.totalTokens).toBe(300);
    });

    it("throws when response text is empty", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "",
          candidates: [],
          usageMetadata: {},
        },
      });

      const provider = new GeminiProvider(baseConfig);
      await expect(
        provider.generateText({ systemPrompt: "test", userPrompt: "test" }),
      ).rejects.toThrow("Empty text response");
    });

    it("normalizes SAFETY finish reason to content_filter", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Partial output",
          candidates: [{ finishReason: "SAFETY" }],
          usageMetadata: {},
        },
      });

      const provider = new GeminiProvider(baseConfig);
      const result = await provider.generateText({
        systemPrompt: "test",
        userPrompt: "test",
      });
      expect(result.finishReason).toBe("content_filter");
    });
  });
});
