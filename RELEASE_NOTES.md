# GitHub AI Actions v1.0.0

We are thrilled to announce the stable `v1.0.0` release of **GitHub AI Actions**! This open-source monorepo provides a comprehensive suite of AI-powered tools designed to automate and enhance your software engineering workflows on GitHub.

## 🚀 Features

- **AI PR Reviewer**: Automated, deeply-analytical code reviews right on your Pull Requests. Detects code smells, security issues, and provides actionable feedback.
- **AI Commit Message Generator**: Automatically generates Conventional Commits using your staged `git diff`.
- **AI README Generator**: Scans your codebase and instantly creates a highly-polished, accurate `README.md`.
- **AI Release Notes**: Generates professional, human-readable release notes directly from your closed PRs and commit history.
- **Multi-Provider Support**: First-class support for **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5 Sonnet)**, and **Google Gemini (1.5 Pro)**.

## 🏗️ Architecture

Built as a high-performance monorepo using **Turbo** and **pnpm**, our core architecture features:
- A unified `@github-ai-actions/core` package for robust LLM provider integrations with automatic retries and token budgeting.
- Strongly-typed inputs and outputs ensuring reliable Action execution.
- Strict security boundaries sanitizing inputs before prompting the AI models.

## 🛠️ Installation

Integrating our actions is as simple as defining your GitHub Token permissions and providing your API key:

```yaml
uses: github-ai-actions/github-ai-actions/actions/pr-review@v1
with:
  openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

Check out our [Installation Guide](INSTALLATION.md) and [Migration Guide](MIGRATION.md) for more details.

## 📚 Examples

Explore the `/examples` directory in our repository for ready-to-use workflows you can copy directly into your projects.

## ⚠️ Known Issues

- Extremely large monorepos may encounter AI context window limits during README generation. We recommend using the `exclude-patterns` input to ignore vendor/dist directories.

## 🔮 Future Roadmap

- Automated issue triaging and labeling based on AI semantic analysis.
- Multi-agent architecture for automated code remediation (AI PR creation for bug fixes).

*Thank you to all our contributors for making v1.0.0 possible!*
