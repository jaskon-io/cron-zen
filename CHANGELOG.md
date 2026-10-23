# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。  
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

发布包：`@cron-zen/core`、`@cron-zen/vue3`、`@cron-zen/vue2`、`@cron-zen/vanilla`（大功能对齐时版本号对齐）。

---

## [Unreleased]

### Changed

- 文档：选包决策改为「无 Vue→vanilla / Vue2→vue2 / Vue3→vue3」；新增「引入方式与 Demo」「质量与安全」；首页 / 快速开始 Demo 升华（JS·TS·ESM·CJS·CDN）

---

## [0.2.0] - 2026-10-23

### Added

- **时区**：`getNextRuns` / `formatRunTime` 支持 IANA `timeZone`（如 `Asia/Shanghai`）；导出 `isValidTimeZone` / `getZonedParts` / `zonedWallTimeToUtc`
- **i18n**：`describeCron` / `describeField` / `getCronTabs` 支持 `locale: 'zh-CN' | 'en-US'`（可自定义 `CronLocaleMessages`）
- 适配层透传：`vue3` / `vue2` / `vanilla` 增加 props/options `timeZone`、`locale`

---

## [0.1.6] - 2026-10-23

### Added

- **`@cron-zen/vanilla` npm 首发**：无框架 `mountCronZen` / `createCronZen`（纯 DOM + TS，ESM/CJS）
- vanilla Vitest：24 cases（状态机 / 挂载 / 压测）
- 文档站：API · vanilla；选包 / 介绍补充无框架路径

---

## [0.1.5] - 2026-10-23

### Added

- **`@cron-zen/vue2` npm 首发**：`CronZen` / `useCronZen` / `CronZenPlugin`，行为对齐 vue3 主路径
- vue2 Vitest：单元 / 组件 / 性能压测 / 韧性与安全边界（39 cases）
- 文档站：API · vue2；选包 / 介绍 / 快速开始补充 Vue 2.7

### Changed

- `@cron-zen/vue2`：FieldEditor / CronZen 对齐 L·LW·nW·nL·#、月标签、周 abbr、空 v-model、`showPreview`

---

## [0.1.4] - 2026-10-23

### Changed

- `CronZenPlugin` 仅全局注册 `CronZen`，不再注册依赖 Element 的 `CronZenPicker`（仍可按需 import）
- 文档 / README / npm description：强化「默认无 UI 库」、0.1.3 能力与 Release 入口

---

## [0.1.3] - 2026-10-23

### Added

- 近 N 次预估支持周字段 `nL`（本月最后一个星期 x）与 `n#m`（第 m 个星期 x）
- 周字段裸 `L` 按 Quartz 视为每周六（SAT）参与近 N 次预估

### Changed

- 文档：对照表 / core API 补充 `LW`·`nW`·周 `nL`/`#` 与近 N 次能力说明

---

## [0.1.2] - 2026-10-23

### Added

- 日字段 `LW`（本月最后一个工作日）：解析 / 生成 / 自然语言 / 校验 / 近 N 次预估
- Vue3 日 Tab：「本月最后一个工作日」选项（输出 `LW`）
- 近 N 次预估支持日字段裸 `L`（每月最后一天）与 `nW`（最接近工作日）
- 月「指定」格子显示「1月」…「12月」；导出 `QUARTZ_MONTH_*` / `quartzMonthLabel`

### Changed

- 近 N 次：倒序区间（如周 `7-3`、时 `22-2`）按字段环形回绕展开，不再返回空列表
- 倒序区间校验文案：说明将回绕估算，而非「预估可能不可用」

---

## [0.1.1] - 2026-10-23

### Added

- 文档站（VitePress + GitHub Pages）：指南 / API / Playground，地址见 README
- 文档页「选哪个包」：明确 `core`（任意运行时）与 `vue3`（仅 Vue 3）边界
- 「任意 UI 库集成」：原生 `<dialog>` / Ant 等壳示例（宿主仍为 Vue 3）
- `quartzWeekDayLabel`：周数字 / 英文缩写 →「周一」等文案

### Changed

- 自然语言：周字段 `range` / `list` / `specific` 输出「周一至周五」「每周一」等，不再显示「周 2-6」
- 首页徽章移至 Hero 操作区下方；去掉 0 star 展示，避免冷启动观感突兀
- 文档叙事去 Element 中心化：`CronZenPicker` 标为可选壳
- `package.json` 补充 `repository` / `homepage` / `bugs`（指向仓库与文档站）

### Fixed

- （文档）澄清原生 `<dialog>` 示例不等于无 Vue 纯 HTML 可直接使用 `@cron-zen/vue3`

---

## [0.1.0] - 2026-10-23

### Added

- `@cron-zen/core`：Quartz 风格 5/6/7 段解析、生成、校验、日周互斥、`%` 转义、自然语言与近 N 次
- `@cron-zen/vue3`：`CronZen`、`useCronZen`、可选 `CronZenPicker`（Element Plus peer）
- 对齐 cron.ren 主路径：年不指定省略第 7 段、周 abbr/数字、倒序区间保留、`6L` 不误判为 abbr
- MIT 许可；ESM + CJS；Vitest 覆盖核心路径

---

[0.1.4]: https://github.com/jaskon-io/cron-zen/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/jaskon-io/cron-zen/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/jaskon-io/cron-zen/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/jaskon-io/cron-zen/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/jaskon-io/cron-zen/releases/tag/v0.1.0
