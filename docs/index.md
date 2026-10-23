---
layout: home

hero:
  name: cron-zen
  text: 可嵌入的 Cron 引擎
  tagline: 无框架用 vanilla · React 用 react · Vue2/3 各用各的 · core 任意运行时 · JS/TS · ESM/CJS
  actions:
    - theme: brand
      text: 选哪个包
      link: /guide/choose-package
    - theme: alt
      text: 引入方式
      link: /guide/import-styles
    - theme: alt
      text: Playground
      link: /guide/playground
  image:
    src: /logo.svg
    alt: cron-zen

features:
  - title: 无框架 → vanilla
    details: 没有 Vue / React？用 @cron-zen/vanilla 的 mountCronZen，纯 DOM，TS/JS 均可。
  - title: React / Vue 各用各的
    details: '@cron-zen/react（18/19）薄封装 vanilla；vue2 / vue3 对齐同一套 Cron 行为。'
  - title: JS · require · ESM 都支持
    details: 源码 TypeScript，产物 ESM + CJS。纯 JS、require、import、CDN Demo 都有文档。
  - title: 业务可嵌入且可测
    details: 日周互斥、近 N 次、时区、i18n；Vitest 含压测 / 韧性 / 卸载清理。见「质量与安全」。
---

<div class="cz-home-install">

## 先选对包

| 环境 | 可视化 | 只要引擎 |
| --- | --- | --- |
| **无框架**（原生 HTML 等） | `@cron-zen/vanilla` | `@cron-zen/core` |
| **React 18/19** | `@cron-zen/react` | `@cron-zen/core` |
| **Vue 2.7** | `@cron-zen/vue2` | `@cron-zen/core` |
| **Vue 3** | `@cron-zen/vue3` | `@cron-zen/core` |

完整对照：[选哪个包](/guide/choose-package) · [引入方式](/guide/import-styles) · [质量与安全](/guide/quality)

## 30 秒 Demo

::: code-group

```html [vanilla · script 直引]
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.4/dist/cron-zen-vanilla.css" />
<script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.4/dist/cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen('#cron', { value: '', onChange: console.log })
</script>
```

```tsx [react]
import { useState } from 'react'
import { CronZen } from '@cron-zen/react'
import '@cron-zen/react/style.css'
export function App() {
  const [cron, setCron] = useState('')
  return <CronZen value={cron} onChange={setCron} />
}
```

```vue [vue3]
<script setup>
import { ref } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'
const cron = ref('')
</script>
<template>
  <CronZen v-model="cron" />
</template>
```

```vue [vue2]
<template>
  <cron-zen v-model="cron" />
</template>
<script>
import { CronZen } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'
export default {
  components: { CronZen },
  data: () => ({ cron: '' }),
}
</script>
```

```js [core · require]
const { parseCron } = require('@cron-zen/core')
console.log(parseCron('0 0 9 * * ?'))
```

:::

下一步：[快速开始](/guide/quick-start) · [API](/api/core)

</div>
