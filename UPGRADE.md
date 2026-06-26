# Upgrade Guide

Upgrading to `v1.0.0` ensures you receive the latest stable AI integrations, prompt defenses, and optimized API usage.

## Step 1: Update Workflow References

Search your `.github/workflows/` directory for any references to `github-ai-actions/github-ai-actions` and update the version tag to `v1`.

```yaml
# Before
uses: github-ai-actions/github-ai-actions/actions/pr-review@main

# After
uses: github-ai-actions/github-ai-actions/actions/pr-review@v1
```

Using `@v1` automatically pulls minor and patch updates for `v1.x.x` without breaking your workflow.

## Step 2: Verify Inputs

Check your action inputs to ensure you're using the standard dash-case formatting for keys:

- `openai-api-key`
- `anthropic-api-key`
- `gemini-api-key`

## Step 3: Test Workflows

Create a test pull request to verify the AI action correctly triggers and responds. If you encounter rate-limiting errors, verify you have billing set up correctly on your selected AI Provider platform.
