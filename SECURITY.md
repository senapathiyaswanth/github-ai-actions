# Security Policy

## Supported Versions

We actively maintain the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Active support  |
| < 1.0   | ❌ No support      |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please use GitHub's private Security Advisory:

1. Go to [Security Advisories](https://github.com/github-ai-actions/github-ai-actions/security/advisories/new)
2. Click "Report a vulnerability"
3. Fill in the details

You will receive a response within **48 hours** acknowledging receipt.

We will:
1. Confirm the vulnerability and its severity
2. Develop and test a fix
3. Release a security patch
4. Publicly disclose after the fix is deployed

## Security Best Practices for Users

### API Key Management

**Never hardcode API keys.** Always use GitHub Secrets:

```yaml
# ✅ Correct
- uses: github-ai-actions/github-ai-actions/actions/pr-review@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}

# ❌ Never do this
- uses: github-ai-actions/github-ai-actions/actions/pr-review@v1
  with:
    openai-api-key: sk-proj-actual-key-here
```

### Token Permissions

Use the least-privilege principle for GitHub tokens:

```yaml
permissions:
  contents: read        # Reading repository content
  pull-requests: write  # Posting review comments
  # Do NOT grant: admin, org-admin, etc.
```

### Version Pinning

Pin action versions to a specific tag (not `@main` or `@latest`):

```yaml
# ✅ Safe — pinned to a specific version
uses: github-ai-actions/github-ai-actions/actions/pr-review@v1.0.0

# ⚠️ Less safe — mutable tag (still better than @main)
uses: github-ai-actions/github-ai-actions/actions/pr-review@v1
```

### PR Content in AI Context

Be aware that PR diffs, titles, and descriptions are sent to AI providers.

- **Avoid committing secrets** in code (even temporarily)
- **Use `.gitignore`** to prevent accidental secret commits
- Review your AI provider's **data processing policies**

### Prompt Injection

Our actions implement prompt injection defenses, but be cautious if contributors
can control PR descriptions in automated contexts.

## Security Features

This repository implements:

- **Dependabot** — weekly automated dependency updates
- **CodeQL** — automated code scanning for vulnerabilities
- **Dependency Review** — blocks PRs introducing high-severity vulnerabilities
- **npm audit** — weekly automated audit with issue creation on failures
- **Secret scanning** — GitHub's built-in secret scanning is enabled
- **Input sanitization** — user-controlled inputs are sanitized before AI prompts
- **Token budget limits** — prevent token abuse via large inputs

## Known Limitations

1. **AI provider trust**: Content sent to AI providers is subject to their
   privacy policies. Do not send sensitive business information in PRs reviewed
   by this action if your AI provider doesn't meet your compliance requirements.

2. **Generated content accuracy**: AI-generated reviews may contain errors.
   Always use human judgment before merging.
