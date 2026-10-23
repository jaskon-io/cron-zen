# 快速开始

<p class="cz-lead">
按运行时选包：无框架 → <strong>vanilla</strong>；React → <strong>react</strong>；Vue 2 → <strong>vue2</strong>；Vue 3 → <strong>vue3</strong>。只要引擎 → <strong>core</strong>。支持 TypeScript 与纯 JavaScript（ESM / CJS）。
</p>

完整对照 → [选哪个包](./choose-package) · 引入写法 → [引入方式与 Demo](./import-styles) · [纯 HTML 示例页](/examples/script-tag.html)

## 1. 无框架 → `@cron-zen/vanilla`

```bash
pnpm add @cron-zen/vanilla @cron-zen/core
```

::: code-group

```html [script 直引 · 纯 HTML]
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.css" />
<script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen('#cron', {
    value: '',
    locale: 'zh-CN',
    onChange: function (expr) { console.log(expr) },
  })
</script>
```

```js [ESM · 打包器]
import { mountCronZen } from '@cron-zen/vanilla'
import '@cron-zen/vanilla/style.css'

mountCronZen('#cron', {
  value: '',
  locale: 'zh-CN',
  timeZone: 'Asia/Shanghai',
  onChange(expr) { console.log(expr) },
})
```

```js [CJS · require]
const { createCronZen } = require('@cron-zen/vanilla')

const ctrl = createCronZen({ debounceMs: 0 })
ctrl.updateField('hour', { mode: 'specific', raw: '9', value: '9' })
console.log(ctrl.getSnapshot().expression)
ctrl.destroy()
```

:::

API → [vanilla](/api/vanilla)

## 2. React 18/19 → `@cron-zen/react`

```bash
pnpm add @cron-zen/react @cron-zen/vanilla @cron-zen/core react react-dom
```

```tsx
import { useState } from 'react'
import { CronZen } from '@cron-zen/react'
import '@cron-zen/react/style.css'

export function App() {
  const [cron, setCron] = useState('')
  return (
    <CronZen
      value={cron}
      onChange={(expr) => setCron(expr)}
      locale="zh-CN"
    />
  )
}
```

API → [react](/api/react)

## 3. Vue 2.7 → `@cron-zen/vue2`

```bash
pnpm add @cron-zen/vue2 @cron-zen/core vue@2.7
```

```vue
<template>
  <cron-zen v-model="cron" locale="zh-CN" />
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

API → [vue2](/api/vue2)

## 4. Vue 3 → `@cron-zen/vue3`

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

::: code-group

```vue [SFC · TS]
<script setup lang="ts">
import { ref } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

const cron = ref('')
</script>

<template>
  <CronZen v-model="cron" />
</template>
```

```vue [SFC · JS]
<script setup>
import { ref } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

const cron = ref('')
</script>

<template>
  <CronZen v-model="cron" locale="en-US" />
</template>
```

:::

::: info 默认输出
配置重置后为 **6 段** `* * * * * ?`。年「不指定」不会强行补第 7 段 `*`。空 `v-model` 不注入默认表达式。
:::

API → [vue3](/api/vue3)

## 5. 只要引擎 → `@cron-zen/core`

```bash
pnpm add @cron-zen/core
```

::: code-group

```js [import]
import { parseCron, generateCron, createDefaultCronState } from '@cron-zen/core'

const parsed = parseCron('0 0/5 * * * ?')
const generated = generateCron(createDefaultCronState())
```

```js [require]
const { parseCron, generateCron } = require('@cron-zen/core')
```

:::

## 弹窗 / 其它 UI 库

- **Vue 3 / React**：壳用 dialog / Modal，内嵌组件即可 → [任意 UI 库集成](./any-ui)
- **无框架**：`vanilla` 的 `mountCronZen` 挂到你的弹层 DOM 即可

## 可选：Element Plus Picker（仅 vue3）

仅当你**已经**使用 Element Plus：

```vue
<script setup>
import { ref } from 'vue'
import { CronZenPicker } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'
import 'element-plus/dist/index.css'

const cron = ref('')
</script>

<template>
  <CronZenPicker v-model="cron" readonly />
</template>
```

## 下一步

- [选哪个包](./choose-package)
- [引入方式与 Demo](./import-styles)
- [质量与安全](./quality)
- [Playground](./playground)
