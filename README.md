# cron-zen

可嵌入的 Cron 引擎（Quartz / cron.ren 风格）· Vue 可视化可选 · **不绑定 UI 库**。

[![npm core](https://img.shields.io/npm/v/@cron-zen/core.svg?label=%40cron-zen%2Fcore)](https://www.npmjs.com/package/@cron-zen/core)
[![npm vue3](https://img.shields.io/npm/v/@cron-zen/vue3.svg?label=%40cron-zen%2Fvue3)](https://www.npmjs.com/package/@cron-zen/vue3)
[![license](https://img.shields.io/npm/l/@cron-zen/core.svg)](./LICENSE)

**文档**：[https://jaskon-io.github.io/cron-zen/](https://jaskon-io.github.io/cron-zen/)  
**Playground**：[在线体验](https://jaskon-io.github.io/cron-zen/guide/playground)

## 安装

```bash
pnpm add @cron-zen/vue3 @cron-zen/core
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

默认路径**不需要** Element Plus。跨 UI 库接法见 [任意 UI 库集成](https://jaskon-io.github.io/cron-zen/guide/any-ui)。

## Packages

| Package | Description | npm |
| --- | --- | --- |
| [`@cron-zen/core`](./packages/core) | 纯 TS：解析 / 生成 / 校验 | [@cron-zen/core](https://www.npmjs.com/package/@cron-zen/core) |
| [`@cron-zen/vue3`](./packages/vue3) | Vue 3 可视化 + composable | [@cron-zen/vue3](https://www.npmjs.com/package/@cron-zen/vue3) |
| [`@cron-zen/vue2`](./packages/vue2) | Vue 2 适配 | 暂不首发 |

## 本地开发

```bash
pnpm install
pnpm test
pnpm dev          # Playground
pnpm docs:dev     # 文档站
```

## License

[MIT](./LICENSE)
