# @cron-zen/vanilla

<p class="cz-lead">
<strong>无框架</strong>可视化适配：纯 DOM + TypeScript，不依赖 Vue / React。适合原生页面、任意框架壳，或只要 <code>createCronZen</code> 无头状态机。
</p>

::: tip 和 core 的区别
`core` 只有解析 / 生成 / 校验等引擎 API，**没有**点选 UI。  
`vanilla` = 引擎 + `mountCronZen` 可视化。
:::

## 导出

| 导出 | 用途 |
| --- | --- |
| `mountCronZen` | 挂载完整编辑器到 DOM |
| `createCronZen` | 无头状态机（自绘 UI） |
| `displayFieldValue` | 预览区字段串 |

并再导出常用 `core` API（`parseCron` / `generateCron` 等）。

## 安装

```bash
pnpm add @cron-zen/vanilla @cron-zen/core
```

::: code-group

```html [script 直引 · 推荐纯 HTML]
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.css" />
<script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen('#cron', { value: '', onChange: console.log })
</script>
```

```js [ESM · 打包器]
import { mountCronZen } from '@cron-zen/vanilla'
import '@cron-zen/vanilla/style.css'
```

```js [CJS]
const { createCronZen } = require('@cron-zen/vanilla')
```

:::

`cron-zen-vanilla.browser.js`：**单文件 IIFE**（内联 core）→ 全局 `window.CronZen`。更多 → [引入方式](/guide/import-styles)

## mountCronZen

```js
const api = mountCronZen('#app', {
  value: '',           // 空 = 不注入默认
  debounceMs: 0,
  nextCount: 10,
  showPreview: true,
  onChange(expr, state) {
    console.log(expr, state)
  },
})

api.getValue()
api.setValue('0 0 9 * * ?')
api.flush()
api.reset()
api.destroy()
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `value` | `''` | 初始表达式 |
| `onChange` | — | `(expression, state) => void` |
| `debounceMs` | `0` | 写回防抖 |
| `nextCount` | `10` | 近 N 次（≤100） |
| `showPreview` | `true` | 底部预览 |
| `weekFormat` | `'number'` | `'abbr'` 输出 MON…SAT |
| `timeZone` | 本地 | IANA 时区（近 N 次） |
| `locale` | `zh-CN` | `zh-CN` \| `en-US` |

## createCronZen

无 DOM，行为对齐 vue3 `useCronZen`：

```ts
import { createCronZen } from '@cron-zen/vanilla'

const ctrl = createCronZen({ debounceMs: 0 })
ctrl.updateField('hour', { mode: 'specific', raw: '8', value: '8' })
console.log(ctrl.getSnapshot().expression) // * * 8 * * ?
ctrl.destroy()
```

## 与 Vue 包

| | vanilla | vue3 / vue2 |
| --- | --- | --- |
| 运行时 | 浏览器 DOM | Vue 3 / 2.7 |
| 挂载 | `mountCronZen(el)` | `<CronZen />` |
| 无头 | `createCronZen` | `useCronZen` |
| 引擎 | 均依赖 `@cron-zen/core` | 同左 |
