# 介绍

`cron-zen` 首先是一套 **Cron 能力库**（解析 / 生成 / 校验 / 预览），其次才是可选的 Vue 可视化外壳。

它要解决的是：把可靠的 Quartz 风格 Cron 嵌进**你已经有的**技术栈与页面架构——而不是逼你换一套 UI 库。

## 适合谁

- 后台 / 运维配置需要「点选生成 Cron」，而不是手写字符串
- 调度使用 **Quartz 风格**（6 / 7 段、日周互斥、`?` / `L` / `#` 等）
- 交互希望接近 [cron.ren](https://www.cron.ren/index.html)，但必须进自己的 Vue（或仅用 core）
- **UI 库各异**：Element / Ant / Naive / 自研都没关系

## 架构分层

```text
@cron-zen/core          ← 引擎（任意 JS 运行时）
        ↓
Vue 适配（可选）
  useCronZen / CronZen  ← 无强制 UI 库
        ↓
业务壳（可换）
  你的 Dialog / 表单 / 甚至 CronZenPicker（Element 示例）
```

| 包 | 说明 | 状态 |
| --- | --- | --- |
| [`@cron-zen/core`](https://www.npmjs.com/package/@cron-zen/core) | 解析 / 生成 / 校验 / 描述 / 近 N 次 | 已发布 |
| [`@cron-zen/vue3`](https://www.npmjs.com/package/@cron-zen/vue3) | Vue 3：状态机 + 自绘编辑器 + 可选 Element 壳 | 已发布 |
| `@cron-zen/vue2` | Vue 2 适配 | **暂不做首发** |

## 和同类方案比

| | cron-zen | 纯输入框 | 只嵌 cron.ren |
| --- | --- | --- | --- |
| 嵌进业务表单 | ✅ | ✅ 但易写错 | ❌ 难联动 |
| 不绑死 UI 库 | ✅ | — | — |
| Quartz / 日周互斥 | ✅ | ❌ | ✅ |
| 无框架复用 core | ✅ | — | ❌ |
| 主题可控 | ✅ CSS 变量 | — | ❌ |

详见 [与 cron.ren 的差异](./vs-cron-ren)、[任意 UI 库集成](./any-ui)。

## 设计原则

1. **引擎优先**：core 零框架，行为可单测、可复用。
2. **UI 库是插件，不是门槛**：默认 `CronZen` / `useCronZen`；`CronZenPicker` 仅为 Element 示例壳。
3. **空值不偷写**：`v-model` 为空不注入默认表达式。
4. **容错优先**：非标准输入降级映射，不把宿主页面打崩。
