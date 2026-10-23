# cron-zen

可嵌入的 Cron 引擎（Quartz / cron.ren 风格）。当前 **npm latest：0.1.4**。

| 包 | 给谁用 |
| --- | --- |
| **`@cron-zen/core`** | **任意运行时**（原生 JS / Node / 非 Vue）— 解析 / 生成 / 校验 / 自然语言 / 近 N 次 |
| **`@cron-zen/vue3`** | **仅 Vue 3** — `CronZen` / `useCronZen`；**默认不绑** Element / Ant |

[![npm core](https://img.shields.io/npm/v/@cron-zen/core.svg?label=%40cron-zen%2Fcore)](https://www.npmjs.com/package/@cron-zen/core)
[![npm vue3](https://img.shields.io/npm/v/@cron-zen/vue3.svg?label=%40cron-zen%2Fvue3)](https://www.npmjs.com/package/@cron-zen/vue3)
[![license](https://img.shields.io/npm/l/@cron-zen/core.svg)](./LICENSE)

**文档**：[选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package) · [站点](https://jaskon-io.github.io/cron-zen/) · [Playground](https://jaskon-io.github.io/cron-zen/guide/playground)  
**更新日志**：[CHANGELOG.md](./CHANGELOG.md) · [Releases](https://github.com/jaskon-io/cron-zen/releases)

### 0.1.3 能力速览

- 近 N 次：日 `L` / `LW` / `nW`，周 `nL` / `n#m` / 裸 `L`，倒序区间回绕
- Vue3：日「本月最后一个工作日」、月格子「1月」…「12月」
- `CronZenPicker` 仅为 Element **可选示例**；插件只注册 `CronZen`

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
| [`@cron-zen/vue2`](./packages/vue2) | Vue 2.7 | 能力对齐中（workspace 可用，暂不 npm 首发） |

## 本地开发

```bash
pnpm install
pnpm test
pnpm dev          # Playground
pnpm docs:dev     # 文档站
```

## License

[MIT](./LICENSE)
