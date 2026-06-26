import { ProviderConfigError } from "@github-ai-actions/utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createProvider, createProviderFromInputs } from "../src/factory.js";
import { AnthropicProvider } from "../src/providers/anthropic.js";
import { GeminiProvider } from "../src/providers/gemini.js";
import { OpenAIProvider } from "../src/providers/openai.js";

// Mock @actions/core since it's a dependency of @github-ai-actions/utils
vi.mock("@actions/core", () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  startGroup: vi.fn(),
  endGroup: vi.fn(),
}));

describe("createProvider", () => {
  it("creates an OpenAIProvider for 'openai'", () => {
    const provider = createProvider({ provider: "openai", apiKey: "sk-test-key" });
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.name).toBe("openai");
  });

  it("creates an AnthropicProvider for 'anthropic'", () => {
    const provider = createProvider({ provider: "anthropic", apiKey: "sk-ant-test" });
    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(provider.name).toBe("anthropic");
  });

  it("creates a GeminiProvider for 'gemini'", () => {
    const provider = createProvider({ provider: "gemini", apiKey: "gemini-test-key" });
    expect(provider).toBeInstanceOf(GeminiProvider);
    expect(provider.name).toBe("gemini");
  });

  it("uses custom model when provided", () => {
    const provider = createProvider({
      provider: "openai",
      apiKey: "sk-test",
      model: "gpt-4o-mini",
    });
    expect(provider.model).toBe("gpt-4o-mini");
  });

  it("uses default model when not provided", () => {
    const provider = createProvider({ provider: "openai", apiKey: "sk-test" });
    expect(provider.model).toBe("gpt-4o");
  });

  describe("validation", () => {
    it("throws ProviderConfigError for empty API key", () => {
      expect(() => createProvider({ provider: "openai", apiKey: "" })).toThrow(
        ProviderConfigError,
      );
    });

    it("throws ProviderConfigError for API key with spaces", () => {
      expect(() =>
        createProvider({ provider: "openai", apiKey: "sk has spaces" }),
      ).toThrow(ProviderConfigError);
    });

    it("throws ProviderConfigError for too-low timeout", () => {
      expect(() =>
        createProvider({ provider: "openai", apiKey: "sk-test", timeoutMs: 100 }),
      ).toThrow(ProviderConfigError);
    });
  });
});

describe("createProviderFromInputs", () => {
  it("creates provider with correct key for openai", () => {
    const provider = createProviderFromInputs("openai", {
      openaiApiKey: "sk-test",
    });
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it("creates provider with correct key for anthropic", () => {
    const provider = createProviderFromInputs("anthropic", {
      anthropicApiKey: "sk-ant-test",
    });
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it("creates provider with correct key for gemini", () => {
    const provider = createProviderFromInputs("gemini", {
      geminiApiKey: "gemini-key",
    });
    expect(provider).toBeInstanceOf(GeminiProvider);
  });

  it("throws when required key is missing", () => {
    expect(() =>
      createProviderFromInputs("openai", { anthropicApiKey: "sk-ant-test" }),
    ).toThrow(ProviderConfigError);
  });

  it("passes model override", () => {
    const provider = createProviderFromInputs(
      "openai",
      { openaiApiKey: "sk-test" },
      "gpt-4o-mini",
    );
    expect(provider.model).toBe("gpt-4o-mini");
  });
});
