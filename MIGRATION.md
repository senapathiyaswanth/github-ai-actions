# Migration Guide

This guide covers the necessary steps to migrate your workflows to `v1.0.0` of GitHub AI Actions.

## Migrating from `v0.x` or Beta

If you were using beta versions or unpinned SHAs, `v1.0.0` introduces stable parameter names and strict token management.

### Action Renames

No core actions have been renamed, but verify you are using the correct paths:
- `uses: github-ai-actions/github-ai-actions/actions/pr-review@v1.0.0`
- `uses: github-ai-actions/github-ai-actions/actions/commit-message@v1.0.0`
- `uses: github-ai-actions/github-ai-actions/actions/readme-generator@v1.0.0`
- `uses: github-ai-actions/github-ai-actions/actions/release-notes@v1.0.0`

### Input Parameter Changes

- `openai_key` has been standardized to `openai-api-key` in all actions for consistency.
- `anthropic_key` has been standardized to `anthropic-api-key`.
- `gemini_key` has been standardized to `gemini-api-key`.

Update your workflow files:

```diff
- uses: github-ai-actions/github-ai-actions/actions/pr-review@v0.9.0
  with:
-   openai_key: ${{ secrets.OPENAI_API_KEY }}
+ uses: github-ai-actions/github-ai-actions/actions/pr-review@v1.0.0
+   openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Output Changes

Outputs are now more strictly typed. The `pr-review` action now emits `review-status` which is either `approved`, `changes_requested`, or `commented`.

## Required Permissions

To use `v1.0.0` effectively, explicitly define your GitHub Token permissions to adhere to the principle of least privilege:

```yaml
permissions:
  contents: read
  pull-requests: write
```
