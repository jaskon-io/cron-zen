# @cron-zen/core

<p class="cz-lead">
框架无关的 Cron 引擎：解析、生成、校验、自然语言与近 N 次。可在 Node.js 与浏览器使用。
</p>

## 安装

```bash
pnpm add @cron-zen/core
```

## parseCron

将 5 / 6 / 7 段表达式解析为可视化状态。

```ts
import { parseCron } from '@cron-zen/core'

const res = parseCron('0 0 2 * * ?') // 6 段：年不指定
if (res.success) {
  console.log(res.state)
} else {
  console.error(res.error)
}
```

| 返回字段 | 说明 |
| --- | --- |
| `success` | 是否解析成功 |
| `state` | 成功时的可视化状态 |
| `error` | 失败时的可读错误 |

## generateCron

由可视化状态生成表达式（默认自动日周互斥；年不指定 → 6 段）。

```ts
import { generateCron, createDefaultCronState } from '@cron-zen/core'

const res = generateCron(createDefaultCronState())
// { success: true, expression: '* * * * * ?' }
```

## validateCronState

校验范围、日周互斥、非法日期。

```ts
import { validateCronState, createDefaultCronState } from '@cron-zen/core'

const res = validateCronState(createDefaultCronState())
console.log(res.valid, res.errors, res.warnings)
```

## 其它导出

| API | 说明 |
| --- | --- |
| `parseField` / `stringifyField` | 单字段解析 / 序列化 |
| `escapeCronPercent` / `unescapeCronPercent` | `%` 转义 |
| `enforceDayWeekMutex` / `assertDayWeekMutex` | 日周互斥 |
| `describeCron` | 自然语言 |
| `getNextRuns` | 近 N 次 |
| `getCronTabs` | Tab 元数据 |
| `createDefaultCronState` | 默认状态 |
| `generateCronOrThrow` | 失败抛错 |

源码说明：[packages/core/README.md](https://github.com/jaskon-io/cron-zen/blob/main/packages/core/README.md)
