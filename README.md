# cron-zen

可嵌入的 Cron 引擎（Quartz / cron.ren 风格）。

| 包 | 给谁用 | npm |
| --- | --- | --- |
| **`@cron-zen/core`** | 任意运行时 — 解析 / 生成 / 校验 / 描述 / 近 N 次（时区 + i18n） | [0.2.0](https://www.npmjs.com/package/@cron-zen/core) |
| **`@cron-zen/vanilla`** | **无框架** — `mountCronZen` / `createCronZen` | [0.2.0](https://www.npmjs.com/package/@cron-zen/vanilla) |
| **`@cron-zen/vue3`** | Vue 3 — `CronZen` / `useCronZen` | [0.2.0](https://www.npmjs.com/package/@cron-zen/vue3) |
| **`@cron-zen/vue2`** | Vue 2.7 — `CronZen` / `useCronZen` | [0.2.0](https://www.npmjs.com/package/@cron-zen/vue2) |

[![npm core](https://img.shields.io/npm/v/@cron-zen/core.svg?label=%40cron-zen%2Fcore)](https://www.npmjs.com/package/@cron-zen/core)
[![npm vanilla](https://img.shields.io/npm/v/@cron-zen/vanilla.svg?label=%40cron-zen%2Fvanilla)](https://www.npmjs.com/package/@cron-zen/vanilla)
[![npm vue3](https://img.shields.io/npm/v/@cron-zen/vue3.svg?label=%40cron-zen%2Fvue3)](https://www.npmjs.com/package/@cron-zen/vue3)
[![npm vue2](https://img.shields.io/npm/v/@cron-zen/vue2.svg?label=%40cron-zen%2Fvue2)](https://www.npmjs.com/package/@cron-zen/vue2)
[![license](https://img.shields.io/npm/l/@cron-zen/core.svg)](./LICENSE)

**文档**：[选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package) · [站点](https://jaskon-io.github.io/cron-zen/) · [Playground](https://jaskon-io.github.io/cron-zen/guide/playground)  
**更新日志**：[CHANGELOG.md](./CHANGELOG.md) · [Releases](https://github.com/jaskon-io/cron-zen/releases)

## 安装

```bash
# 只要引擎
pnpm add @cron-zen/core

# 无框架可视化（纯 HTML / 任意壳）
pnpm add @cron-zen/vanilla @cron-zen/core

# Vue 3
pnpm add @cron-zen/vue3 @cron-zen/core vue

# Vue 2.7
pnpm add @cron-zen/vue2 @cron-zen/core vue@2.7
```

```html
<div id="cron"></div>
<script type="module">
  import { mountCronZen } from '@cron-zen/vanilla'
  import '@cron-zen/vanilla/style.css'
  mountCronZen('#cron', { value: '', onChange: console.log })
</script>
```

## 本地开发

```bash
pnpm install
pnpm test
pnpm docs:dev
```

## License

[MIT](./LICENSE)
