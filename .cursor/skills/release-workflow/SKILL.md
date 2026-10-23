---
name: release-workflow
description: >-
  cron-zen 提交规范、CHANGELOG 与 npm 发版节奏。在用户要求提交、推送、发版、publish、
  写更新日志、升版本，或讨论何时发布时使用。
---

# cron-zen 发布与提交工作流

## 核心原则（用户原意）

1. **规范提交**
2. **凑齐一个大功能然后推送 npm 官网发布版本，但是代码提交可以正常提交**
3. **更新日志待大功能；也不是大功能，一个致命 bug 或者其他的可以修复、更新等等这种**

解读：

| 动作 | 节奏 |
| --- | --- |
| `git commit` / 推 GitHub | **随时可以**，按规范小步提交 |
| `CHANGELOG` + 升版本 + `npm publish` | **攒一批再发**：完整功能点，或致命/重要 bugfix，或明显体验更新 |
| 禁止 | 每个小 commit 都升版本、都 publish |

---

## 1. 规范提交（随时）

- 遵循 **Conventional Commits**（与仓库历史一致）
- 格式：`type(scope): summary`，正文说明动机（why），可用 HEREDOC
- 常用 `type`：`feat` / `fix` / `docs` / `test` / `refactor` / `perf` / `chore` / `release`
- `scope` 示例：`core` / `vue3` / `docs`
- **一次逻辑改动一个 commit**；不要为「马上发 npm」而硬合并无关改动
- 用户未明确要求时：**不要**自行 `git push` / `npm publish`
- 提交前：相关 Vitest 通过；改 `core` 必须补/改 `__tests__` + JSDoc

### 示例

```text
fix(core): estimate next runs for reverse cron ranges

Expand wrap-around intervals like week 7-3 so preview is not empty.
```

```text
docs: clarify core vs vue3 runtime boundaries
```

---

## 2. 何时 npm 发版（凑齐再发）

**可以发版**（满足任一即可）：

- 凑齐一个可对外讲述的功能点（用户能感知的完整能力）
- **致命 / 严重 bug** 修复（错误结果、崩溃、安全、错误 cron 输出）
- 其它值得用户升级的更新（明显体验、对齐 cron.ren 的行为修正、文档站重大改版等）

**先不要发版**：

- 纯文案微调、注释、测试重构、未完成的半截功能
- 仅内部结构整理、无行为变化的 chore
- 「刚改两行就升补丁」的冲动

发版包：

- `@cron-zen/core` + `@cron-zen/vue3`（版本号 **对齐**）
- `@cron-zen/vue2` / `@cron-zen/vanilla`（可独立补丁号发版；大功能对齐时可与主线同号）

---

## 3. 更新日志（CHANGELOG.md）

文件：仓库根目录 [`CHANGELOG.md`](../../../CHANGELOG.md)

### 日常开发

- 有用户可见行为变化时，先写入 **`## [Unreleased]`**（Added / Changed / Fixed / Removed）
- 小步 git 提交 **不必** 每次都改 CHANGELOG；但进入 Unreleased 的条目应在发版前齐全
- 致命 bug、重要修复：**尽快**记到 Unreleased，避免发版时遗漏

### 正式发版时

1. 将 `[Unreleased]` 内容挪到新版本节，例如 `## [0.1.2] - YYYY-MM-DD`
2. 清空或保留空的 `[Unreleased]` 节
3. 同步 bump：
   - `packages/core/package.json` → `version`
   - `packages/vue3/package.json` → `version`（与 core 相同）
4. 一个 **`release:`** commit 汇总版本 + CHANGELOG（可含发版说明），避免「版本一个 commit、日志又一个」拆太碎
5. 再 `git push`，再 npm publish

Keep a Changelog 分类：`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`

---

## 4. 发版检查清单

复制并勾选：

```text
Release checklist:
- [ ] Unreleased 条目完整（功能 / 致命修复 / 重要更新）
- [ ] core + vue3 版本号已 bump 且一致
- [ ] pnpm --filter @cron-zen/core test
- [ ] pnpm --filter @cron-zen/vue3 test（若改了 vue3）
- [ ] CHANGELOG 已从 Unreleased 迁到带日期的版本节
- [ ] 单一 release commit（或用户同意的少量提交）
- [ ] git push origin main（用户明确要求后）
- [ ] npm whoami → akims（或有效 publish token）
- [ ] pnpm --filter @cron-zen/core publish --access public
- [ ] pnpm --filter @cron-zen/vue3 publish --access public
- [ ] npm view @cron-zen/core version && npm view @cron-zen/vue3 version
```

Publish 命令：

```bash
npm whoami
pnpm --filter @cron-zen/core publish --access public
pnpm --filter @cron-zen/vue3 publish --access public
```

认证：优先 Granular Token（Bypass 2FA + `@cron-zen` 写权限）。**禁止**把 token 写进仓库或发到聊天。本地备忘见 gitignore 的 `PUBLISH.local.md`。

---

## 5. 版本号怎么选

| 变化 | 版本 |
| --- | --- |
| 致命/重要 bug、小功能、文档站体验（不破坏 API） | **patch**（0.1.1 → 0.1.2） |
| 新增能力、行为对齐增强（仍兼容） | **minor**（0.1.x → 0.2.0） |
| 破坏性 API / 默认行为不兼容 | **major**（需用户确认） |

当前线：`0.1.x`。不确定时先问用户。

---

## 6. Agent 行为约束

- 用户只说「提交 / commit」→ 只做规范 git commit，**不**升版本、**不** publish
- 用户说「发版 / 发布 npm / release」→ 走本节检查清单；先确认 Unreleased 是否够格
- 用户说「推送」→ 可以 `git push`；仍不等于 npm publish
- 未凑齐发版条件时：继续正常提交 + 往 Unreleased 记条目，并告知「尚未达到发版门槛」
