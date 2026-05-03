# changelog-impact

**Track upstream API changes → Find impacted code → Get LLM-powered fix suggestions**

Reading changelogs is easy. Knowing what breaks in YOUR code is hard.

`changelog-impact` is a CLI tool that monitors Stripe, OpenAI, and any GitHub repo for changes, scans your codebase to find impacted call sites, and generates actionable upgrade reports — with LLM-powered impact explanations and migration steps.

---

## ✨ What it does

```
Stripe releases a breaking change
        ↓
changelog-impact fetches & classifies it
        ↓
Scans your repo for impacted call sites
        ↓
Generates a report with LLM-powered fix suggestions
```

- 🔍 **Monitor** — Fetch changelog entries from Stripe, OpenAI, or any GitHub repository
- 🏷️ **Classify** — Automatically categorize changes as breaking / deprecation / security / feature (keyword + LLM)
- 🎯 **Locate** — Scan your TS/JS codebase to find impacted call sites with file:line precision
- 🧠 **Explain** — LLM explains *why* each change affects your code and *how* to fix it
- 📋 **Report** — Generate Markdown reports with impact overview, affected files, and migration steps
- 🐛 **Track** — Create GitHub Issues directly from reports

---

## 🚀 Quick Start

```bash
# Install
npm install -g changelog-impact

# Initialize config
changelog-impact init

# Run against your repo (fetch + scan + report)
changelog-impact run --repo /path/to/your/project
```

That's it. Check `reports/` for your impact report.

---

## 📖 Commands

| Command | Description |
|---------|-------------|
| `changelog-impact init` | Create `changelog-impact.yaml` config file |
| `changelog-impact fetch` | Fetch changelog entries from all sources |
| `changelog-impact scan` | Scan repo for impacted code (uses cached data) |
| `changelog-impact run` | All-in-one: fetch + scan + generate report |
| `changelog-impact github issue` | Create a GitHub Issue from a report |

### Options

```bash
# Only process a specific source
changelog-impact run --source stripe

# Only consider changes since a date
changelog-impact run --since 2026-04-01

# Scan a different repo
changelog-impact scan --repo /path/to/project
```

---

## 🧠 LLM Integration

Enable LLM for semantic classification, impact explanation, and migration suggestions:

```yaml
# changelog-impact.yaml
llm:
  enabled: true
  provider: openai        # openai | ollama
  model: Kimi-K2.5        # or gpt-4o, qwen2.5, etc.
  maxTokens: 2048
```

Set your API key via environment variable:
```bash
export OPENAI_API_KEY=your-key
export OPENAI_BASE_URL=https://your-api-endpoint  # optional, for compatible APIs
```

Or use Ollama locally (no API key needed):
```bash
ollama pull qwen2.5:0.5b
```

```yaml
llm:
  enabled: true
  provider: ollama
  model: qwen2.5:0.5b
  baseUrl: http://localhost:11434
```

### Without LLM

The tool works perfectly without LLM — it uses keyword-based classification as fallback. LLM is an optional enhancement.

---

## 📦 Monitor Any GitHub Repository

Add custom sources to track any upstream dependency:

```yaml
# changelog-impact.yaml
sources:
  - name: stripe
    type: changelog
    enabled: true

  - name: openai
    type: changelog
    enabled: true

  - name: next.js
    type: github-repo
    enabled: true
    repo: vercel/next.js
    branch: canary

  - name: prisma
    type: github-repo
    enabled: true
    repo: prisma/prisma

  - name: tailwindcss
    type: github-repo
    enabled: true
    repo: tailwindlabs/tailwindcss
```

---

## 📄 Report Example

```markdown
# Changelog Impact Report

**Source**: openai (changelog)
**Period**: 2026-04-01 ~ 2026-05-03

## Overview

| Category    | Count |
|-------------|-------|
| Breaking    | 1     |
| Deprecation | 0     |
| Security    | 0     |
| Feature     | 1     |

## Changes & Impact

### 🔴 Breaking: v6.16.0

- **Date**: 2026-04-15
- **Category**: breaking
- **Link**: https://github.com/openai/openai-node/releases/tag/v6.16.0

**Why this affects your code**:
The `chat.completions.create` method signature changed — the `model`
parameter is now required. Your code at `src/ai.ts:5` calls this
method without specifying `model`, which will throw an error.

**Impacted files (3 hits)**:
- `src/ai.ts:5` — `const completion = await openai.chat.completions.create({})`
- `src/chat.ts:12` — `await openai.chat.completions.create({model: "gpt-4"})`
- `src/api/route.ts:28` — `openai.chat.completions.create`

**Migration steps**:
1. Add `model: "gpt-4o"` to all `chat.completions.create()` calls
2. Update the `temperature` parameter to be between 0 and 1
3. Run your test suite to verify the changes
```

---

## ⚙️ Configuration

Full `changelog-impact.yaml` reference:

```yaml
sources:
  - name: stripe              # Built-in changelog source
    type: changelog
    enabled: true

  - name: openai              # Built-in changelog source
    type: changelog
    enabled: true

  - name: my-dep              # Any GitHub repository
    type: github-repo
    enabled: true
    repo: owner/name          # Required for github-repo type
    branch: main              # Optional, defaults to main

repo: .                       # Default repo path

llm:
  enabled: false
  provider: openai            # openai | ollama
  model: Kimi-K2.5
  maxTokens: 2048
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | API key for LLM (or any OpenAI-compatible API) |
| `OPENAI_BASE_URL` | Custom API endpoint (auto-detected if set) |
| `GITHUB_TOKEN` | GitHub token for API auth (5000 req/hour vs 60 anonymous) |

---

## 🛠️ How It Works

1. **Fetch** — Pulls changelog entries from configured sources (GitHub Releases API for Stripe/OpenAI/custom repos)
2. **Classify** — Categorizes each entry (LLM-first, keyword fallback)
3. **Scan** — Walks your repo's TS/JS files, matches against provider-specific patterns (Stripe: 18 patterns, OpenAI: 18 patterns)
4. **Enrich** — LLM explains impact and suggests migration steps for each hit
5. **Report** — Generates a Markdown report with overview table, per-change details, and actionable steps

---

## 🗺️ Roadmap

- [x] **v0.1** — Stripe + OpenAI changelog, keyword classification, TS/JS scan, Markdown report
- [x] **v0.2** — LLM integration, GitHub Repo source, unified Source architecture, GitHub Issue creation
- [ ] **v0.3** — GitHub App (CI integration), Slack/Discord notifications
- [ ] **v0.4** — AST-based matching (reduce false positives), custom scan patterns
- [ ] **v0.5** — Auto PR generation with LLM code fixes
- [ ] **v1.0** — Hosted SaaS: multi-repo, team collaboration, dashboard

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

---

## License

MIT
