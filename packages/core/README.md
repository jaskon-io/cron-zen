# @cron-zen/core

`cron-zen` 核心逻辑层：Cron 表达式解析、生成与校验。**无框架依赖**——原生 JS、Node、非 Vue 前端都应优先用本包。

需要 Vue 3 可视化组件时，另装 [`@cron-zen/vue3`](https://www.npmjs.com/package/@cron-zen/vue3)（不能用 vue3 包替代 core 在无 Vue 环境使用）。选包说明：[文档 · 选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package)。

## Install

```bash
npm install @cron-zen/core
# or
pnpm add @cron-zen/core
```

## API (当前)

### `parseCron(expression: string): ParseResult`

解析 5 / 6 / 7 段 Cron 表达式为可视化状态。

```ts
import { parseCron } from '@cron-zen/core';

const res = parseCron('0 0 2 * * ? *');
if (res.success) {
  console.log(res.state);
} else {
  console.error(res.error);
}
```

### `validateCronState(state): ValidateResult`

校验范围、日周互斥、非法日期（如 2 月 31 日）。

```ts
import { validateCronState, createDefaultCronState } from '@cron-zen/core';

const res = validateCronState(createDefaultCronState());
console.log(res.valid, res.errors, res.warnings);
```

### `generateCron(state, options?): GenerateResult`

由可视化状态生成 7 段表达式（默认自动日周互斥）。

```ts
import { generateCron, createDefaultCronState } from '@cron-zen/core';

const res = generateCron(createDefaultCronState());
// { success: true, expression: '* * * * * ? *' }
```

### `getNextRuns` / `getPrevRuns`

估算最近 N 次触发（未来）与已触发（新→旧）。已覆盖日 `L` / `LW` / `nW`、周 `nL` / `n#m` / 裸 `L`，以及倒序区间回绕。

```ts
import { getNextRuns, getPrevRuns, parseCron, formatRunTime } from '@cron-zen/core';

const { state } = parseCron('0 0 9 ? * 6#3');
const from = new Date('2026-01-01');
console.log(getNextRuns(state!, 3, from).map(formatRunTime));
console.log(getPrevRuns(state!, 3, from).map(formatRunTime));
```

### `getCronPresets` / `listCronPresetDefs`

常用模板（每分钟 / 工作日 9 点 / 月末…）；`getCronPresets(locale)` 带中英标签。

### 其他导出

- `parseField` / `stringifyField` — 单字段解析 / 序列化
- `escapeCronPercent` / `unescapeCronPercent` — `%` 转义
- `enforceDayWeekMutex` / `assertDayWeekMutex` — 日周互斥
- `describeCron` / `formatRunTime` / `getUiMessages` — 自然语言与 UI 文案
- `lastDayOfMonth` / `lastWeekdayOfMonth` / `nearestWeekdayOfMonth` — 日日历
- `lastQuartzWeekdayOfMonth` / `nthQuartzWeekdayOfMonth` — 周日历（nL / #）
- `QUARTZ_MONTH_LABELS` / `quartzMonthLabel` — 月标签
- `getCronTabs` — UI Tab 元数据
- `createDefaultCronState` — 默认 UI 状态
- `generateCronOrThrow` — 生成失败时抛错

## Build

```bash
pnpm --filter @cron-zen/core build
```

产物：`dist/`（ESM / CJS + `.d.ts`），仅 `dist` 会随 npm 包发布。

## License

MIT
