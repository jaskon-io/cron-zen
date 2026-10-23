# 选哪个包

<p class="cz-lead">
三步定包：先看有没有 Vue，再看要不要可视化。源码是 TypeScript，但产物同时提供 <strong>ESM / CJS</strong>，纯 JS 项目、 <code>require</code> / <code>import</code> 都能用。
</p>

## 决策（先看这一张）

| 你的项目 | 可视化编辑器装什么 | 只要引擎（无 UI） |
| --- | --- | --- |
| **原生 HTML / jQuery / 其它 / Node**（无 React、无 Vue） | **`@cron-zen/vanilla`** | `@cron-zen/core` |
| **有 React 18/19** | **`@cron-zen/react`**（底层 vanilla） | `@cron-zen/core` |
| **有 Vue 2.7** | **`@cron-zen/vue2`** | `@cron-zen/core` |
| **有 Vue 3** | **`@cron-zen/vue3`** | `@cron-zen/core` |

::: tip 记牢
- **无 UI 框架、无 Vue / React，又要点选 Cron** → 用 **`vanilla`**。  
- **有 React** → **`react`**；**有 Vue 2** → **`vue2`**；**有 Vue 3** → **`vue3`**。  
- **只要解析 / 生成 / 校验 / 近 N 次**（脚本、接口）→ 只装 **`core`**。
:::

## 安装对照

::: code-group

```bash [无框架 · vanilla]
pnpm add @cron-zen/vanilla @cron-zen/core
```

```bash [React 18/19]
pnpm add @cron-zen/react @cron-zen/vanilla @cron-zen/core react react-dom
```

```bash [Vue 2.7]
pnpm add @cron-zen/vue2 @cron-zen/core vue@2.7
```

```bash [Vue 3]
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```bash [仅引擎]
pnpm add @cron-zen/core
```

:::

## 架构

```text
┌─────────────────────────────────────┐
│  @cron-zen/core                     │  ← 纯逻辑，任意 JS/TS 运行时
│  parse / generate / validate / …    │
└─────────────────┬───────────────────┘
                  │ 被依赖
     ┌────────────┼────────────────────────┐
┌────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌───▼───┐
│ vanilla │  │  react  │  │  vue2   │  │ vue3  │
│ 无框架  │  │ 18 / 19 │  │ Vue 2.7 │  │ Vue 3 │
│ 纯 DOM  │  │→vanilla │  │         │  │       │
└─────────┘  └─────────┘  └─────────┘  └───────┘
```

| 概念 | 说明 |
| --- | --- |
| **引擎** | `core`：字符串 ↔ 状态、校验、描述、近 N 次、时区、i18n |
| **可视化** | `vanilla` / `react` / `vue2` / `vue3`：接到 DOM 或框架 |
| **业务壳** | 你的 dialog / Modal / 抽屉——**不属于**包名 |

## 常见误解

| 误解 | 事实 |
| --- | --- |
| 「无 Vue 也能用 `@cron-zen/vue3` 组件」 | 否。无 Vue 可视化请用 **`vanilla`**；有 React 用 **`react`** |
| 「不绑 UI 库 = 不需要 Vue」 | 不绑的是 Element/Ant；`vue3` 包本身仍要 Vue 3 |
| 「只要 core 就有点选界面」 | core **没有** UI；点选来自 `vanilla` / `react` / `vue2` / `vue3` |
| 「只有 TypeScript 能用」 | 否。产物含 **ESM + CJS**，纯 JS / `require` 可用，见 [引入方式](./import-styles) |

## 场景 Demo（升华）

### A. 无框架页面 → vanilla

**纯 HTML（`<script>` 直引，最省事）**：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.4/dist/cron-zen-vanilla.css" />
<div id="cron"></div>
<script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.4/dist/cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen('#cron', {
    value: '',
    locale: 'zh-CN',
    onChange: function (expr) { console.log(expr) },
  })
</script>
```

打包器（Vite / Webpack）：

```js
import { mountCronZen } from '@cron-zen/vanilla'
import '@cron-zen/vanilla/style.css'

mountCronZen(document.getElementById('cron'), {
  value: '',
  onChange: (expr) => { /* 写入表单 */ },
})
```

### B. Vue 2.7 → vue2

```vue
<template>
  <cron-zen v-model="cron" locale="zh-CN" time-zone="Asia/Shanghai" />
</template>

<script>
import { CronZen } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'

export default {
  components: { CronZen },
  data() {
    return { cron: '' }
  },
}
</script>
```

### C. Vue 3 → vue3

```vue
<script setup>
import { ref } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

const cron = ref('')
</script>

<template>
  <CronZen v-model="cron" locale="en-US" time-zone="UTC" />
</template>
```

### D. 只要引擎 → core（Node / 接口）

```js
// ESM
import { parseCron, generateCron, getNextRuns, formatRunTime } from '@cron-zen/core'

// 或 CJS
// const { parseCron } = require('@cron-zen/core')

const res = parseCron('0 0 9 * * ?')
if (res.success) {
  const runs = getNextRuns(res.state, 5, new Date(), { timeZone: 'Asia/Shanghai' })
  console.log(runs.map((d) => formatRunTime(d, { timeZone: 'Asia/Shanghai' })))
}
```

更多引入写法（`require` / ESM / 浏览器）→ [引入方式与 Demo](./import-styles)

## 质量与可信度

引擎与适配层均有 Vitest 覆盖（含压测、韧性、非法输入、卸载清理）。说明见 [质量与安全](./quality)。

## 下一步

- [引入方式与 Demo](./import-styles)
- [快速开始](./quick-start)
- [质量与安全](./quality)
- [API · vanilla](/api/vanilla) · [vue2](/api/vue2) · [vue3](/api/vue3) · [core](/api/core)
