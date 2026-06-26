# Installation Guide

Adding GitHub AI Actions to your repository is straightforward. This guide will help you install and configure the actions in your workflows.

## Prerequisites

1. An active GitHub Repository.
2. An API Key from your preferred AI Provider (OpenAI, Anthropic, or Google Gemini).
3. The API Key stored securely in your repository's **Secrets**.

## Storing Your API Key

1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Name the secret appropriately (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
5. Paste your API key as the value and click **Add secret**.

## Installing an Action

Create a YAML file in your repository's `.github/workflows/` directory.

### Example: AI PR Reviewer

Create `.github/workflows/ai-pr-review.yml`:

```yaml
name: AI PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: AI PR Review
        uses: github-ai-actions/github-ai-actions/actions/pr-review@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

## Available Actions

- **PR Review**: `github-ai-actions/github-ai-actions/actions/pr-review@v1`
- **Commit Message Generation**: `github-ai-actions/github-ai-actions/actions/commit-message@v1`
- **Release Notes Generator**: `github-ai-actions/github-ai-actions/actions/release-notes@v1`
- **README Generator**: `github-ai-actions/github-ai-actions/actions/readme-generator@v1`

For specific input configurations, refer to the [API.md](API.md) documentation.
