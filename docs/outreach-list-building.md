# 外呼名单构建指南（不依赖付费数据库）

目标：在 2 天内整理 100 个高匹配 ICP（Stripe + OpenAI + TS/Node）的潜在客户线索。

---

## 1) GitHub 线索（最适合你）

方法 A：GitHub 代码搜索（公开仓库）
- 组合关键词：
  - `stripe` AND `openai` AND `typescript`
  - `stripe` AND `openai` AND `nextjs`
  - `stripe` AND `OpenAI` AND `node`

筛选：
- repo 所属 org（优先公司 org）
- 最近 3 个月有提交
- README 指向一个产品网站

记录字段（表格列）：
- 公司/产品名
- 网站
- GitHub org/repo
- 触达方式（邮箱/LinkedIn/表单）
- 证据（repo 里出现 stripe/openai 的路径）

方法 B：从 OSS 生态反推
- 找做 AI 功能的开源 SaaS/模板/脚手架，通常会集成 Stripe。

---

## 2) SEO 线索（高意图）

搜索词：
- "Stripe integration" + "AI"
- "OpenAI" + "billing" + "Stripe"
- "SaaS" + "Stripe" + "OpenAI"

筛选：
- 产品有 pricing 页面
- blog/engineering 有技术栈信息（Next.js/TS）

---

## 3) 小红书/抖音线索（内容反向获客）

发内容后，在评论区引导：
- “需要我用你们 repo 跑一份免费 impact report 吗？留邮箱/私信。”

你要的不是泛关注，而是：
- 3-10 个愿意给 repo/片段做 demo 的人

---

## 4) 外呼话术（15 秒版）

“我做了个开源 CLI：Stripe/OpenAI 更新后，它会扫描你们 repo，直接列出受影响文件/行号，并生成升级 issue。你愿意给我一个公开 repo（或脱敏片段）我跑个 demo 吗？”

---

## 5) 访谈问题（8 问）

1) 你们依赖哪些外部 API（Stripe/OpenAI/…）？
2) 最近一次因为外部变更踩坑是什么？
3) 通常谁负责看 changelog？多久看一次？
4) 一次升级从发现到完成要多久？
5) 最大成本在哪：找影响点 / 改代码 / 测试 / 发布？
6) 你们现在用什么工具？（RSS/Slack/Dependabot/人工）
7) 如果自动输出“影响点 + issue + 清单”，你觉得值多少钱？
8) 你希望先支持哪两个 provider/哪种语言？

---

## 6) 收费测试（不要拖）

建议第 4 周开始收：
- 托管版 beta：$29/月
或
- 自托管支持：$499/年（含更新与支持）

