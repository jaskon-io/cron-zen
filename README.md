# cron-zen

可嵌入的 Cron 引擎（Quartz / cron.ren 风格）。

| 包 | 给谁用 |
| --- | --- |
| **`@cron-zen/core`** | **任意运行时**（原生 JS / Node / 非 Vue）— 解析生成校验 |
| **`@cron-zen/vue3`** | **仅 Vue 3** — `CronZen` 等组件；不绑 Element/Ant |

[![npm core](https://img.shields.io/npm/v/@cron-zen/core.svg?label=%40cron-zen%2Fcore)](https://www.npmjs.com/package/@cron-zen/core)
[![npm vue3](https://img.shields.io/npm/v/@cron-zen/vue3.svg?label=%40cron-zen%2Fvue3)](https://www.npmjs.com/package/@cron-zen/vue3)
[![license](https://img.shields.io/npm/l/@cron-zen/core.svg)](./LICENSE)

**文档**：[选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package) · [站点](https://jaskon-io.github.io/cron-zen/) · [Playground](https://jaskon-io.github.io/cron-zen/guide/playground)  
**更新日志**：[CHANGELOG.md](./CHANGELOG.md)

## 安装

```bash
# 无 Vue / 只要引擎
pnpm add @cron-zen/core

# Vue 3 可视化（需要 vue）
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

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

默认**不需要** Element Plus。弹层可用原生 `<dialog>` / Ant / Naive（仍在 Vue 应用内）：[任意 UI 库集成](https://jaskon-io.github.io/cron-zen/guide/any-ui)。

## Packages

| Package | Runtime | npm |
| --- | --- | --- |
| [`@cron-zen/core`](./packages/core) | 任意 JS | [@cron-zen/core](https://www.npmjs.com/package/@cron-zen/core) |
| [`@cron-zen/vue3`](./packages/vue3) | Vue 3 | [@cron-zen/vue3](https://www.npmjs.com/package/@cron-zen/vue3) |
| [`@cron-zen/vue2`](./packages/vue2) | Vue 2 | 暂不首发 |

## 本地开发

```bash
pnpm install
pnpm test
pnpm dev          # Playground
pnpm docs:dev     # 文档站
```

## License

[MIT](./LICENSE)
