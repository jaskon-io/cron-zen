# 选哪个包

<p class="cz-lead">
名字里的 <code>vue3</code> 只表示「Vue 3 适配层」。没有 Vue 的原生页面 / Node 服务请用 <code>@cron-zen/core</code>，不要指望 <code>@cron-zen/vue3</code> 在无 Vue 环境里跑组件。
</p>

## 一句话对照

| 你的环境 | 该装什么 | 能得到什么 | 得不到什么 |
| --- | --- | --- | --- |
| 纯 JS / TS、Node、脚本、非 Vue 前端 | **`@cron-zen/core`** | 解析、生成、校验、描述、近 N 次 | 现成可视化组件 |
| Vue 3 应用 | **`@cron-zen/vue3`**（通常再带上 core） | `CronZen` / `useCronZen` 等 | — |
| Vue 3 + 已有 Element Plus | 同上，可选再用 `CronZenPicker` | 官方 Element 弹窗壳 | — |
| Vue 2.7 应用 | **`@cron-zen/vue2`**（再带上 core） | `CronZen` / `useCronZen` | Element Picker（仅 vue3） |
| 无框架的「纯 HTML 页」想嵌完整点选 UI | 目前：**core + 自绘**；或上 Vue 后再用 vue3/vue2 | 引擎能力 | 现成 `CronZen` 组件（它依赖 Vue 运行时） |

::: tip 命名没有误导
`@cron-zen/vue3` = **给 Vue 3 用的适配包**，一看就知道要 Vue——这是刻意的。  
「原生也能用」指的是 **`@cron-zen/core`**，不是把 `vue3` 包拿到无 Vue 页面里用。
:::

## 两层分别是什么

```text
┌─────────────────────────────────────┐
│  @cron-zen/core                     │  ← 纯 TypeScript，零 UI、零框架
│  parse / generate / validate / …    │
└─────────────────┬───────────────────┘
                  │ 被依赖
        ┌─────────┴─────────┐
┌───────▼───────┐   ┌───────▼───────┐
│ @cron-zen/vue3│   │ @cron-zen/vue2│
│ Vue 3         │   │ Vue 2.7       │
└───────────────┘   └───────────────┘
```

| 概念 | 说明 |
| --- | --- |
| **引擎** | `core`：字符串 ↔ 状态、校验、预览计算 |
| **可视化适配** | `vue3` / `vue2`：把引擎接到对应 Vue 的组件 / composable |
| **业务壳** | 你的 `<dialog>` / Ant Modal / 自研抽屉——**不属于** cron-zen 包名 |

## 常见误解

| 误解 | 事实 |
| --- | --- |
| 「文档里用了原生 `<dialog>`，所以 vue3 包能在纯 HTML 用」 | 示例仍是 **`<script setup>` 的 Vue SFC**；`<dialog>` 只是弹层标签，宿主仍是 Vue 应用 |
| 「不绑 UI 库 = 不需要 Vue」 | 不绑的是 **Element/Ant 等组件库**；`CronZen` 本身仍是 Vue 组件 |
| 「只要 core 就有点选界面」 | core **没有** UI；点选界面来自 `CronZen` 或你自绘 |
| 「装了 vue3 还必须装 Element」 | 否。仅 `CronZenPicker` 需要 |

## 按场景选

### 1. Node / 脚本 / 校验接口

```bash
pnpm add @cron-zen/core
```

```ts
import { parseCron, generateCron } from '@cron-zen/core'
```

→ 详见 [API · core](/api/core)

### 2. Vue 3 后台配置页

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```vue
<script setup lang="ts">
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'
</script>
```

→ 详见 [快速开始](./quick-start)

### 3. Vue 3，但弹窗想用原生 / Ant / Naive

仍然安装 **`@cron-zen/vue3`**，弹层用你的壳，内部放 `<CronZen />`。

→ 详见 [任意 UI 库集成](./any-ui)

### 4. Vue 2.7 后台

```bash
pnpm add @cron-zen/vue2 @cron-zen/core vue@2.7
```

```js
import Vue from 'vue'
import { CronZenPlugin } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'

Vue.use(CronZenPlugin)
```

→ 详见 [API · vue2](/api/vue2)

### 5. 将来：无框架可视化

若需要「纯 HTML 也能挂一个点选组件」，那是后续可能的 **`@cron-zen/vanilla` / Web Component** 方向，与当前 vue 适配包职责不同。现在请用 core + 自绘，或引入 Vue。

## 下一步

- [介绍](./introduction)
- [快速开始](./quick-start)
- [任意 UI 库集成](./any-ui)
- [API · vue2](/api/vue2)
