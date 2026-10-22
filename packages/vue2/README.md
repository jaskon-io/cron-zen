# @cron-zen/vue2

Vue 2.7 可视化 Cron 表达式生成器。基于 `@cron-zen/core`，与 `@cron-zen/vue3` 功能对齐。

## Install

```bash
pnpm add @cron-zen/vue2 @cron-zen/core vue@2
```

```js
import Vue from 'vue';
import { CronZenPlugin } from '@cron-zen/vue2';
import '@cron-zen/vue2/style.css';

Vue.use(CronZenPlugin);
```

## Usage

```vue
<template>
  <!-- v-model -->
  <cron-zen v-model="cron" />
  <!-- 或 .sync -->
  <cron-zen :value.sync="cron" />
</template>

<script>
export default {
  data() {
    return { cron: '0 0 2 * * ? *' };
  },
};
</script>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | `* * * * * ? *` | Cron 表达式（v-model） |
| `debounceMs` | `number` | `300` | 配置变更防抖 |
| `nextCount` | `number` | `10` | 预览最近触发次数 |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `input` / `update:value` | `string` | 表达式变更 |
| `change` | `CronState` | 可视化状态变更 |

## License

MIT
