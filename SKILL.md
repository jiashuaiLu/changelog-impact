***

name: "upstream-sync"
description: "智能同步上游 midscene 项目的更新到 DongGUI。当用户想要检查上游更新、同步特定 commit、或生成变更报告时调用此 Skill。"
language: "zh-CN"

# 上游同步智能 Agent

此 Skill 用于智能同步上游 midscene 项目的更新到 DongGUI 项目，支持变更分析、影响评估、报告生成和智能合并。

## 触发场景

- 用户想要检查上游 midscene 项目是否有更新
- 用户想要同步特定的 commit
- 用户想要生成变更分析报告
- 用户想要查看当前同步状态

## 核心包映射

| 上游包名               | 下游包名              | 路径                |
| ------------------ | ----------------- | ----------------- |
| @midscene/core     | @donggui/core     | packages/core     |
| @midscene/web      | @donggui/web      | packages/web      |
| @midscene/computer | @donggui/computer | packages/computer |
| @midscene/shared   | @midscene/shared  | packages/shared   |

## 自定义功能文件（忽略同步）

- `packages/core/src/ai-model/assert.ts` - 智能断言模块
- `packages/core/src/types.ts` - 扩展类型定义

## 工作流程

### 1. 检查上游更新

```bash
# 添加上游仓库
git remote add upstream https://github.com/web-infra-dev/midscene.git 2>/dev/null || true

# 获取上游更新
git fetch upstream main

# 获取新 commits
git log upstream/main --since="v1.5.6" --oneline
```

### 2. 分析 Commit

对于每个涉及核心包的 commit：

1. **获取变更文件列表**：
   ```bash
   git show --stat --pretty=format: <commit-hash>
   ```
2. **判断影响级别**：
   - **Critical**: 涉及 index.ts、types.ts、API 文件
   - **High**: 涉及 agent/、service/ 目录
   - **Medium**: 变更行数 > 100
   - **Low**: 其他变更
3. **分类变更类型**：
   - feature / bugfix / refactor / docs / test / chore / breaking / security
4. **生成建议**：
   - must-sync: 安全修复
   - should-sync: Bug 修复
   - manual-review: 破坏性变更、涉及自定义功能
   - optional-sync: 低风险变更
   - skip: 不涉及核心包

### 3. 生成报告

生成包含以下内容的 Markdown 报告：

- 概要统计
- Commit 详情
- 影响评估
- 建议
- 下一步操作

### 4. 智能合并

1. 创建临时分支
2. 尝试合并
3. 处理冲突：
   - 自定义功能文件 → 保留本地修改
   - Bugfix/Security fix → 采用上游修改
   - 其他 → 智能合并
4. 替换包名：`@midscene/*` → `@donggui/*`
5. 运行测试验证

## 使用示例

### 检查上游更新

```
用户: 检查上游 midscene 项目是否有更新
```

Agent 将：

1. Fetch 上游仓库
2. 获取新 commits
3. 过滤核心包相关变更
4. 生成分析报告

### 同步特定 Commit

```
用户: 同步 commit abc1234
```

Agent 将：

1. 分析 commit 影响
2. 创建临时分支
3. 执行合并
4. 处理冲突
5. 替换包名
6. 运行测试

### 生成报告

```
用户: 生成上游同步报告
```

Agent 将生成详细的 Markdown 报告，包含：

- 变更概要
- 每个 commit 的详细分析
- 影响评估
- 建议操作

## 输出格式

### 报告示例

```markdown
# DongGUI 上游同步报告

**报告 ID**: SYNC-2024-01-15-001
**生成时间**: 2024-01-15T09:00:00Z

## 📊 概要

| 指标 | 数量 |
|------|------|
| 新增 Commits | 15 |
| 涉及核心包 | 8 |
| 高影响变更 | 2 |
| 破坏性变更 | 1 |
| 需人工审查 | 3 |

## 📋 Commits 详情

### 🔴 Critical: feat(core): add new assertion API

**Commit**: `abc1234`
**影响评估**: 涉及自定义断言功能
**建议**: 🛑 需人工审查

## 💡 建议

1. **优先处理 Critical 级别变更**
2. **审查自定义功能影响**
3. **同步 Bug 修复**

## 🚀 下一步操作

1. 审查 Critical 级别变更
2. 决定是否保留自定义修改
3. 执行同步命令
```

## 注意事项

1. **保护自定义功能**：合并时自动保留自定义功能文件的本地修改
2. **包名替换**：合并后自动将 `@midscene/*` 替换为 `@donggui/*`
3. **测试验证**：合并后运行测试确保功能正常
4. **回滚机制**：如果合并失败或测试不通过，自动回滚

