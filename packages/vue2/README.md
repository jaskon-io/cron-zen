# @cron-zen/vue2

Vue 2.7 可视化 Cron 表达式生成器。基于 `@cron-zen/core`，交互与能力对齐 [`@cron-zen/vue3`](https://www.npmjs.com/package/@cron-zen/vue3)（日 `L`/`LW`/`nW`、周 `nL`/`#`、月「1月」标签、周 abbr/数字、空 v-model 不注入默认等）。

文档：[API · vue2](https://jaskon-io.github.io/cron-zen/api/vue2) · [选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package)

## Install

```bash
pnpm add @cron-zen/vue2 @cron-zen/core vue@2.7
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
  <!-- v-model；空串 = 无值，不注入默认表达式 -->
  <cron-zen v-model="cron" />
  <!-- 或 .sync -->
  <cron-zen :value.sync="cron" :show-preview="false" />
</template>

<script>
export default {
  data() {
    return { cron: '' };
  },
};
</script>
```

## useCronZen

```js
import { ref } from 'vue';
import { useCronZen } from '@cron-zen/vue2';

const model = ref('');
const { expression, updateField, reset } = useCronZen({
  modelValue: model,
  debounceMs: 0,
});
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `v-model` | `string` | `''` | Cron；**空值不注入默认** |
| `debounceMs` | `number` | `0` | 写回防抖；预览始终即时 |
| `nextCount` | `number` | `10` | 近 N 次（最大 100） |
| `showPreview` | `boolean` | `true` | 底部预览；弹窗建议 `false` |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `input` / `update:value` | `string` | 表达式变更 |
| `change` | `CronState` | 可视化状态变更 |

## 与 vue3

| 能力 | vue2 | vue3 |
| --- | --- | --- |
| `CronZen` + 日周互斥 / L·LW·W·nL·# | ✅ | ✅ |
| `useCronZen` | ✅（Vue 2.7 Composition API） | ✅ |
| 空 v-model / `showPreview` | ✅ | ✅ |
| `CronZenPicker` | ❌（不计划） | 可选 |

## License

MIT
