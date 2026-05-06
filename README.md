# changelog-impact

**Track upstream API changes → Find impacted code → Get LLM-powered fix suggestions**

[English](#english) | [中文](#中文)

---

<a id="english"></a>

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

---
---

<a id="中文"></a>

# changelog-impact

**追踪上游 API 变更 → 定位受影响代码 → 获取 LLM 驱动的修复建议**

读 changelog 很容易，但知道**你的代码哪里会坏**很难。

`changelog-impact` 是一个 CLI 工具，监控 Stripe、OpenAI 及任意 GitHub 仓库的变更，扫描你的代码库定位受影响的调用点，并生成可操作的升级报告——支持 LLM 驱动的影响解释和迁移建议。

---

## ✨ 功能概览

```
Stripe 发布了 breaking change
        ↓
changelog-impact 拉取并分类变更
        ↓
扫描你的仓库，定位受影响的调用点
        ↓
生成带 LLM 修复建议的影响报告
```

- 🔍 **监控** — 拉取 Stripe、OpenAI 或任意 GitHub 仓库的变更日志
- 🏷️ **分类** — 自动将变更归类为 breaking / deprecation / security / feature（关键词 + LLM 双模式）
- 🎯 **定位** — 扫描 TS/JS 代码库，精确到文件:行号定位受影响的调用点
- 🧠 **解释** — LLM 解释每条变更**为什么**影响你的代码，以及**怎么修**
- 📋 **报告** — 生成 Markdown 报告，含影响概览、受影响文件、迁移步骤
- 🐛 **追踪** — 从报告直接创建 GitHub Issue

---

## 🚀 快速开始

```bash
# 安装
npm install -g changelog-impact

# 初始化配置
changelog-impact init

# 对你的项目运行（拉取 + 扫描 + 生成报告）
changelog-impact run --repo /path/to/your/project
```

完成。查看 `reports/` 目录下的影响报告。

---

## 📖 命令

| 命令 | 说明 |
|------|------|
| `changelog-impact init` | 创建 `changelog-impact.yaml` 配置文件 |
| `changelog-impact fetch` | 从所有数据源拉取变更日志 |
| `changelog-impact scan` | 扫描仓库中受影响的代码（使用缓存数据） |
| `changelog-impact run` | 一键完成：拉取 + 扫描 + 生成报告 |
| `changelog-impact github issue` | 从报告创建 GitHub Issue |

### 选项

```bash
# 只处理指定数据源
changelog-impact run --source stripe

# 只考虑指定日期之后的变更
changelog-impact run --since 2026-04-01

# 扫描其他仓库
changelog-impact scan --repo /path/to/project
```

---

## 🧠 LLM 集成

启用 LLM 可获得语义分类、影响解释和迁移建议：

```yaml
# changelog-impact.yaml
llm:
  enabled: true
  provider: openai        # openai | ollama
  model: Kimi-K2.5        # 或 gpt-4o、qwen2.5 等
  maxTokens: 2048
```

通过环境变量设置 API Key：
```bash
export OPENAI_API_KEY=your-key
export OPENAI_BASE_URL=https://your-api-endpoint  # 可选，用于兼容 API
```

或使用 Ollama 本地运行（无需 API Key）：
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

### 不启用 LLM 也完全可用

工具在不启用 LLM 时也能正常工作——会使用关键词分类作为兜底方案。LLM 是可选增强。

---

## 📦 监控任意 GitHub 仓库

添加自定义数据源，追踪任何上游依赖的变更：

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

## 📄 报告示例

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

**为什么影响你的代码**：
`chat.completions.create` 方法签名变更——`model` 参数变为必填。
你的代码 `src/ai.ts:5` 调用此方法时未指定 `model`，将会报错。

**受影响文件（3 处命中）**：
- `src/ai.ts:5` — `const completion = await openai.chat.completions.create({})`
- `src/chat.ts:12` — `await openai.chat.completions.create({model: "gpt-4"})`
- `src/api/route.ts:28` — `openai.chat.completions.create`

**迁移步骤**：
1. 为所有 `chat.completions.create()` 调用添加 `model: "gpt-4o"`
2. 将 `temperature` 参数更新为 0 到 1 之间
3. 运行测试套件验证修改
```

---

## ⚙️ 配置

完整的 `changelog-impact.yaml` 配置参考：

```yaml
sources:
  - name: stripe              # 内置 changelog 数据源
    type: changelog
    enabled: true

  - name: openai              # 内置 changelog 数据源
    type: changelog
    enabled: true

  - name: my-dep              # 任意 GitHub 仓库
    type: github-repo
    enabled: true
    repo: owner/name          # github-repo 类型必填
    branch: main              # 可选，默认 main

repo: .                       # 默认仓库路径

llm:
  enabled: false
  provider: openai            # openai | ollama
  model: Kimi-K2.5
  maxTokens: 2048
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | LLM 的 API Key（或任何 OpenAI 兼容 API） |
| `OPENAI_BASE_URL` | 自定义 API 端点（设置后自动检测） |
| `GITHUB_TOKEN` | GitHub Token，认证后 5000 次/小时（匿名仅 60 次） |

---

## 🛠️ 工作原理

1. **拉取** — 从配置的数据源获取变更条目（Stripe/OpenAI/自定义仓库均使用 GitHub Releases API）
2. **分类** — 对每条变更进行分类（LLM 优先，关键词兜底）
3. **扫描** — 遍历仓库中的 TS/JS 文件，匹配 provider 专属模式（Stripe: 18 个模式，OpenAI: 18 个模式）
4. **增强** — LLM 解释影响原因并建议迁移步骤
5. **报告** — 生成 Markdown 报告，含概览表格、逐条详情、可操作步骤

---

## 🗺️ 路线图

- [x] **v0.1** — Stripe + OpenAI 变更日志，关键词分类，TS/JS 扫描，Markdown 报告
- [x] **v0.2** — LLM 集成，GitHub 仓库数据源，统一 Source 架构，GitHub Issue 创建
- [ ] **v0.3** — GitHub App（CI 集成），Slack/飞书通知
- [ ] **v0.4** — AST 匹配（减少误报），自定义扫描模式
- [ ] **v0.5** — LLM 自动生成修复 PR
- [ ] **v1.0** — 托管 SaaS：多仓库、团队协作、仪表盘

---

## 🤝 参与贡献

欢迎贡献！随时提交 Issue 或 PR。

---

## License

MIT
