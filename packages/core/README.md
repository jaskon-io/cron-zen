# @cron-zen/core

`cron-zen` 核心逻辑层：Cron 表达式解析、生成与校验。无框架依赖，可在 Node.js 与浏览器环境使用。

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

### 其他导出

- `parseField` / `stringifyField` — 单字段解析 / 序列化
- `escapeCronPercent` / `unescapeCronPercent` — `%` 转义
- `enforceDayWeekMutex` / `assertDayWeekMutex` — 日周互斥
- `describeCron` / `getNextRuns` — 自然语言与最近触发时间
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
