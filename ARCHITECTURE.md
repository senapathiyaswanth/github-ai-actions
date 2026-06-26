# Architecture

This document describes the technical architecture of GitHub AI Actions.

## Overview

GitHub AI Actions is a **TypeScript monorepo** using **Turborepo** and **pnpm workspaces**.
It follows a layered architecture where shared functionality is extracted into
packages that all actions consume.

## Monorepo Structure

```
github-ai-actions/
│
├── packages/               # Shared libraries (internal, not published separately)
│   ├── tsconfig/           # Shared TypeScript base configurations
│   ├── utils/              # Logger, validator, formatter, retry, error types
│   ├── core/               # AI provider abstraction layer
│   └── github/             # Octokit wrappers for GitHub API operations
│
├── actions/                # Individual GitHub Actions (the deployable products)
│   ├── pr-review/
│   ├── commit-message/
│   ├── release-notes/
│   └── readme-generator/
│
├── docs/                   # Documentation
├── examples/               # Example workflow YAML files
└── scripts/                # Development utilities
```

## Dependency Graph

```
actions/*
    │
    ├──► packages/core     ──► openai, @anthropic-ai/sdk, @google/genai
    │
    ├──► packages/github   ──► @octokit/rest, @actions/github
    │
    └──► packages/utils    ──► @actions/core
```

Each action depends on the shared packages but **never on other actions**.
This ensures actions remain independently deployable.

## AI Provider Abstraction Layer

The most important architectural decision is the `packages/core` provider abstraction.

### Why this matters

All 4 actions need to call AI APIs. Without abstraction, each action would
contain provider-specific code, making it impossible to:

- Switch providers without modifying action code
- Add new providers without touching existing actions
- Mock AI calls cleanly in tests

### The Interface

```typescript
interface AIProvider {
  readonly name: ProviderName;     // 'openai' | 'anthropic' | 'gemini'
  readonly model: string;          // Active model name

  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;
  generateStructured<T>(request: GenerateStructuredRequest<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
}
```

### Adding a New Provider

1. Create `packages/core/src/providers/my-provider.ts` extending `BaseProvider`
2. Implement `doGenerateText()` using the provider's SDK
3. Add the case to `packages/core/src/factory.ts`
4. Export from `packages/core/src/providers/index.ts`

No changes to any action files are required.

### BaseProvider

`BaseProvider` is an abstract class that handles:

- Retry logic with exponential backoff and jitter
- Request timeouts
- Structured JSON parsing with fallback extraction
- Health checks
- Debug logging

Individual providers only implement `doGenerateText()`.

## Action Architecture

Each action follows a consistent structure:

```
action/
├── action.yml          # GitHub Actions metadata (inputs, outputs, entry point)
├── src/
│   ├── main.ts         # Entry point: parse inputs → validate → orchestrate → set outputs
│   ├── types.ts        # Action-specific TypeScript types
│   ├── prompts.ts      # AI prompt templates (system + user prompts)
│   ├── analyzer.ts     # Core AI orchestration logic
│   └── output.ts       # Format and post results to GitHub
└── dist/               # Bundled output (single file via @vercel/ncc)
```

### Why `@vercel/ncc`?

GitHub Actions need to run without `npm install`. The `ncc` tool bundles
TypeScript + all dependencies into a single `dist/index.js` file.
This is committed to the repo so users don't need Node or pnpm to run actions.

## Data Flow: PR Review Example

```
PR Opened
    │
    ▼
main.ts → parseInputs() → validate inputs
    │
    ▼
PRAnalyzer.analyze()
    │
    ├── getPRDiff(octokit) ──► GitHub API
    │
    ├── filterFiles(diff, excludePatterns)
    │
    ├── truncateToTokenBudget(rawDiff)
    │
    ├── sanitizeForPrompt(diff)          ← prompt injection protection
    │
    └── provider.generateStructured()   ──► AI API
             │
             ▼
         ReviewAnalysis { findings[], scoreCard, summary }
    │
    ▼
ReviewOutputter.postReview()
    │
    ├── formatScoreCard()
    ├── formatFindings()
    └── postOrUpdatePRComment() ──► GitHub API
    │
    ▼
core.setOutput() ──► GitHub Actions outputs
```

## Security Architecture

### API Key Handling

- Keys are read from GitHub Actions secrets via `core.getInput()`
- Never logged, never committed
- Validated for presence before API calls
- Passed to providers in memory only

### Prompt Injection Defense

`sanitizeForPrompt()` in `packages/utils` removes known injection patterns
(`[INST]`, `[/INST]`, `<|im_start|>`) before text reaches AI providers.
All user-controlled content (PR title, body, diff) is sanitized.

### Token Budget

All diff/content sent to AI is truncated at the source to prevent:
- Accidental over-billing
- Context window overflow errors
- DoS via extremely large PRs

## Testing Strategy

| Layer | Approach |
| ----- | -------- |
| `packages/utils` | Pure unit tests, no mocking |
| `packages/core` | SDK fully mocked with `vi.mock()` |
| `packages/github` | Octokit mocked, logic tested in isolation |
| `actions/*` | Prompt logic tested; `main.ts` integration via mocked dependencies |

Coverage target: **90%+ lines** on all packages.

## Build Pipeline

```
pnpm build
    │
    └── turbo run build
           │
           ├── packages/tsconfig    (no-op, just JSON files)
           ├── packages/utils       tsc → dist/
           ├── packages/core        tsc → dist/ (depends on utils)
           ├── packages/github      tsc → dist/ (depends on utils)
           └── actions/*            tsc → intermediate
                                    ncc → dist/index.js (bundled)
```

Turborepo caches build artifacts, only rebuilding what changed.
