# @cron-zen/core

<p class="cz-lead">
框架无关的 Cron <strong>引擎</strong>：解析、生成、校验、自然语言、近 N 次 / 已触发、常用模板、时区与 i18n。
<strong>没有可视化 UI</strong>——只要函数时只装本包。
</p>

::: tip 只要引擎怎么上手
1. `pnpm add @cron-zen/core`  
2. 打开 [在线 Demo · core](/examples/core.html) 试一遍  
3. 下文按「主流程 → 全量导出」查阅每个函数  
选包：[选哪个包](/guide/choose-package) · 四个 UI Demo：[示例总览](/guide/examples)
:::

## 安装

```bash
pnpm add @cron-zen/core
```

::: code-group

```js [ESM]
import { parseCron, generateCron, getNextRuns } from '@cron-zen/core'
```

```js [CJS]
const { parseCron, generateCron, getNextRuns } = require('@cron-zen/core')
```

```html [浏览器 ESM]
<script type="module">
  import { parseCron } from 'https://cdn.jsdelivr.net/npm/@cron-zen/core@0.2.4/+esm'
</script>
```

:::

---

## 典型主流程（复制即用）

```ts
import {
  parseCron,
  generateCron,
  validateCronState,
  describeCron,
  getNextRuns,
  getPrevRuns,
  formatRunTime,
  getCronPresets,
} from '@cron-zen/core'

const expr = '0 0 9 ? * 2-6' // 工作日 09:00
const parsed = parseCron(expr)
if (!parsed.success) throw new Error(parsed.error)

const state = parsed.state!
const tz = { timeZone: 'Asia/Shanghai' }

console.log(describeCron(state, { locale: 'zh-CN' }))
console.log(validateCronState(state))
console.log(generateCron(state).expression)

const next = getNextRuns(state, 5, new Date(), tz)
const prev = getPrevRuns(state, 5, new Date(), tz)
console.log(next.map((d) => formatRunTime(d, tz)))
console.log(prev.map((d) => formatRunTime(d, tz)))

// 套模板
const preset = getCronPresets('zh-CN').find((p) => p.id === 'every-hour')
```

在线可玩：[examples/core.html](/examples/core.html)

---

## 解析 / 生成 / 校验

### `parseCron(expression)`

将 5 / 6 / 7 段 Quartz 风格表达式解析为可视化 `CronState`。

| | |
| --- | --- |
| **参数** | `expression: string` |
| **返回** | `{ success, state?, error? }` |

```ts
const res = parseCron('0 0 2 * * ?')
if (res.success) console.log(res.state)
else console.error(res.error)
```

### `parseField(fieldName, raw)`

解析**单个**字段（秒/分/时/日/月/周/年）为 `CronFieldState`。

| | |
| --- | --- |
| **参数** | `fieldName` · `raw: string` |
| **返回** | 字段状态（含 `mode` / `value` / `raw` 等） |

### `generateCron(state, options?)`

由 `CronState` 生成表达式（默认自动日周互斥；年未指定 → 6 段）。

| | |
| --- | --- |
| **参数** | `state: CronState` · `options?: GenerateOptions` |
| **返回** | `{ success, expression?, error? }` |

```ts
import { generateCron, createDefaultCronState } from '@cron-zen/core'
generateCron(createDefaultCronState())
// { success: true, expression: '* * * * * ?' }
```

### `generateCronOrThrow(state, options?)`

同 `generateCron`，失败时**抛错**（适合服务端）。

### `stringifyField(field, options?)`

将单个字段状态序列化为 Cron 字段串（周可输出 `MON`…）。

### `validateCronState(state)`

校验范围、日周互斥、非法日期等。

| | |
| --- | --- |
| **返回** | `{ valid, errors, warnings }` |

```ts
const { valid, errors, warnings } = validateCronState(state)
```

### 相关辅助

| API | 说明 |
| --- | --- |
| `validateFieldRange` | 单字段数值范围 |
| `validateDayMonthCombo` | 日/月组合是否合法 |
| `validateDayWeekMutex` | 日周互斥检查 |
| `enforceDayWeekMutex(state, options?)` | 自动纠正互斥（改写 state） |
| `assertDayWeekMutex` | 不合法时抛错 |
| `isConcreteField` | 字段是否「具体指定」（非 `*`/`?`） |
| `getFieldMode` | 从 raw 推断 mode |
| `escapeCronPercent` / `unescapeCronPercent` | `%` 转义（调度系统安全） |

---

## 近 N 次 / 已触发 / 格式化

### `getNextRuns(state, limit?, from?, options?)`

估算**未来**触发时间（旧→新）。条数默认 10，范围 1–100。

| | |
| --- | --- |
| **参数** | `state` · `limit?` · `from?: Date` · `options?: { timeZone? }` |
| **返回** | `Date[]`（无法安全估算时 `[]`） |

### `getPrevRuns(state, limit?, from?, options?)`

估算**已触发**时间（新→旧），与 `getNextRuns` 对称。

### `formatRunTime(date, options?)`

把 `Date` 格式化为可读字符串（可带 `timeZone`）。

```ts
const tz = { timeZone: 'Asia/Shanghai' }
const next = getNextRuns(state, 5, new Date(), tz)
const prev = getPrevRuns(state, 5, new Date(), tz)
console.log(next.map((d) => formatRunTime(d, tz)))
console.log(prev.map((d) => formatRunTime(d, tz)))
```

### 日历辅助（特殊日/周）

| API | 说明 |
| --- | --- |
| `lastDayOfMonth` | 月末日 |
| `lastWeekdayOfMonth` | 月最后工作日（`LW`） |
| `nearestWeekdayOfMonth` | 最接近 n 号的工作日（`nW`） |
| `lastQuartzWeekdayOfMonth` | 本月最后星期 x（`nL`） |
| `nthQuartzWeekdayOfMonth` | 第 m 个星期 x（`n#m`） |
| `expandFieldValues` | 展开字段为候选数值列表 |

特殊字段无法安全估算时，next/prev 返回空数组。已支持：日 `L`/`LW`/`nW`、周 `nL`/`n#m`/裸 `L`、倒序区间回绕。

---

## 常用模板

### `getCronPresets(locale?)`

返回带**当前语言标签**的模板列表。

```ts
getCronPresets('zh-CN')
// [{ id: 'every-minute', label: '每分钟', expression: '0 * * * * ?' }, …]
```

### `listCronPresetDefs()`

只返回 `{ id, expression }`（无文案）。

### `getCronPreset(id, locale?)`

按 id 取一条（含标签）；不存在则 `undefined`。

内置 id 示例：`every-minute` · `every-hour` · `weekdays-9am` · `last-day-month` …

---

## 自然语言与 i18n

### `describeCron(state, options?)`

整表自然语言摘要。

```ts
describeCron(state) // 默认 zh-CN，如「工作日 09:00」
describeCron(state, { locale: 'en-US' })
```

### `describeField(fieldKey, field, options?)`

单字段描述片段。

### UI / Tab 文案

| API | 说明 |
| --- | --- |
| `getCronTabs(locale?)` | 七段 Tab 元数据（label / min / max） |
| `getUiMessages(locale?)` | FieldEditor / 预览壳文案（每秒、复制、常用模板…） |
| `resolveLocale(input?)` | 解析为完整 `CronLocaleMessages` |
| `listLocales()` | 内置语言码 |
| `zhCN` / `enUS` | 内置文案包（可作自定义起点） |

`locale` 接受 `'zh-CN' | 'en-US'` 或自定义 `CronLocaleMessages`。

---

## 状态工厂

| API | 说明 |
| --- | --- |
| `createDefaultCronState()` | 默认「每秒」类状态 |
| `createEveryField()` | `*` 字段 |
| `createUnsetField()` | 年「未指定」等 |
| `FIELD_ORDER` / `FIELD_RANGES` | 字段顺序与合法范围常量 |

---

## 时区

仅依赖 `Intl`，无第三方库。

| API | 说明 |
| --- | --- |
| `isValidTimeZone(id)` | 是否合法 IANA |
| `getZonedParts(date, timeZone)` | Date → 该时区墙上时钟组件 |
| `zonedWallTimeToUtc(...)` | 墙上时钟 → UTC `Date`（处理 DST） |

`getNextRuns` / `getPrevRuns` / `formatRunTime` 的 `options.timeZone` 即走这套逻辑；非法时区回退本地，不抛崩。

---

## 周 / 月标签（Quartz）

| API | 说明 |
| --- | --- |
| `QUARTZ_WEEK_LABELS` / `quartzWeekDayLabel` / `quartzWeekShortLabel` | 周中文等 |
| `QUARTZ_WEEK_ABBR` / `weekNumberToAbbr` / `weekAbbrToNumber` | `SUN`…`SAT` |
| `normalizeWeekFieldToken` / `matchesQuartzWeek` / `weekTokenUsesAbbr` | 周 token 规范化 |
| `QUARTZ_MONTH_LABELS` / `quartzMonthLabel` | 月标签 |
| `QUARTZ_MONTH_ABBR` / `monthNumberToAbbr` / `monthAbbrToNumber` | `JAN`…`DEC` |
| `isYearLikeToken` | 是否像「年」token |

---

## 类型导出（常用）

`CronState` · `CronFieldState` · `CronFieldName` · `CronFieldMode` · `ParseResult` · `ValidateResult` · `GenerateResult` · `WeekFormat` · `TimeZoneOptions` · `DescribeOptions` · `CronPreset` · `CronLocaleCode` · `CronUiMessages` …

编辑器里悬停或打开包内 `.d.ts` 即可看完整字段。

---

## 和可视化包的关系

| 需求 | 装什么 |
| --- | --- |
| 只要上面这些函数 | **仅** `@cron-zen/core` |
| 还要点选 UI | 再加 `vanilla` / `react` / `vue2` / `vue3`（它们都依赖 core） |

四个 UI 在线 Demo → [示例总览](/guide/examples)
