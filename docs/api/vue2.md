# @cron-zen/vue2

<p class="cz-lead">
<strong>Vue 2.7 专用</strong>适配层。能力与 <a href="./vue3">@cron-zen/vue3</a> 主路径对齐（日周互斥、L/LW/nW、周 nL/#、空 v-model、周 abbr）。默认不依赖 Element 等 UI 库。
</p>

::: warning 没有 Vue 2？
请安装 [`@cron-zen/core`](./core) 或 [`@cron-zen/vue3`](./vue3)。对照表：[选哪个包](/guide/choose-package)。
:::

## 导出一览

| 导出 | 需要 Vue | UI 库依赖 | 用途 |
| --- | --- | --- | --- |
| `CronZen` | Vue 2.7 | 无 | 完整可视化编辑器 |
| `useCronZen` | Vue 2.7 Composition API | 无 | 无头状态机（自绘 UI） |
| `CronZenPlugin` / `install` | Vue 2.7 | 无 | 全局注册 `CronZen` |

无 `CronZenPicker`（Element 示例壳仅 vue3 提供）。

## 安装

```bash
pnpm add @cron-zen/vue2 @cron-zen/core vue@2.7
```

::: code-group

```js [ESM]
import { CronZen } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'
```

```js [CJS · require]
const { CronZenPlugin } = require('@cron-zen/vue2')
require('@cron-zen/vue2/style.css')
```

:::

更多 → [引入方式](/guide/import-styles)

## CronZen

### Props

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` / `v-model` | `string` | `''` | Cron；空值不注入默认 |
| `debounceMs` | `number` | `0` | 写回防抖；本地预览即时 |
| `nextCount` | `number` | `10` | 近 N 次 / 近 N 次已触发（最大 100） |
| `showPreview` | `boolean` | `true` | 底部预览（含 next / prev）；弹窗建议 `false` |
| `timeZone` | `string` | 本地 | IANA 时区（近 N 次） |
| `locale` | `string` | `zh-CN` | 自然语言 / Tab / 常用模板：`zh-CN` \| `en-US` |

顶部「常用模板」下拉；预览区同步展示已触发列表（与 vue3 对齐）。

### Events

| 事件 | 载荷 |
| --- | --- |
| `input` / `update:value` | `string` |
| `change` | `CronState` |

### 示例

```vue
<template>
  <cron-zen v-model="cron" :show-preview="true" :next-count="10" />
  <!-- 或 .sync -->
  <cron-zen :value.sync="cron" :show-preview="false" />
</template>

<script>
export default {
  data() {
    return { cron: '' }
  },
}
</script>
```

插件：

```js
import Vue from 'vue'
import { CronZenPlugin } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'

Vue.use(CronZenPlugin)
```

## useCronZen

Vue 2.7 Composition API，行为对齐 vue3：

```js
import { ref } from 'vue'
import { useCronZen } from '@cron-zen/vue2'

const model = ref('0 0 0 * * ?')
const {
  state,
  expression,
  description,
  nextRuns,
  prevRuns,
  updateField,
  loadExpression,
  reset,
  flush,
} = useCronZen({
  modelValue: model,
  debounceMs: 0,
  nextCount: 10,
})
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `modelValue` | — | `Ref<string>`，双向写回 |
| `debounceMs` | `300`（无 model 时）/ 组件默认 `0` | 夹到 ≤5000 |
| `nextCount` | `10` | 夹到 1…100 |
| `showPreview` | `true` | `false` 时不算描述与近 N 次 |
| `weekFormat` | `'number'` | `'abbr'` 输出 MON…SAT |

## 与 vue3 差异

| 项 | vue2 | vue3 |
| --- | --- | --- |
| v-model | `value` + `input` / `.sync` | `modelValue` + `update:modelValue` |
| 最低 Vue | `^2.7` | `^3.2` |
| Element Picker | 无 | 可选 `CronZenPicker` |

引擎能力相同，均依赖 `@cron-zen/core`。
