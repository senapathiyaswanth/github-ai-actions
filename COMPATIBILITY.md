# Compatibility Matrix

This document outlines the tested compatibility of GitHub AI Actions across different providers, Node environments, and GitHub runners.

## Supported AI Providers

| Provider | Supported Models | Required Input Key | Status |
|----------|------------------|--------------------|--------|
| OpenAI | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` | `openai-api-key` | ✅ Fully Supported |
| Anthropic | `claude-3-5-sonnet-20240620`, `claude-3-opus-20240229` | `anthropic-api-key` | ✅ Fully Supported |
| Google Gemini | `gemini-1.5-pro`, `gemini-1.5-flash` | `gemini-api-key` | ✅ Fully Supported |

## GitHub Runners

| OS / Runner | Compatibility |
|-------------|---------------|
| `ubuntu-latest` (Linux) | ✅ Fully Supported |
| `ubuntu-22.04` (Linux) | ✅ Fully Supported |
| `macos-latest` (macOS) | ✅ Fully Supported |
| `windows-latest` (Windows) | ✅ Fully Supported |
| Self-hosted runners | ✅ Supported (Requires Node 20+) |

## Node.js Environment

The actions are built and packaged for the GitHub Actions `node20` environment.

| Node Version | Compatibility |
|--------------|---------------|
| `Node 16` | ❌ Not Supported |
| `Node 20` | ✅ Required |
| `Node 22` | ✅ Supported (for local dev) |

## Repository Types

| Repo Type | Supported | Notes |
|-----------|-----------|-------|
| Public | ✅ Yes | Free GitHub Actions minutes |
| Private | ✅ Yes | Subject to Actions billing |
| Monorepo | ✅ Yes | Actions automatically detect changed sub-paths |
