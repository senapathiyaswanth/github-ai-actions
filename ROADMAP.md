# Roadmap

This document outlines the planned development trajectory for GitHub AI Actions.

## ✅ v1.0.0 — Foundation (Released)

- AI PR Review with quality scoring
- AI Commit Message Generator
- AI Release Notes Generator
- AI README Generator
- OpenAI, Anthropic, and Gemini provider support
- TypeScript monorepo with Turborepo
- Full CI/CD pipeline

---

## 🚧 v1.1.0 — Enhancements

**AI PR Review improvements:**
- [ ] Inline code suggestions as GitHub review comments
- [ ] Per-file analysis mode for large PRs
- [ ] Support for `.ai-review-ignore` file to exclude patterns
- [ ] Review history tracking (detect if issues were previously flagged)

**New capabilities:**
- [ ] Configurable review personas (security-focused, performance-focused)
- [ ] Multi-language support for output (Spanish, French, Japanese, etc.)
- [ ] GitHub Actions output summaries with rich formatting

---

## 🔮 v1.2.0 — New Actions

- [ ] **AI Test Generator** — Generate unit tests from source files
- [ ] **AI PR Description Generator** — Auto-generate PR descriptions from diffs
- [ ] **AI Issue Triage** — Classify and label new issues automatically
- [ ] **AI Dependency Audit** — AI-powered dependency risk assessment

---

## 🌟 v2.0.0 — Platform Expansion

**Architecture:**
- [ ] Plugin system for custom action types
- [ ] Action composition (chain multiple actions in one workflow)
- [ ] Webhook-based execution (not just GitHub Actions)

**AI Capabilities:**
- [ ] Streaming responses for large outputs
- [ ] Multi-modal support (analyze screenshots in PRs)
- [ ] Custom fine-tuned model support
- [ ] Local model support (Ollama, LM Studio)

**New Providers:**
- [ ] Mistral AI
- [ ] Cohere
- [ ] Azure OpenAI
- [ ] AWS Bedrock

**Enterprise:**
- [ ] Self-hosted deployment guide
- [ ] SAML/SSO support
- [ ] Audit logging
- [ ] Rate limit management dashboard

---

## 💡 Ideas Under Consideration

- AI-powered changelog generation on merge
- Automated dependency upgrade PR descriptions
- Cross-repository analysis
- GitHub Copilot integration

---

> **Contributing to the roadmap**: Have an idea? Open a
> [Feature Request](https://github.com/github-ai-actions/github-ai-actions/issues/new?template=feature_request.yml)
> or start a [Discussion](https://github.com/github-ai-actions/github-ai-actions/discussions).
