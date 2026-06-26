# Style Guide

This document defines the coding standards for GitHub AI Actions.

## TypeScript

### Strict Mode

All code runs with TypeScript strict mode enabled. No exceptions.

```typescript
// ✅ Explicit types
function getScore(value: unknown): number {
  if (typeof value !== "number") throw new TypeError(`Expected number, got ${typeof value}`);
  return value;
}

// ❌ Implicit any
function getScore(value) {
  return value;
}
```

### Type Imports

Use `import type` for type-only imports:

```typescript
// ✅
import type { AIProvider } from "@github-ai-actions/core";
import { createProvider } from "@github-ai-actions/core";

// ❌
import { AIProvider, createProvider } from "@github-ai-actions/core";
```

### Error Handling

Never swallow errors. Use typed errors:

```typescript
// ✅
import { AIAPIError, normalizeError } from "@github-ai-actions/utils";

try {
  return await provider.generateText(request);
} catch (error) {
  const normalized = normalizeError(error);
  throw new AIAPIError(provider.name, normalized.message);
}

// ❌
try {
  return await provider.generateText(request);
} catch {
  return null; // Silent failure — never do this
}
```

### Async/Await

Always handle floating promises:

```typescript
// ✅ In main entry points
void run();

// ✅ In async functions
await someAsyncOperation();

// ❌
someAsyncOperation(); // Missing await — floating promise
```

## Naming Conventions

| Entity | Convention | Example |
| ------ | ---------- | ------- |
| Classes | PascalCase | `PRAnalyzer` |
| Interfaces | PascalCase | `ReviewAnalysis` |
| Type aliases | PascalCase | `ProviderName` |
| Functions | camelCase | `buildSystemPrompt` |
| Constants | SCREAMING_SNAKE or camelCase | `DEFAULT_MAX_TOKENS` |
| Files | kebab-case | `pull-request.ts` |
| Directories | kebab-case | `pr-review/` |

## Comments

### When to comment

- Complex business logic that isn't obvious from the code
- Security-sensitive decisions
- Performance trade-offs
- API quirks and workarounds

### When NOT to comment

- Obvious code (`// increment counter` before `i++`)
- Restating what the type signature already says

### JSDoc

Public API functions should have JSDoc:

```typescript
/**
 * Fetch the diff for a pull request, with file filtering and pagination.
 *
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @param maxFiles - Maximum number of files to return (default: 50)
 * @returns Structured PR diff with metadata
 * @throws {GitHubAPIError} If the API request fails
 */
export async function getPRDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  maxFiles = 50,
): Promise<PRDiff> {
```

## Testing

### Test file naming

`src/my-module.ts` → `tests/my-module.test.ts`

### Test structure

```typescript
describe("ClassName or ModuleName", () => {
  describe("methodName", () => {
    it("does the expected thing when given valid input", () => { ... });
    it("throws an error when input is invalid", () => { ... });
    it("handles edge case: empty array", () => { ... });
  });
});
```

### Assertions

Be specific — prefer `toEqual` over `toBeTruthy`, `toContain` over `toBeDefined`:

```typescript
// ✅ Specific
expect(result.score).toBe(85);
expect(result.findings).toHaveLength(3);
expect(result.summary).toContain("security");

// ❌ Too vague
expect(result).toBeTruthy();
expect(result.findings).toBeDefined();
```

## Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat(pr-review): add configurable review personas

Allows users to specify a review focus (security, performance, style)
via the new `review-focus` input.

Closes #42
```

- **Subject**: imperative mood, ≤72 chars, no period
- **Body**: explain WHY, not HOW
- **Footer**: reference issues, note breaking changes

## File Organization

Each package/action follows this structure:

```
src/
├── types.ts      # TypeScript types (first)
├── index.ts      # Public exports (barrel)
└── *.ts          # Implementation files

tests/
└── *.test.ts     # Mirror src/ structure
```
