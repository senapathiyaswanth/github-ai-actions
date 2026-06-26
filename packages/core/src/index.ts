/**
 * @github-ai-actions/core
 *
 * AI provider abstraction layer for GitHub AI Actions.
 * Provides a unified interface for OpenAI, Anthropic, and Google Gemini.
 */

// Types — the contracts
export type {
  AIProvider,
  ProviderConfig,
  ProviderName,
  GenerateTextRequest,
  GenerateTextResponse,
  GenerateStructuredRequest,
  TokenUsage,
} from "./types.js";

export {
  DEFAULT_MODELS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
} from "./types.js";

// Factory
export { createProvider, createProviderFromInputs } from "./factory.js";

// Providers (for testing/extension)
export { OpenAIProvider } from "./providers/openai.js";
export { AnthropicProvider } from "./providers/anthropic.js";
export { GeminiProvider } from "./providers/gemini.js";
export { BaseProvider } from "./providers/base.js";
