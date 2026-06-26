# FAQ — Frequently Asked Questions

## General

### What AI providers are supported?

OpenAI (GPT-4o, GPT-4o-mini), Anthropic (Claude 3.5 Sonnet, Haiku), and Google
Gemini (2.0 Flash, 1.5 Pro). You can switch providers by changing `ai-provider`
in your workflow — no code changes needed.

### Do I need to pay for AI API access?

Yes, you need an API key from at least one provider. Each action call consumes
tokens from your provider's API. Typical costs:

- **PR Review**: ~$0.01–0.10 per review (depends on diff size and model)
- **Commit Message**: ~$0.001–0.005 per generation
- **Release Notes**: ~$0.01–0.05 per release
- **README Generator**: ~$0.05–0.20 per generation

Use `gpt-4o-mini` or `claude-3-5-haiku` for significantly lower costs.

### Are my code diffs sent to AI providers?

Yes. PR diffs, commit messages, and repository metadata are sent to the
selected AI provider's API. Review your provider's data processing policies:

- [OpenAI API Data Usage Policies](https://openai.com/policies/api-data-usage-policies)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [Google Gemini Terms](https://ai.google.dev/terms)

---

## ai-pr-review

### The action comments on every push. How do I control this?

Use the `post-as-comment: true` (default) to update the existing comment
instead of creating new ones. The action automatically updates its previous
comment on re-runs.

### How do I exclude test files or generated code?

Use the `exclude-patterns` input:

```yaml
exclude-patterns: "*.test.ts,*.spec.ts,dist/*,generated/*,*.snap"
```

### Can I fail the workflow if code quality is too low?

Yes, use `fail-on-score`:

```yaml
fail-on-score: 70  # Fail if score < 70
```

### The diff is too large and the review seems truncated. What can I do?

The action truncates diffs to fit within AI context windows. Options:

1. Reduce `max-files` to focus on the most important files
2. Use `exclude-patterns` to skip large generated files
3. Switch to a model with a larger context window (e.g. `gemini-1.5-pro`)

---

## ai-commit-message

### How do I use this action locally?

This action is designed for CI. For local use, pipe your diff:

```bash
git diff --staged | ... # Use a local script instead
```

Consider using [commitizen](https://github.com/commitizen/cz-cli) for local commit generation.

### Can I force a specific commit type?

Not directly, but you can restrict allowed types with `commit-types`:

```yaml
commit-types: "fix,chore"  # Only allow fix and chore
```

---

## ai-release-notes

### The release notes include trivial commits. How do I filter them?

The AI filters commits by type automatically. `chore` and `style` commits are
placed in a minor section. If you want cleaner notes, enforce Conventional
Commits in your project — the AI handles them best.

### Can I customize the format of the release notes?

Not yet in v1.0. Custom templates are planned for v1.1. For now, use the
`tone` input: `technical`, `user-friendly`, or `changelog`.

---

## ai-readme-generator

### Will it overwrite my existing README?

If `create-pr: true` (default), it creates a PR — you review before merging.
If `create-pr: false`, it only sets the output; you decide what to do with it.

### Can I use a template for the README?

Yes, set `template: path/to/template.md` to provide a custom template that
the AI will use as a starting point.

---

## Troubleshooting

### Error: "API key not provided"

Ensure your secret is set in GitHub: **Settings → Secrets and Variables →
Actions → New repository secret**. Then reference it correctly:

```yaml
openai-api-key: ${{ secrets.OPENAI_API_KEY }}  # ✅
openai-api-key: ${{ secrets.openai_api_key }}  # ❌ secret names are case-sensitive
```

### Error: "This action must be triggered by a pull_request event"

`ai-pr-review` only works on `pull_request` triggers:

```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

### The AI response is malformed JSON

This is rare but can happen. The action retries automatically. If it persists:

1. Try a different model (e.g., switch from `gpt-4o-mini` to `gpt-4o`)
2. Reduce the diff size with `max-files` or `exclude-patterns`
3. Open an issue with the error details
