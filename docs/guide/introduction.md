# 介绍

<p class="cz-lead">
cron-zen 是可嵌入的 Cron 能力库：<strong>无 Vue 用 vanilla</strong>，<strong>Vue2 用 vue2</strong>，<strong>Vue3 用 vue3</strong>；只要引擎用 <strong>core</strong>。源码 TypeScript，产物支持 JS / ESM / CJS。不绑定 Element / Ant。
</p>

## 你会得到什么

| 能力 | 来自哪 | 说明 |
| --- | --- | --- |
| 解析 / 生成 / 校验 | `core` | 5 / 6 / 7 段；年不指定 → 6 段 |
| 自然语言 / 近 N 次 | `core` | 无 UI |
| 三段式编辑器（无框架） | `vanilla` | `mountCronZen`，只要浏览器 DOM |
| 三段式编辑器 / 状态机 | `vue3` / `vue2` | 需要对应 Vue 运行时 |
| 弹窗外壳 | 你的技术栈 | 原生 dialog、Ant、Naive…可换 |
| Element 官方壳 | `vue3` 的 `CronZenPicker` | 可选，不是前提 |

## 包一览

| 包 | 运行时要求 | 职责 | 状态 |
| --- | --- | --- | --- |
| [`@cron-zen/core`](https://www.npmjs.com/package/@cron-zen/core) | 任意 JS（浏览器 / Node） | 引擎 | 已发布 |
| [`@cron-zen/vanilla`](https://www.npmjs.com/package/@cron-zen/vanilla) | 浏览器 DOM | 无框架可视化 | 已发布 |
| [`@cron-zen/vue3`](https://www.npmjs.com/package/@cron-zen/vue3) | **Vue 3** | 组件与 composable | 已发布 |
| [`@cron-zen/vue2`](https://www.npmjs.com/package/@cron-zen/vue2) | **Vue 2.7** | 组件与 composable | 已发布 |

不确定装哪个？→ [选哪个包](./choose-package)

## 架构

```text
@cron-zen/core                 ← 引擎（原生可用）
        │
   ┌────┼────┐
vanilla vue3 vue2              ← 可视化适配（DOM / Vue）
        │
业务壳（可换）
  <dialog> / Ant Modal / Naive / CronZenPicker(Element，仅 vue3)
```

::: tip 差异化
「可嵌入任意页面架构」= **引擎（core）** 与 **可视化适配 / 弹层壳** 可换。  
包名标明运行时：`vanilla` 无框架，`vue3` / `vue2` 需对应 Vue。
:::

## 对比

| | cron-zen | 纯输入框 | 外链 cron.ren |
| --- | --- | --- | --- |
| 嵌进业务表单 | 支持 | 易写错 | 难联动 |
| 不绑 UI 库 | 支持 | — | — |
| Quartz / 日周互斥 | 内置 | 无 | 有 |
| 无 Vue 也能用引擎 | `@cron-zen/core` | — | 无 |
| 主题 | CSS 变量 | — | 无 |

行为细则见 [与 cron.ren 对照](./vs-cron-ren)。接法见 [任意 UI 库集成](./any-ui)。

## 设计约束

1. **引擎优先**：`core` 可单测，可在非 Vue 环境复用。
2. **适配层名副其实**：需要组件就用 `vue3`；需要引擎就用 `core`。
3. **UI 库是插件**：不安装 Element 也能用 `CronZen`。
4. **空值不偷写**：`v-model === ''` 时不注入默认表达式。
5. **容错**：非标准输入尽量降级，不拖垮宿主页面。

## 下一步

- [选哪个包](./choose-package)
- [快速开始](./quick-start)
- [任意 UI 库集成](./any-ui)
- [Playground](./playground)
