# @cron-zen/react

React **18 / 19** 可视化 Cron 编辑器。薄封装 [`@cron-zen/vanilla`](/api/vanilla) 的 `mountCronZen`，样式与行为对齐 vue3 / vanilla。

**默认语言 `zh-CN`**；`locale="en-US"` 时 Tab / FieldEditor / 预览壳英文化。

## 安装

```bash
pnpm add @cron-zen/react @cron-zen/vanilla @cron-zen/core react react-dom
```

peer：`react` / `react-dom` → `^18.0.0 || ^19.0.0`。

## CronZen

```tsx
import { useState } from 'react'
import { CronZen } from '@cron-zen/react'
import '@cron-zen/react/style.css'

export function Demo() {
  const [cron, setCron] = useState('')
  return (
    <CronZen
      value={cron}
      onChange={(expr) => setCron(expr)}
      locale="zh-CN"
      timeZone="Asia/Shanghai"
      showPreview
    />
  )
}
```

### Props

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | `''` | 受控表达式；空串不注入默认 |
| `onChange` | `(expression, state) => void` | — | 写回 |
| `debounceMs` | `number` | `0` | 写回防抖 |
| `nextCount` | `number` | `10` | 近 N 次 / 近 N 次已触发 |
| `showPreview` | `boolean` | `true` | 底部预览（含 next / prev） |
| `weekFormat` | `'number' \| 'abbr'` | `'number'` | 周字段写法 |
| `timeZone` | `string` | — | IANA 时区 |
| `locale` | `string` | `'zh-CN'` | UI / 自然语言 / 常用模板 |

顶部「常用模板」下拉与 vue3 / vanilla 一致。`ref` 透传 vanilla `CronZenHandle`（`getValue` / `setValue` / `flush` / `reset` / `controller`）。

## useCronZen

无头状态机（不挂可视化），适合自建 UI：

```tsx
const { expression, setValue, nextRuns, prevRuns } = useCronZen({
  value: '',
  locale: 'zh-CN',
  nextCount: 10,
})
```

## 再导出

本包再导出 `mountCronZen` / `createCronZen`（vanilla）及常用 `core` API（含 `getCronPresets` / `getPrevRuns`），便于单入口引用。
