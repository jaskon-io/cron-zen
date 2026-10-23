---
layout: home

hero:
  name: cron-zen
  text: 可嵌入的 Cron 引擎
  tagline: core 任意运行时 · vue3 仅 Vue 3 · 不绑定 Element/Ant 等 UI 库 · 对齐 Quartz / cron.ren
  actions:
    - theme: brand
      text: 选哪个包
      link: /guide/choose-package
    - theme: alt
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: Playground
      link: /guide/playground
  image:
    src: /logo.svg
    alt: cron-zen

features:
  - title: core = 原生 / 任意运行时
    details: '@cron-zen/core 纯 TypeScript，无 Vue、无 UI 库。Node、脚本、非 Vue 前端都能用解析与生成。'
  - title: vue3 = 只给 Vue 3
    details: '@cron-zen/vue3 提供 CronZen / useCronZen。包名里的 vue3 表示适配层，不是「无 Vue 也能跑组件」。'
  - title: UI 库可换
    details: 不绑定 Element / Ant。弹窗可用原生 dialog、Naive、自研壳；Picker 仅为 Element 可选示例。
  - title: 行为可预期
    details: 年省略、日周互斥、周数字 / abbr、倒序区间等对齐 cron.ren / Quartz 主路径。
---

<div class="cz-home-install">

## 先选对包

| 环境 | 安装 |
| --- | --- |
| 无 Vue（Node / 原生 JS / 其它框架） | `pnpm add @cron-zen/core` |
| Vue 3 要可视化 | `pnpm add @cron-zen/vue3 @cron-zen/core vue` |

完整对照：[选哪个包](/guide/choose-package)

## 安装（Vue 3 可视化）

::: code-group

```bash [pnpm]
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```bash [npm]
npm install @cron-zen/vue3 @cron-zen/core vue
```

```bash [yarn]
yarn add @cron-zen/vue3 @cron-zen/core vue
```

:::

::: tip 两件容易混的事
1. **不需要 Element Plus**（除非用 `CronZenPicker`）。  
2. **需要 Vue 3**：`@cron-zen/vue3` 里的组件不能在无 Vue 的纯 HTML 里直接用；那种场景请用 [`@cron-zen/core`](/api/core)。
:::

## 30 秒上手（Vue 3）

```vue
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

下一步：[选哪个包](/guide/choose-package) · [快速开始](/guide/quick-start) · [任意 UI 库集成](/guide/any-ui)

</div>
