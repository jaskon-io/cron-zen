# 引入方式与 Demo

<p class="cz-lead">
库用 TypeScript 开发，npm 产物同时提供 <strong>ESM（import）</strong> 与 <strong>CJS（require）</strong>。纯 JavaScript 项目无需改写为 TS；ES5 / ES6 / 现代打包器都能接。
</p>

## 产物一览

| 包 | `import`（ESM） | `require`（CJS） | 样式 |
| --- | --- | --- | --- |
| `@cron-zen/core` | `dist/index.js` | `dist/index.cjs` | 无 |
| `@cron-zen/vanilla` | `dist/cron-zen-vanilla.js` | `dist/cron-zen-vanilla.umd.cjs` | `style.css` |
| `@cron-zen/vue3` | `dist/cron-zen-vue3.js` | `dist/cron-zen-vue3.umd.cjs` | `style.css` |
| `@cron-zen/vue2` | `dist/cron-zen-vue2.mjs` | `dist/cron-zen-vue2.umd.cjs` | `style.css` |

`package.json` 的 `exports` 已配置：`import` → ESM，`require` → CJS。一般**不必**手写 dist 路径。

---

## 1. ES Module（推荐 · ES6+）

适用于 Vite、Webpack 5、Node `"type": "module"`、现代浏览器 `<script type="module">`。

::: code-group

```js [core · ESM]
import {
  parseCron,
  generateCron,
  describeCron,
  getNextRuns,
  formatRunTime,
} from '@cron-zen/core'

const { success, state } = parseCron('0 0/5 * * * ?')
if (success) {
  console.log(describeCron(state, { locale: 'zh-CN' }))
  const runs = getNextRuns(state, 3, new Date(), { timeZone: 'Asia/Shanghai' })
  console.log(runs.map((d) => formatRunTime(d, { timeZone: 'Asia/Shanghai' })))
}
```

```js [vanilla · ESM]
import { mountCronZen } from '@cron-zen/vanilla'
import '@cron-zen/vanilla/style.css'

const api = mountCronZen('#cron', {
  value: '',
  locale: 'zh-CN',
  onChange(expr) {
    document.querySelector('#out').textContent = expr
  },
})

// 业务侧读写
api.setValue('0 0 9 * * ?')
console.log(api.getValue())
// 页面销毁时
// api.destroy()
```

```js [vue3 · ESM]
import { createApp, ref, h } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

createApp({
  setup() {
    const cron = ref('')
    return () => h(CronZen, {
      modelValue: cron.value,
      'onUpdate:modelValue': (v) => { cron.value = v },
      locale: 'en-US',
    })
  },
}).mount('#app')
```

```js [vue2 · ESM]
import Vue from 'vue'
import { CronZen } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'

new Vue({
  el: '#app',
  components: { CronZen },
  data: () => ({ cron: '' }),
  template: '<cron-zen v-model="cron" />',
})
```

:::

---

## 2. CommonJS（`require`）

适用于旧 Node、部分 Webpack、未开 ESM 的脚本。

::: code-group

```js [core · require]
const {
  parseCron,
  generateCron,
  createDefaultCronState,
} = require('@cron-zen/core')

const parsed = parseCron('0 0 9 * * ?')
const generated = generateCron(createDefaultCronState())
console.log(parsed.success, generated.expression)
```

```js [vanilla · require]
// Node 里通常配合 jsdom / 打包进浏览器包使用
const { createCronZen } = require('@cron-zen/vanilla')

const ctrl = createCronZen({ debounceMs: 0, locale: 'en-US' })
ctrl.updateField('hour', { mode: 'specific', raw: '8', value: '8' })
console.log(ctrl.getSnapshot().expression) // * * 8 * * ?
ctrl.destroy()
```

```js [vue3 · require]
const { CronZen, useCronZen } = require('@cron-zen/vue3')
// 样式仍建议在入口 import / 由构建器处理 css
```

```js [vue2 · require]
const Vue = require('vue')
const { CronZenPlugin } = require('@cron-zen/vue2')
require('@cron-zen/vue2/style.css')

Vue.use(CronZenPlugin)
```

:::

---

## 3. 偏 ES5 风格的业务代码

库本身是 ES2015+ 产物；业务侧仍可用 `var` / `function` 写法调用（由 Babel / 构建器转译你的代码即可）。

```js
var core = require('@cron-zen/core')
var parseCron = core.parseCron
var getNextRuns = core.getNextRuns
var formatRunTime = core.formatRunTime

function previewNext(expr, tz) {
  var res = parseCron(expr)
  if (!res.success) return []
  var runs = getNextRuns(res.state, 5, new Date(), { timeZone: tz || undefined })
  return runs.map(function (d) {
    return formatRunTime(d, { timeZone: tz || undefined })
  })
}

module.exports = { previewNext }
```

浏览器无打包、又要尽量兼容时，优先用 **UMD**（`vanilla` / `vue*` 的 `.umd.cjs`）+ 构建工具，或 CDN ESM（现代浏览器）。

---

## 4. 浏览器 `<script>` 直引（推荐纯 HTML）

不需要打包器、不需要 `type="module"`。用 **browser 单文件**（已内联 `core`），挂到全局 `window.CronZen`。

**复制即用整页**（中英切换）：部署后打开 [examples/script-tag.html](/examples/script-tag.html)，或本仓库 `docs/public/examples/script-tag.html`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>cron-zen · script 直引</title>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.css"
  />
</head>
<body>
  <div id="cron"></div>
  <pre id="out"></pre>

  <!-- 一个 JS 即可（内含 core） -->
  <script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.browser.js"></script>
  <script>
    // 全局：CronZen.mountCronZen / createCronZen / parseCron / …
    var api = CronZen.mountCronZen('#cron', {
      value: '',
      locale: 'zh-CN',
      onChange: function (expr) {
        document.getElementById('out').textContent = expr
      },
    })
  </script>
</body>
</html>
```

| 文件 | 说明 |
| --- | --- |
| `cron-zen-vanilla.browser.js` | **IIFE 单文件**，内联 core，≈40KB；`unpkg` / `jsdelivr` 默认入口 |
| `cron-zen-vanilla.css` | 样式（必引） |

本地相对路径同样：

```html
<link rel="stylesheet" href="./cron-zen-vanilla.css" />
<script src="./cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen(document.getElementById('cron'), { value: '' })
</script>
```

## 5. 浏览器 CDN · ESM（`type="module"`）

适合已用 ESM 的页面：

::: code-group

```html [vanilla · CDN ESM]
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.css"
/>
<script type="module">
  import { mountCronZen } from 'https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/+esm'

  mountCronZen('#cron', {
    value: '',
    onChange: function (expr) {
      document.getElementById('out').textContent = expr
    },
  })
</script>
```

```html [core · CDN ESM]
<script type="module">
  import { parseCron, describeCron } from 'https://cdn.jsdelivr.net/npm/@cron-zen/core@0.2.0/+esm'

  var res = parseCron('0 0 9 ? * MON-FRI')
  if (res.success) {
    console.log(describeCron(res.state, { locale: 'zh-CN' }))
  }
</script>
```

:::

---

## 6. TypeScript 与 JavaScript

| | TypeScript | JavaScript |
| --- | --- | --- |
| 类型 | 自带 `.d.ts`，IDE 提示完整 | 可忽略类型，API 相同 |
| 写法 | `import { … } from '…'` | 同上，或 `require` |
| 推荐 | Vue SFC / Vite TS | 老项目、脚本、CDN Demo |

不必为了用 cron-zen 把整仓改成 TypeScript。

---

## 7. 选包 + 引入速查

| 场景 | 包 | 典型引入 |
| --- | --- | --- |
| 纯 HTML `<script>` | `vanilla` browser | `<script src="…browser.js">` → `CronZen.mountCronZen` |
| 无 Vue 可视化（打包） | `vanilla` | `import { mountCronZen } from '@cron-zen/vanilla'` |
| Vue 2 | `vue2` | `import { CronZen } from '@cron-zen/vue2'` |
| Vue 3 | `vue3` | `import { CronZen } from '@cron-zen/vue3'` |
| Node 校验 | `core` | `const { parseCron } = require('@cron-zen/core')` |

选包细节 → [选哪个包](./choose-package)
