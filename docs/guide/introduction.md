# 介绍

<p class="cz-lead">
cron-zen 是可嵌入的 Cron 能力库：<strong>@cron-zen/core</strong> 是任意运行时都能用的引擎；<strong>@cron-zen/vue3</strong> 是 Vue 3 专用可视化适配。不绑定 Element / Ant 等 UI 库——不等于「可以没有 Vue 还用 CronZen 组件」。
</p>

## 你会得到什么

| 能力 | 来自哪 | 说明 |
| --- | --- | --- |
| 解析 / 生成 / 校验 | `core` | 5 / 6 / 7 段；年不指定 → 6 段 |
| 自然语言 / 近 N 次 | `core` | 无 UI |
| 三段式编辑器 / 状态机 | `vue3` | **需要 Vue 3** |
| 弹窗外壳 | 你的技术栈 | 原生 dialog、Ant、Naive…可换 |
| Element 官方壳 | `vue3` 的 `CronZenPicker` | 可选，不是前提 |

## 包一览

| 包 | 运行时要求 | 职责 | 状态 |
| --- | --- | --- | --- |
| [`@cron-zen/core`](https://www.npmjs.com/package/@cron-zen/core) | 任意 JS（浏览器 / Node） | 引擎 | 已发布 |
| [`@cron-zen/vue3`](https://www.npmjs.com/package/@cron-zen/vue3) | **Vue 3** | 组件与 composable | 已发布 |
| `@cron-zen/vue2` | Vue 2 | 适配 | 暂不首发 |

不确定装哪个？→ [选哪个包](./choose-package)

## 架构

```text
@cron-zen/core                 ← 引擎（原生可用）
        │
@cron-zen/vue3                 ← 仅 Vue 3
  useCronZen / CronZen         ← 不强制 Element/Ant
        │
业务壳（可换，仍在 Vue 应用内）
  <dialog> / Ant Modal / Naive / CronZenPicker(Element)
```

::: tip 差异化
「可嵌入任意页面架构」= **引擎（core）** 与 **弹层/表单壳** 可换。  
`vue3` 包名表示适配层面向 Vue 3，避免装错包。
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
