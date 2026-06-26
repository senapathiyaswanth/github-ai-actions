# API Reference

Complete input/output reference for all GitHub AI Actions.

## Common Inputs

All actions share these common inputs:

| Input | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `ai-provider` | string | No | `openai` | AI provider: `openai` \| `anthropic` \| `gemini` |
| `ai-model` | string | No | provider default | Model override |
| `openai-api-key` | string | Conditional | — | Required when `ai-provider` is `openai` |
| `anthropic-api-key` | string | Conditional | — | Required when `ai-provider` is `anthropic` |
| `gemini-api-key` | string | Conditional | — | Required when `ai-provider` is `gemini` |

## Default Models

| Provider | Default Model | Context Window |
| -------- | ------------- | -------------- |
| OpenAI | `gpt-4o` | 128,000 tokens |
| Anthropic | `claude-3-5-sonnet-20241022` | 200,000 tokens |
| Google Gemini | `gemini-2.0-flash` | 1,000,000 tokens |

---

## `ai-pr-review`

### Inputs

| Input | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `github-token` | string | **Yes** | — | GitHub token with `pull-requests: write` |
| `review-level` | string | No | `detailed` | `quick` \| `detailed` \| `thorough` |
| `max-files` | number | No | `50` | Maximum files to analyze (1–300) |
| `exclude-patterns` | string | No | `""` | Comma-separated glob patterns to exclude |
| `post-as-comment` | boolean | No | `true` | Post review as PR comment |
| `fail-on-score` | number | No | `0` | Fail action if score below threshold (0 = never fail) |
| `dry-run` | boolean | No | `false` | Analyze without posting to GitHub |

### Outputs

| Output | Type | Description |
| ------ | ---- | ----------- |
| `review-comment` | string | Full Markdown review |
| `quality-score` | number | Overall quality score (0–100) |
| `issues-found` | JSON | Array of detected issues |
| `comment-url` | string | URL of the posted comment |

### Review Levels

| Level | Description | Speed | Depth |
| ----- | ----------- | ----- | ----- |
| `quick` | Critical bugs and security only | Fast | Shallow |
| `detailed` | Full code review | Medium | Standard |
| `thorough` | OWASP, SOLID, edge cases, tests | Slow | Deep |

### Quality Score Breakdown

| Dimension | Description |
| --------- | ----------- |
| Correctness | Bugs, logic errors, edge cases |
| Security | OWASP vulnerabilities, input validation |
| Maintainability | Code organization, naming, complexity |
| Performance | Algorithmic efficiency, resource usage |
| Style | Consistency, readability, documentation |

---

## `ai-commit-message`

### Inputs

| Input | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `diff` | string | **Yes** | — | Staged diff (output of `git diff --staged`) |
| `commit-types` | string | No | all types | Allowed Conventional Commit types |
| `scope` | string | No | `""` | Force a specific scope |
| `max-length` | number | No | `72` | Max subject line length |
| `include-body` | boolean | No | `true` | Include detailed body |
| `context` | string | No | `""` | Additional context for the AI |

### Outputs

| Output | Type | Description |
| ------ | ---- | ----------- |
| `commit-message` | string | Full Conventional Commit message |
| `commit-type` | string | Detected type (feat, fix, etc.) |
| `commit-scope` | string | Detected scope |
| `breaking-change` | boolean | Whether a breaking change was detected |
| `subject-line` | string | Subject line only |

### Supported Types

`feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`

---

## `ai-release-notes`

### Inputs

| Input | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `github-token` | string | **Yes** | — | GitHub token |
| `from-tag` | string | **Yes** | — | Previous release tag (e.g. `v1.0.0`) |
| `to-tag` | string | No | `HEAD` | Target ref |
| `include-prs` | boolean | No | `true` | Include PR references |
| `group-by-type` | boolean | No | `true` | Group by commit type |
| `output-file` | string | No | `""` | Write to this file path |
| `create-github-release` | boolean | No | `false` | Create a GitHub Release |
| `release-tag` | string | Conditional | — | Tag for GitHub Release |
| `tone` | string | No | `user-friendly` | `technical` \| `user-friendly` \| `changelog` |

### Outputs

| Output | Type | Description |
| ------ | ---- | ----------- |
| `release-notes` | string | Formatted Markdown release notes |
| `breaking-changes` | JSON | Array of breaking changes |
| `version-bump` | string | Suggested bump: `major` \| `minor` \| `patch` |
| `release-url` | string | GitHub Release URL (if created) |

---

## `ai-readme-generator`

### Inputs

| Input | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `github-token` | string | **Yes** | — | GitHub token with `contents: write` and `pull-requests: write` |
| `output-path` | string | No | `README.md` | Where to write the README |
| `sections` | string | No | all | Comma-separated sections to include |
| `create-pr` | boolean | No | `true` | Create PR with the generated README |
| `pr-branch` | string | No | `ai/update-readme` | Branch name for PR |
| `pr-title` | string | No | auto | PR title |
| `template` | string | No | `""` | Custom template file path |
| `additional-context` | string | No | `""` | Extra context for AI |
| `include-badges` | boolean | No | `true` | Include shields.io badges |

### Available Sections

`overview` · `installation` · `usage` · `configuration` · `api` · `contributing` · `license` · `faq` · `changelog`

### Outputs

| Output | Type | Description |
| ------ | ---- | ----------- |
| `readme-content` | string | Generated Markdown content |
| `pr-url` | string | Created PR URL |
| `pr-number` | number | Created PR number |

---

## Required Permissions

| Action | `contents` | `pull-requests` | `issues` |
| ------ | ---------- | --------------- | -------- |
| `ai-pr-review` | `read` | `write` | — |
| `ai-commit-message` | `read` | — | — |
| `ai-release-notes` | `read` | — | — |
| `ai-readme-generator` | `write` | `write` | — |
