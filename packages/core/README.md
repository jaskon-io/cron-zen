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

### 其他导出

- `parseField` — 单字段解析
- `escapeCronPercent` / `unescapeCronPercent` — `%` 转义
- `assertDayWeekMutex` — 日周互斥校验
- `createDefaultCronState` — 默认 UI 状态

## Build

```bash
pnpm --filter @cron-zen/core build
```

产物：`dist/`（ESM / CJS + `.d.ts`），仅 `dist` 会随 npm 包发布。

## License

MIT
