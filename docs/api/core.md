# @cron-zen/core

<p class="cz-lead">
框架无关的 Cron 引擎：解析、生成、校验、自然语言与近 N 次。这是「原生 / Node / 非 Vue」应安装的包——<strong>不依赖 Vue</strong>。
</p>

::: info 和 `@cron-zen/vue3` 的分工
- **`core`**：不需要 Vue；无现成可视化（需自绘）；适合脚本、接口、任意前端。  
- **`vue3`**：**需要 Vue 3**；提供 `CronZen` / `useCronZen`。  
选包说明：[选哪个包](/guide/choose-package)
:::

## 安装

```bash
pnpm add @cron-zen/core
```

::: code-group

```js [ESM · import]
import { parseCron, generateCron } from '@cron-zen/core'
```

```js [CJS · require]
const { parseCron, generateCron } = require('@cron-zen/core')
```

```js [ES5 风格]
var core = require('@cron-zen/core')
var parseCron = core.parseCron
```

:::

纯 JS / TS 均可；完整 Demo → [引入方式](/guide/import-styles)

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

## getNextRuns / getPrevRuns / formatRunTime

估算最近 N 次触发时间（条数 1–100）。默认按**运行环境本地时区**解释 Cron 墙上时钟；可传 IANA `timeZone`。

- **`getNextRuns`**：未来触发（旧→新）
- **`getPrevRuns`**：已触发（新→旧），与 next 对称

```ts
import { getNextRuns, getPrevRuns, parseCron, formatRunTime } from '@cron-zen/core'

const { state } = parseCron('0 0 9 ? * 6L') // 每月最后一个周五 09:00
const from = new Date('2026-01-01T00:00:00Z')
const tz = { timeZone: 'Asia/Shanghai' }
const next = getNextRuns(state!, 5, from, tz)
const prev = getPrevRuns(state!, 5, from, tz)
console.log(next.map((d) => formatRunTime(d, tz)))
console.log(prev.map((d) => formatRunTime(d, tz)))
```

可视化编辑器（vue3 / vue2 / vanilla / react）预览区会同时展示「近 N 次」与「近 N 次已触发」。

## getCronPresets / listCronPresetDefs

内置常用模板（每分钟 / 每小时 / 工作日 9 点 / 月末…）。`listCronPresetDefs` 只返回表达式；`getCronPresets(locale)` 带中英标签。

```ts
import { getCronPresets, getCronPreset, parseCron } from '@cron-zen/core'

const presets = getCronPresets('zh-CN')
// [{ id: 'every-minute', label: '每分钟', expression: '0 * * * * ?' }, …]

const weekdays = getCronPreset('weekdays-9am', 'en-US')
// { id: 'weekdays-9am', label: 'Weekdays at 9:00', expression: '0 0 9 ? * 2-6' }

const { state } = parseCron(weekdays!.expression)
```

编辑器顶部有「常用模板」下拉，选中即套用表达式（文案随 `locale`）。

## describeCron（i18n）

```ts
import { describeCron, createDefaultCronState } from '@cron-zen/core'

describeCron(createDefaultCronState()) // '每天'
describeCron(createDefaultCronState(), { locale: 'en-US' }) // 'Every day'
```

`getCronTabs('en-US')` 可得到英文 Tab 标签。`getUiMessages('en-US')` 提供 FieldEditor / 预览壳文案（每秒→Every second、复制→Copy 等）。内置 `zh-CN` / `en-US`；亦可用 `resolveLocale` / 自定义 `CronLocaleMessages`（含 `ui`）。

已支持的特殊字段（无法安全估算时返回 `[]`）：

| 字段 | 模式 | 说明 |
| --- | --- | --- |
| 日 | `L` / `LW` / `nW` | 月末 / 最后工作日 / 最接近 n 号的工作日 |
| 周 | `nL` / `n#m` / 裸 `L` | 本月最后星期 x / 第 m 个星期 x；裸 `L`≡每周六 |
| 任意 | 倒序区间 | 如时 `22-2`、周 `7-3` 环形回绕 |

## 其它导出

| API | 说明 |
| --- | --- |
| `parseField` / `stringifyField` | 单字段解析 / 序列化 |
| `escapeCronPercent` / `unescapeCronPercent` | `%` 转义 |
| `enforceDayWeekMutex` / `assertDayWeekMutex` | 日周互斥 |
| `describeCron` | 自然语言 |
| `getNextRuns` / `formatRunTime` | 近 N 次与格式化 |
| `lastDayOfMonth` / `lastWeekdayOfMonth` / `nearestWeekdayOfMonth` | 日日历辅助 |
| `lastQuartzWeekdayOfMonth` / `nthQuartzWeekdayOfMonth` | 周日历辅助（nL / #） |
| `QUARTZ_MONTH_LABELS` / `quartzMonthLabel` | 月中文标签 |
| `getCronTabs` | Tab 元数据 |
| `getUiMessages` | FieldEditor / 预览壳 UI 文案 |
| `getCronPresets` / `listCronPresetDefs` | 常用 Cron 模板 |
| `getPrevRuns` | 近 N 次已触发（新→旧） |
| `createDefaultCronState` | 默认状态 |
| `generateCronOrThrow` | 失败抛错 |

源码说明：[packages/core/README.md](https://github.com/jaskon-io/cron-zen/blob/main/packages/core/README.md)
