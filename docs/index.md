---
layout: home

hero:
  name: cron-zen
  text: 可嵌入的 Cron 引擎
  tagline: 无 Vue 用 vanilla · Vue2 用 vue2 · Vue3 用 vue3 · core 任意运行时 · JS/TS · ESM/CJS
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
    details: 没有 Vue？用 @cron-zen/vanilla 的 mountCronZen，纯 DOM，TS/JS 均可。
  - title: Vue2 / Vue3 各用各的
    details: '@cron-zen/vue2 与 @cron-zen/vue3 对齐同一套 Cron 行为；不要把 vue3 装进 Vue2 工程。'
  - title: JS · require · ESM 都支持
    details: 源码 TypeScript，产物 ESM + CJS。纯 JS、require、import、CDN Demo 都有文档。
  - title: 业务可嵌入且可测
    details: 日周互斥、近 N 次、时区、i18n；Vitest 含压测 / 韧性 / 卸载清理。见「质量与安全」。
---

<div class="cz-home-install">

## 先选对包

| 环境 | 可视化 | 只要引擎 |
| --- | --- | --- |
| **无 Vue**（原生 / 其它框架） | `@cron-zen/vanilla` | `@cron-zen/core` |
| **Vue 2.7** | `@cron-zen/vue2` | `@cron-zen/core` |
| **Vue 3** | `@cron-zen/vue3` | `@cron-zen/core` |

完整对照：[选哪个包](/guide/choose-package) · [引入方式](/guide/import-styles) · [质量与安全](/guide/quality)

## 30 秒 Demo

::: code-group

```html [vanilla · script 直引]
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.css" />
<script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.2/dist/cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen('#cron', { value: '', onChange: console.log })
</script>
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
