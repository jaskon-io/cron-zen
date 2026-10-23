---
layout: home

hero:
  name: cron-zen
  text: 可嵌入的 Cron 引擎
  tagline: 纯 TypeScript 核心 · 不绑定 UI 库 · 对齐 Quartz / cron.ren · Vue 适配可选
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 任意 UI 集成
      link: /guide/any-ui
    - theme: alt
      text: Playground
      link: /guide/playground
  image:
    src: /logo.svg
    alt: cron-zen

features:
  - title: 引擎优先
    details: '@cron-zen/core 零框架依赖。解析、生成、校验、自然语言与近 N 次，可在 Node 与浏览器复用。'
  - title: UI 库可换
    details: CronZen / useCronZen 不依赖 Element。弹窗与表单用 Ant、Naive、自研壳均可承载。
  - title: 行为可预期
    details: 年省略、日周互斥、周数字 / abbr、倒序区间等对齐 cron.ren / Quartz 主路径。
  - title: 工程可用
    details: ESM + CJS、完整类型声明、Vitest 覆盖、MIT。npm 直接安装，文档与 Playground 开箱可试。
---

<div class="cz-home-install">

<div class="cz-badges">
  <a href="https://www.npmjs.com/package/@cron-zen/core"><img src="https://img.shields.io/npm/v/@cron-zen/core.svg?label=%40cron-zen%2Fcore" alt="npm core" /></a>
  <a href="https://www.npmjs.com/package/@cron-zen/vue3"><img src="https://img.shields.io/npm/v/@cron-zen/vue3.svg?label=%40cron-zen%2Fvue3" alt="npm vue3" /></a>
  <a href="https://github.com/jaskon-io/cron-zen/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cron-zen/core.svg" alt="MIT" /></a>
  <a href="https://github.com/jaskon-io/cron-zen"><img src="https://img.shields.io/github/stars/jaskon-io/cron-zen?style=social" alt="stars" /></a>
</div>

## 安装

::: code-group

```bash [pnpm]
pnpm add @cron-zen/vue3 @cron-zen/core
```

```bash [npm]
npm install @cron-zen/vue3 @cron-zen/core
```

```bash [yarn]
yarn add @cron-zen/vue3 @cron-zen/core
```

:::

::: tip 不需要 Element Plus
默认使用 `CronZen` 或 `useCronZen` 即可。仅当使用官方 `CronZenPicker` 示例壳时才安装 `element-plus`。
:::

## 30 秒上手

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

下一步：[快速开始](/guide/quick-start) · [任意 UI 库集成](/guide/any-ui) · [API](/api/vue3)

</div>
