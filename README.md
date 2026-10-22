# cron-zen

可视化 Cron 表达式生成器组件库（pnpm Monorepo）。

面向 Vue 2 / Vue 3 的开源组件，核心逻辑与框架解耦，可独立发布与复用。

## Packages

| Package | Description | npm |
| --- | --- | --- |
| [`@cron-zen/core`](./packages/core) | 纯 TypeScript：解析 / 生成 / 校验（无 UI 依赖） | 待发布 |
| [`@cron-zen/vue3`](./packages/vue3) | Vue 3 可视化组件（v-model + 三段式 UI） | 待发布 |
| `@cron-zen/vue2` | Vue 2 适配层 | 规划中 |

## Requirements

- Node.js `>= 18`
- pnpm `>= 8`

## Getting Started

```bash
pnpm install
pnpm test
pnpm --filter @cron-zen/core typecheck

# 本地可视化 Playground
pnpm dev
```

### `@cron-zen/core` 示例

```ts
import { parseCron } from '@cron-zen/core';

const res = parseCron('0 0 2 * * ? *');
if (res.success) {
  console.log(res.state?.hour); // { mode: 'specific', raw: '2', value: '2' }
}
```

## Features (core)

- 支持 5 / 6 / 7 段 Cron 表达式解析与生成
- 日、周字段互斥校验与自动修正
- 非法日期拦截（如 2 月 31 日）
- `%` 转义，避免调度系统误解析
- 非标准输入容错降级，不崩溃

## Scripts

| Command | Description |
| --- | --- |
| `pnpm test` | 运行 core 单元测试 |
| `pnpm test:coverage` | 覆盖率报告（目标 100%） |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm build` | 构建可发布产物 |

## License

[MIT](./LICENSE)
