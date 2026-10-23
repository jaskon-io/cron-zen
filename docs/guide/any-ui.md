# 任意 UI 库集成

<p class="cz-lead">
默认路径不依赖 Element Plus 或任何组件库。Cron 引擎与可视化由 cron-zen 提供；按钮、弹窗、表单控件由你的技术栈承载。
</p>

## 分层

```text
@cron-zen/core
  解析 / 生成 / 校验 / 描述 / 近 N 次
       │
@cron-zen/vue3
  useCronZen      ← 无 UI 状态机
  CronZen         ← 自带可视化（仅 CSS 变量）
  CronZenPicker   ← 可选 Element 示例壳
       │
你的业务壳
  Ant Design Vue / Naive UI / Vuetify / 自研 Dialog …
```

| 目标 | 选用 | 额外 UI 库 |
| --- | --- | --- |
| 只要解析生成 | `@cron-zen/core` | 无 |
| 页面内嵌编辑器 | `CronZen` | 无 |
| 自绘弹窗 / 抽屉 | `CronZen` 或 `useCronZen` + 你的 Dialog | 用现有的 |
| 已有 Element 表单 | `CronZenPicker` | Element Plus |

---

## 模式 A：页面内嵌

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

const cron = ref('')
</script>

<template>
  <CronZen v-model="cron" />
</template>
```

---

## 模式 B：自绘弹窗

打开时拷贝 `draft`，弹层内绑定 `CronZen`（建议 `showPreview=false`），确定时写回。

### 原生 `<dialog>`

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

const cron = ref('')
const draft = ref('')
const dialogRef = ref<HTMLDialogElement | null>(null)

function open() {
  draft.value = cron.value
  dialogRef.value?.showModal()
}
function confirm() {
  cron.value = draft.value
  dialogRef.value?.close()
}
</script>

<template>
  <div>
    <input v-model="cron" readonly placeholder="Cron" />
    <button type="button" @click="open">选择</button>
  </div>

  <dialog ref="dialogRef">
    <h3>配置 Cron</h3>
    <CronZen v-model="draft" :show-preview="false" />
    <button type="button" @click="dialogRef?.close()">取消</button>
    <button type="button" @click="confirm">确定</button>
  </dialog>
</template>
```

### Ant Design Vue

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Modal, Input, Button } from 'ant-design-vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

const cron = ref('')
const draft = ref('')
const open = ref(false)

function show() {
  draft.value = cron.value
  open.value = true
}
function ok() {
  cron.value = draft.value
  open.value = false
}
</script>

<template>
  <Input.Group compact>
    <Input v-model:value="cron" readonly style="width: 70%" />
    <Button @click="show">选择</Button>
  </Input.Group>

  <Modal v-model:open="open" title="配置 Cron" width="760px" @ok="ok">
    <CronZen v-model="draft" :show-preview="false" />
  </Modal>
</template>
```

Naive UI / Vuetify / Arco：同一套「draft → 弹层 → 写回」流程。

---

## 模式 C：完全自绘（`useCronZen`）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCronZen } from '@cron-zen/vue3'

const model = ref('')
const { expression, description, nextRuns, updateField, reset } = useCronZen({
  modelValue: model,
  debounceMs: 0,
  nextCount: 5,
})

function everyFiveMinutes() {
  updateField('minute', {
    mode: 'step',
    raw: '0/5',
    value: '0',
    secondary: '5',
  })
}
</script>

<template>
  <p>{{ expression }}</p>
  <p>{{ description }}</p>
  <ul>
    <li v-for="(t, i) in nextRuns" :key="i">{{ t }}</li>
  </ul>
  <button type="button" @click="everyFiveMinutes">每 5 分钟</button>
  <button type="button" @click="reset">重置</button>
</template>
```

字段约定见 [API · vue3](/api/vue3)、[API · core](/api/core)。

---

## 模式 D：Element 壳（可选）

```bash
pnpm add element-plus
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CronZenPicker } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'
import 'element-plus/dist/index.css'

const cron = ref('')
</script>

<template>
  <CronZenPicker v-model="cron" readonly />
</template>
```

::: warning
`CronZenPicker` 是官方示例壳，不是使用 cron-zen 的前提。不要为了用 Picker 而引入 Element。
:::

## 选型

1. 新项目 → `CronZen` 或 `useCronZen`
2. 已有 Ant / Naive / 自研弹层 → 模式 B
3. 全站 Element Plus → 可用 Picker，也可继续模式 B（更易换库）
