# 介绍

<p class="cz-lead">
cron-zen 是可嵌入的 Cron 能力库：先提供可靠的 Quartz 风格引擎，再提供可选的 Vue 可视化外壳。目标是嵌进你已有的技术栈，而不是替换你的 UI 库。
</p>

## 你会得到什么

| 能力 | 说明 |
| --- | --- |
| 解析 / 生成 | 5 / 6 / 7 段 Cron，年「不指定」时输出 6 段 |
| 校验 | 日周互斥、非法日期（如 2 月 31 日）、范围检查 |
| 预览 | 自然语言描述、近 N 次触发时间 |
| Vue 可视化 | 三段式编辑器；或只用状态机自绘 UI |
| 嵌入方式 | 页面内嵌、任意 Dialog、可选 Element 壳 |

## 包一览

| 包 | 职责 | 状态 |
| --- | --- | --- |
| [`@cron-zen/core`](https://www.npmjs.com/package/@cron-zen/core) | 引擎（零框架） | 已发布 |
| [`@cron-zen/vue3`](https://www.npmjs.com/package/@cron-zen/vue3) | Vue 3 适配 | 已发布 |
| `@cron-zen/vue2` | Vue 2 适配 | 暂不首发 |

## 架构

```text
@cron-zen/core                 ← 引擎
        │
@cron-zen/vue3
  useCronZen / CronZen         ← 无强制 UI 库
        │
业务壳（可换）
  Ant / Naive / 自研 / CronZenPicker(Element)
```

::: tip 差异化
核心卖点是「Cron 引擎可嵌入任意页面架构」。Element Plus、Ant Design Vue 等只是承载层。
:::

## 对比

| | cron-zen | 纯输入框 | 外链 cron.ren |
| --- | --- | --- | --- |
| 嵌进业务表单 | 支持 | 易写错 | 难联动 |
| 不绑 UI 库 | 支持 | — | — |
| Quartz / 日周互斥 | 内置 | 无 | 有 |
| 无框架复用 | `@cron-zen/core` | — | 无 |
| 主题 | CSS 变量 | — | 无 |

行为细则见 [与 cron.ren 对照](./vs-cron-ren)。接法见 [任意 UI 库集成](./any-ui)。

## 设计约束

1. **引擎优先**：行为可单测、可在非 Vue 环境复用。
2. **UI 库是插件**：默认路径不安装 Element。
3. **空值不偷写**：`v-model === ''` 时不注入默认表达式。
4. **容错**：非标准输入尽量降级，不拖垮宿主页面。

## 下一步

- [快速开始](./quick-start)
- [任意 UI 库集成](./any-ui)
- [Playground](./playground)
