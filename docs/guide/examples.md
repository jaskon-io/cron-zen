# 在线示例 Demo

<p class="cz-lead">
四个可视化包 + 引擎包各有一份可复制的 CDN 页面。打开即可试，无需本地打包。
</p>

| 包 | 在线 Demo | 说明 |
| --- | --- | --- |
| **`@cron-zen/vanilla`** | [examples/vanilla.html](/examples/vanilla.html) | 无框架 · `<script>` browser IIFE |
| **`@cron-zen/react`** | [examples/react.html](/examples/react.html) | React 18 · ESM import map |
| **`@cron-zen/vue2`** | [examples/vue2.html](/examples/vue2.html) | Vue 2.7 · ESM |
| **`@cron-zen/vue3`** | [examples/vue3.html](/examples/vue3.html) | Vue 3 · ESM |
| **`@cron-zen/core`** | [examples/core.html](/examples/core.html) | **只要引擎**：解析 / 描述 / next·prev / 模板 |

::: tip
- 可视化 Demo 均含「常用模板」与「近 N 次 / 近 N 次已触发」。  
- 旧链接 [`/examples/script-tag.html`](/examples/script-tag.html) 会跳转到 vanilla。  
- 本地 Playground（含 Element 弹窗示例）→ [Playground](./playground)
:::

## 只要引擎？先看这个

只装 `pnpm add @cron-zen/core` 时：

1. 打开 [core 在线 Demo](/examples/core.html) 感受主流程  
2. 再查 [API · @cron-zen/core](/api/core) —— 每个导出函数都有参数、返回值与示例

## 选包回顾

| 你的项目 | 可视化 | 只要引擎 |
| --- | --- | --- |
| 原生 HTML / 无框架 | [vanilla Demo](/examples/vanilla.html) | [core Demo](/examples/core.html) |
| React 18/19 | [react Demo](/examples/react.html) | 同上 |
| Vue 2.7 | [vue2 Demo](/examples/vue2.html) | 同上 |
| Vue 3 | [vue3 Demo](/examples/vue3.html) | 同上 |

完整决策表 → [选哪个包](./choose-package)
