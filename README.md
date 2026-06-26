# GitHub AI Actions

**An open-source collection of AI-powered GitHub Actions that automate software
engineering tasks.**

[![CI](https://github.com/github-ai-actions/github-ai-actions/actions/workflows/ci.yml/badge.svg)](https://github.com/github-ai-actions/github-ai-actions/actions/workflows/ci.yml)
[![CodeQL](https://github.com/github-ai-actions/github-ai-actions/actions/workflows/codeql.yml/badge.svg)](https://github.com/github-ai-actions/github-ai-actions/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## ✨ Available Actions

| Action | Description | Version |
| ------ | ----------- | ------- |
| [ai-pr-review](actions/pr-review/) | AI-powered pull request review with quality scoring | v1.0.0 |
| [ai-commit-message](actions/commit-message/) | Generate Conventional Commit messages from staged changes | v1.0.0 |
| [ai-release-notes](actions/release-notes/) | Generate release notes from commit history | v1.0.0 |
| [ai-readme-generator](actions/readme-generator/) | Generate/update project README files | v1.0.0 |

## 🚀 Quick Start

### AI PR Review

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: AI PR Review
        uses: github-ai-actions/github-ai-actions/actions/pr-review@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ai-provider: openai
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          review-level: detailed
```

### AI Release Notes

```yaml
# .github/workflows/release-notes.yml
name: Generate Release Notes

on:
  workflow_dispatch:
    inputs:
      from-tag:
        description: "Previous release tag"
        required: true

jobs:
  release-notes:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Release Notes
        uses: github-ai-actions/github-ai-actions/actions/release-notes@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          ai-provider: anthropic
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          from-tag: ${{ github.event.inputs.from-tag }}
```

## 🤖 Supported AI Providers

| Provider | Models | Input Key |
| -------- | ------ | --------- |
| **OpenAI** | GPT-4o, GPT-4o-mini | `openai-api-key` |
| **Anthropic** | Claude 3.5 Sonnet, Haiku | `anthropic-api-key` |
| **Google Gemini** | Gemini 2.0 Flash, 1.5 Pro | `gemini-api-key` |

> All actions support provider switching via the `ai-provider` input.
> No code changes needed to switch providers.

## 📦 Repository Structure

```
github-ai-actions/
├── actions/             # Publishable GitHub Actions
│   ├── pr-review/       # AI PR Review
│   ├── commit-message/  # AI Commit Message Generator
│   ├── release-notes/   # AI Release Notes Generator
│   └── readme-generator/# AI README Generator
├── packages/
│   ├── core/            # AI provider abstraction layer
│   ├── github/          # GitHub API utilities
│   ├── utils/           # Shared utilities
│   └── tsconfig/        # Shared TypeScript configs
├── docs/                # Documentation
├── examples/            # Example workflow files
└── scripts/             # Development scripts
```

## 🛠️ Local Development

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Setup

```bash
# Clone the repository
git clone https://github.com/github-ai-actions/github-ai-actions.git
cd github-ai-actions

# One-command setup
node scripts/setup.js

# Or manually:
pnpm install
pnpm build
pnpm test
```

### Available Commands

| Command | Description |
| ------- | ----------- |
| `pnpm build` | Build all packages and actions |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all TypeScript files |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm format` | Format all files with Prettier |
| `pnpm audit` | Security audit |
| `pnpm changeset` | Create a changeset for release |

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md)
and [Code of Conduct](CODE_OF_CONDUCT.md).

**Good first issues** are labeled
[`good first issue`](https://github.com/github-ai-actions/github-ai-actions/labels/good%20first%20issue).

## 🔒 Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md) and use
GitHub's private security advisory reporting — do not open public issues for
security bugs.

## 📄 License

MIT © [GitHub AI Actions Contributors](LICENSE)

---

<p align="center">
  Made with ❤️ by the open-source community
</p>
