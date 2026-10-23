# `@cron-zen/core`

纯 TypeScript：Cron 解析、生成、校验、自然语言与近 N 次。无框架依赖。

## 安装

```bash
pnpm add @cron-zen/core
```

## `parseCron(expression)`

解析 5 / 6 / 7 段表达式为可视化状态。

```ts
import { parseCron } from '@cron-zen/core';

const res = parseCron('0 0 2 * * ?'); // 6 段：年不指定
if (res.success) {
  console.log(res.state);
} else {
  console.error(res.error);
}
```

## `generateCron(state, options?)`

由可视化状态生成表达式（默认自动日周互斥；年不指定时输出 6 段）。

```ts
import { generateCron, createDefaultCronState } from '@cron-zen/core';

const res = generateCron(createDefaultCronState());
// { success: true, expression: '* * * * * ?' }
```

## `validateCronState(state)`

校验范围、日周互斥、非法日期（如 2 月 31 日）。

```ts
import { validateCronState, createDefaultCronState } from '@cron-zen/core';

const res = validateCronState(createDefaultCronState());
console.log(res.valid, res.errors, res.warnings);
```

## 其他常用导出

| API | 说明 |
| --- | --- |
| `parseField` / `stringifyField` | 单字段解析 / 序列化 |
| `escapeCronPercent` / `unescapeCronPercent` | `%` 转义 |
| `enforceDayWeekMutex` / `assertDayWeekMutex` | 日周互斥 |
| `describeCron` | 自然语言描述 |
| `getNextRuns` | 最近触发时间 |
| `getCronTabs` | UI Tab 元数据 |
| `createDefaultCronState` | 默认 UI 状态 |
| `generateCronOrThrow` | 生成失败时抛错 |

更多细节见仓库 [`packages/core/README.md`](https://github.com/jaskon-io/cron-zen/blob/main/packages/core/README.md)。
