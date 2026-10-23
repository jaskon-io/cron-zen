# 任意 UI 库集成

<p class="cz-lead">
本页默认假设你已在 <strong>Vue 3</strong> 应用中。换的是弹窗 / 表单壳（原生 dialog、Ant、Naive…），不是去掉 Vue。<code>@cron-zen/vue3</code> 提供组件；无 Vue 环境请只用 <a href="./choose-package">@cron-zen/core</a>。
</p>

## 分层

```text
@cron-zen/core
  解析 / 生成 / 校验 / 描述 / 近 N 次     ← 无 Vue 也能用
       │
@cron-zen/vue3                            ← 需要 Vue 3
  useCronZen / CronZen / CronZenPicker
       │
你的业务壳（仍在 Vue 应用里）
  <dialog> / Ant Modal / Naive / …
```

| 目标 | 选用 | 需要 Vue？ | 额外 UI 库 |
| --- | --- | --- | --- |
| 只要解析生成 | `@cron-zen/core` | 否 | 无 |
| 页面内嵌编辑器 | `CronZen` | **是** | 无 |
| 自绘弹窗 / 抽屉 | `CronZen` + 你的 Dialog | **是** | 用现有的 |
| 已有 Element 表单 | `CronZenPicker` | **是** | Element Plus |

::: tip 「原生 `<dialog>`」≠「原生页面无 Vue」
下面示例里的 `<dialog>` 是浏览器弹层标签，写在 **Vue SFC（`<script setup>`）** 里。  
`import { CronZen } from '@cron-zen/vue3'` 仍然依赖 Vue 运行时。
:::

---

## 模式 A：页面内嵌（Vue 3）

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

## 模式 B：自绘弹窗（Vue 3 + 任意壳）

打开时拷贝 `draft`，弹层内绑定 `CronZen`（建议 `showPreview=false`），确定时写回。

### 原生 `<dialog>`（弹层原生，应用仍是 Vue）

```vue
<script setup lang="ts">
import { ref } from 'vue'
// 来自 vue3 适配包：这是 Vue 组件，不是「可在无 Vue 页使用」的意思
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

1. **没有 Vue** → 只装 [`@cron-zen/core`](/api/core)，自绘或后接其它框架
2. Vue 3 新项目 → `CronZen` / `useCronZen`（模式 A / C）
3. Vue 3 + 已有 Ant / Naive / 自研弹层 → 模式 B
4. 全站 Element Plus → 可用 Picker，也可模式 B（更易换库）

包该怎么选：[选哪个包](./choose-package)
