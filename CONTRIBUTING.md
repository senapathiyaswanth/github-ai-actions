# Contributing to GitHub AI Actions

First off, **thank you** for taking the time to contribute! 🎉

This guide covers everything you need to know to contribute effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting a PR](#submitting-a-pr)
- [Adding a New Action](#adding-a-new-action)
- [Adding a New AI Provider](#adding-a-new-ai-provider)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you agree to abide by its terms.

## Getting Started

### Prerequisites

- **Node.js** >= 20 ([download](https://nodejs.org))
- **pnpm** >= 9 (`npm install -g pnpm`)
- **Git** >= 2.40

### Fork & Clone

```bash
# 1. Fork the repo on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/github-ai-actions.git
cd github-ai-actions

# 3. Add upstream
git remote add upstream https://github.com/github-ai-actions/github-ai-actions.git

# 4. Run setup
node scripts/setup.js
```

The setup script:
- Installs all dependencies (`pnpm install`)
- Configures Husky pre-commit hooks
- Validates your environment
- Builds packages for the first time

### Environment Variables

Copy `.env.example` to `.env` and fill in at least one AI provider key:

```bash
cp .env.example .env
```

## Development Workflow

```bash
# Create a feature branch
git checkout -b feat/my-feature

# Make changes, then verify
pnpm typecheck    # No TypeScript errors
pnpm lint         # No ESLint warnings
pnpm test         # All tests pass
pnpm format       # Auto-format files

# Commit (Husky will enforce conventional commits)
git commit -m "feat(pr-review): add new severity level"

# Push and open PR
git push origin feat/my-feature
```

### Branch Naming

| Type | Pattern | Example |
| ---- | ------- | ------- |
| Feature | `feat/<description>` | `feat/gemini-provider` |
| Bug fix | `fix/<description>` | `fix/null-pr-body` |
| Hotfix | `hotfix/<description>` | `hotfix/token-overflow` |
| Docs | `docs/<description>` | `docs/api-reference` |
| Release | `release/<version>` | `release/v1.1.0` |

## Coding Standards

- **TypeScript strict mode** — no `any`, no `@ts-ignore`
- **ESLint** — run `pnpm lint:fix` before committing
- **Prettier** — auto-formats on commit via Husky
- **Conventional Commits** — enforced by Commitlint

### TypeScript Guidelines

```typescript
// ✅ Good — explicit types, no any
function parseScore(value: unknown): number {
  if (typeof value !== 'number') throw new Error('Expected number');
  return value;
}

// ❌ Bad — any, implicit return type
function parseScore(value: any) {
  return value;
}
```

### Error Handling

Always use typed errors from `packages/utils`:

```typescript
import { AIAPIError, normalizeError } from '@github-ai-actions/utils';

try {
  const result = await provider.generateText(request);
} catch (error) {
  const normalized = normalizeError(error);
  throw new AIAPIError(provider.name, normalized.message);
}
```

## Testing

### Running Tests

```bash
pnpm test              # All tests
pnpm test:coverage     # With coverage report
pnpm -F @github-ai-actions/core test  # Specific package
```

### Writing Tests

- Place tests in `tests/` directory alongside `src/`
- Name test files `*.test.ts`
- Mock external dependencies (`@actions/core`, AI SDKs, Octokit)
- Aim for 90%+ coverage

```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@actions/core', () => ({
  info: vi.fn(),
  error: vi.fn(),
}));

describe('MyFeature', () => {
  it('does something specific', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## Submitting a PR

1. **Ensure all checks pass**: `pnpm typecheck && pnpm lint && pnpm test`
2. **Add a changeset**: `pnpm changeset` (for versioned packages)
3. **Fill in the PR template** completely
4. **Link related issues** with `Closes #123`
5. **Request review** from maintainers

### PR Size Guidelines

- Keep PRs focused on a single concern
- Separate refactoring from feature changes
- Split large features into smaller PRs when possible

## Adding a New Action

1. Copy an existing action as a template:
   ```bash
   cp -r actions/commit-message actions/my-new-action
   ```

2. Update `action.yml` with inputs/outputs/description

3. Implement `src/main.ts` following the existing pattern:
   - Parse inputs with validation
   - Create AI provider
   - Fetch GitHub context
   - Generate with AI
   - Set outputs

4. Add to root `tsconfig.json` references

5. Write tests in `tests/`

6. Add to `README.md` action table

7. Create documentation in `docs/guides/`

## Adding a New AI Provider

1. Create `packages/core/src/providers/my-provider.ts`:
   ```typescript
   export class MyProvider extends BaseProvider {
     readonly name = 'my-provider' as const;
     // implement doGenerateText()
   }
   ```

2. Add to `ProviderName` type in `packages/core/src/types.ts`

3. Add to `DEFAULT_MODELS` map

4. Add case to `createProvider()` in `packages/core/src/factory.ts`

5. Export from `packages/core/src/providers/index.ts`

6. Add tests in `packages/core/tests/providers/my-provider.test.ts`

7. Update `README.md` and `API.md` provider tables

## Release Process

We use [Changesets](https://github.com/changesets/changesets) for releases.

```bash
# When your PR introduces a version-worthy change:
pnpm changeset

# Follow the prompts to:
# - Select affected packages
# - Choose semver bump (major/minor/patch)
# - Write a changelog entry
```

Maintainers run the release workflow on the `main` branch.

## Getting Help

- 💬 [GitHub Discussions](https://github.com/github-ai-actions/github-ai-actions/discussions) — Q&A, ideas
- 🐛 [Issues](https://github.com/github-ai-actions/github-ai-actions/issues) — Bugs
- 📖 [ARCHITECTURE.md](ARCHITECTURE.md) — Technical deep-dive

Thank you for contributing! 🚀
