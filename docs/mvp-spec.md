# MVP 规格说明（v0.1）：Changelog-to-Impact Copilot（CLI 首发）

选定：provider = Stripe + OpenAI；形态 = 先开源 CLI，再做 SaaS。

目标：在 2-3 周内做出“可真实使用”的开源 CLI，并在第 4 周开始收费（托管/团队能力/自托管增强）。

---

## 1) 用户故事（User Stories）

US-1（开发者/团队）：
- 作为一个依赖 Stripe/OpenAI 的工程师，我希望在它们发布 breaking change 或弃用时，能自动收到提醒，并知道**我的 repo 哪些文件/调用点受影响**，以便快速修复。

US-2（负责人）：
- 作为技术负责人，我希望每次外部依赖变更时都能有一条可追踪的 Issue，包含链接、影响范围、建议行动，从而减少事故。

---

## 2) CLI 功能范围（Must / Should / Won’t）

### Must（v0.1 必须有）

1. Provider watcher（Stripe + OpenAI）
- 拉取变更源：
  - Stripe：优先用官方 changelog / release notes 的可获取入口（RSS/网页抓取）
  - OpenAI：优先用 changelog / blog / release notes 的可获取入口（网页抓取）
- 变更检测：同一 source 的两次快照 diff，识别新增条目

2. 变更分类（规则 + 轻量 LLM 可选）
- 基础规则：包含关键词的条目标记为 breaking/deprecation/security/feature
- 输出：标题、日期、链接、分类、摘要

3. Repo 扫描（TS/JS 优先）
- 对每个变更条目，执行关键词/模式扫描：
  - Stripe：如 `stripe.`、`paymentIntents`、`charges`、`customers`、`webhooks`、API version 等
  - OpenAI：如 `openai` SDK、`chat.completions`、`responses`、模型名、参数名
- 输出：命中文件列表 + 行号片段

4. 生成 Issue（本地 Markdown + 可选 GitHub 输出）
- 先生成本地 markdown 报告（无需 token）
- 若提供 GitHub token，则可创建 GitHub issue

### Should（v0.2）
- 支持 GitHub App / Checks（后续 SaaS 化）
- 更精准的影响定位（AST、import graph）
- 可配置 ruleset
- Slack/飞书通知

### Won’t（v0.1 明确不做）
- 自动开 PR（先 Issue）
- 多语言 AST（先 TS/JS）
- 多 provider（先 2 个）

---

## 3) CLI 命令设计（建议）

二进制名：`changelog-impact`

1) 初始化配置
- `changelog-impact init`
  - 生成 `changelog-impact.yaml`

2) 拉取变更并输出报告
- `changelog-impact run --repo .`
  - 输出：`./reports/<date>-<provider>.md`

3) 仅拉取变更
- `changelog-impact fetch`

4) 仅扫描 repo
- `changelog-impact scan --repo . --provider stripe --since 2026-01-01`

5) 创建 GitHub issue（可选）
- `changelog-impact github issue --repo owner/name --token $GITHUB_TOKEN --report ./reports/x.md`

---

## 4) 输出报告格式（模板）

- 概览
  - provider
  - 时间范围
  - breaking/deprecation 数量

- 变更条目（每条）
  - 标题、日期、链接
  - 分类（breaking/deprecation/…）
  - 影响判断（why）
  - repo 命中点（文件 + 行号 + 片段）
  - 建议行动（行动清单）

---

## 5) 技术实现建议

- 语言：Go（单文件分发 + 性能），或 Node（更快迭代）。
- 我建议：
  - 核心 CLI 用 Go
  - provider 抓取与解析可用 Go + goquery
  - repo 扫描用 ripgrep（或 Go 内置扫描）

存储：
- `~/.changelog-impact/cache/` 保存快照（避免重复请求）

---

## 6) 验证指标（第 1 个 PMF 里程碑）

- 10 个 GitHub stars（开源可见性）
- 5 个真实 repo 接入使用
- 3 个用户反馈：至少 1 次“帮我提前发现/减少升级时间/减少事故”
- 第 4 周开始收费：至少 2 个付费（托管或自托管支持）

