# @cron-zen/vue3

Vue 3 可视化 Cron 表达式生成器。基于 `@cron-zen/core`，提供三段式 UI：顶部 Tab、中部配置、底部预览。

## Install

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```ts
import { createApp } from 'vue';
import { CronZenPlugin } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

createApp(App).use(CronZenPlugin).mount('#app');
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

const cron = ref('0 0 2 * * ? *');
</script>

<template>
  <CronZen v-model="cron" />
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `string` | `0 0 0 * * ? *` | Cron 表达式（v-model） |
| `debounceMs` | `number` | `300` | 配置变更防抖 |
| `nextCount` | `number` | `10` | 预览最近触发次数 |

## Notes

- 日 / 周互斥：配置一方具体值时，另一方自动锁定为 `?`，并在 UI 提示
- 主题通过 CSS 变量覆盖（见 `cron-zen.css`）
- 最近触发时间为骨架估算，复杂符号（L / W / #）可能无法展开

## License

MIT
