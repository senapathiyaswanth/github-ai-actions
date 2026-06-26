import { ProviderConfigError } from "@github-ai-actions/utils";

import { AnthropicProvider } from "./providers/anthropic.js";
import { GeminiProvider } from "./providers/gemini.js";
import { OpenAIProvider } from "./providers/openai.js";
import type { AIProvider, ProviderConfig, ProviderName } from "./types.js";

/**
 * Factory function that creates and returns an AI provider instance.
 *
 * Design principle: All action code interacts with `AIProvider` interface only.
 * Adding a new provider requires zero changes here (just add a new class).
 *
 * @example
 * ```typescript
 * const provider = createProvider({
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   model: 'gpt-4o',
 * });
 * const response = await provider.generateText({ ... });
 * ```
 */
export function createProvider(config: ProviderConfig): AIProvider {
  validateProviderConfig(config);

  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "gemini":
      return new GeminiProvider(config);
    default: {
      // TypeScript exhaustive check — this should never happen at runtime
      // if ProviderName type is kept in sync
      const _exhaustiveCheck: never = config.provider;
      throw new ProviderConfigError(
        String(_exhaustiveCheck),
        `Unknown provider. Supported: openai, anthropic, gemini`,
      );
    }
  }
}

/**
 * Create a provider from GitHub Actions inputs.
 * Reads API keys from the environment based on the selected provider.
 */
export function createProviderFromInputs(
  provider: ProviderName,
  keys: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
  },
  model?: string,
): AIProvider {
  const apiKey = getApiKeyForProvider(provider, keys);

  return createProvider({
    provider,
    apiKey,
    model,
  });
}

/** Validate provider config before attempting to create the provider */
function validateProviderConfig(config: ProviderConfig): void {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new ProviderConfigError(config.provider, "API key is required but was not provided");
  }

  if (config.apiKey.includes(" ")) {
    throw new ProviderConfigError(
      config.provider,
      "API key appears malformed (contains spaces). Check your secret configuration.",
    );
  }

  if (config.timeoutMs !== undefined && config.timeoutMs < 1_000) {
    throw new ProviderConfigError(
      config.provider,
      `Timeout too low: ${config.timeoutMs}ms. Minimum is 1000ms.`,
    );
  }
}

/** Extract the relevant API key for a given provider */
function getApiKeyForProvider(
  provider: ProviderName,
  keys: { openaiApiKey?: string; anthropicApiKey?: string; geminiApiKey?: string },
): string {
  const keyMap: Record<ProviderName, string | undefined> = {
    openai: keys.openaiApiKey,
    anthropic: keys.anthropicApiKey,
    gemini: keys.geminiApiKey,
  };

  const key = keyMap[provider];
  if (!key) {
    throw new ProviderConfigError(
      provider,
      `API key for "${provider}" not provided. Set the corresponding secret in your workflow.`,
    );
  }
  return key;
}
