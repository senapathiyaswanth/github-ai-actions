# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-06-26

### 🎉 Initial Release

First production-ready release of GitHub AI Actions.

### Added

**Actions:**
- `ai-pr-review` — AI-powered pull request reviewer with quality scoring (0–100),
  severity-grouped findings, and automatic GitHub comment posting
- `ai-commit-message` — Conventional Commit message generator from staged diffs
- `ai-release-notes` — Release notes generator from commit history with semver
  bump detection
- `ai-readme-generator` — Full README generator with optional PR creation

**AI Provider Support:**
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic Claude (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- Google Gemini (Gemini 2.0 Flash, Gemini 1.5 Pro)

**Shared Packages:**
- `@github-ai-actions/core` — Provider abstraction layer with retry, timeout,
  structured JSON generation
- `@github-ai-actions/github` — Typed Octokit wrappers for PR diffs, commits,
  comments, and repository operations
- `@github-ai-actions/utils` — Logger, validator, Markdown formatter, retry
  helper, token counter, typed error hierarchy

**Developer Experience:**
- Full TypeScript strict mode throughout
- Turborepo build orchestration with caching
- Vitest test suite with 90%+ coverage targets
- ESLint 9 flat config + Prettier
- Husky + Commitlint + lint-staged
- Changesets for release management
- VS Code settings, extensions, and debug configurations

**CI/CD:**
- CI pipeline (lint, typecheck, build, test on Node 20 + 22)
- Automated release workflow with Changesets
- CodeQL security scanning
- Dependency review on PRs
- Weekly security audit
- Dependabot with weekly updates

**Documentation:**
- README with quick start examples
- ARCHITECTURE.md with data flow diagrams
- CONTRIBUTING.md with full contributor guide
- SECURITY.md with vulnerability reporting
- API.md with complete input/output reference
- ROADMAP.md with v1.x and v2.0 plans
- FAQ.md
- Per-action README files
- Example workflow files for all 4 actions

[1.0.0]: https://github.com/github-ai-actions/github-ai-actions/releases/tag/v1.0.0
