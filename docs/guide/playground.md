# 在线 Playground

<p class="cz-lead">
文档里<strong>贴代码</strong>即可对照；需要「业务里怎么嵌」时，用按钮打开弹层（不嵌 iframe，不挡阅读）。各包另有独立 Demo 页，新窗口打开。
</p>

## 怎么演示

| 场景 | 文档怎么放 | 为什么 |
| --- | --- | --- |
| 单纯展示 API / 安装 | **直接贴代码** | 不挡视线、可复制 |
| Vue 业务选 Cron（表单旁按钮） | **按钮 → `<dialog>` 弹层** | 和 Element / Ant Modal 同一交互 |
| 其它运行时（vanilla / react / vue2 / core） | **新窗口打开独立 HTML** | 文档站是 Vue 3，不便真挂 React / Vue2 |

::: tip
本页 **Vue 3 弹层**是文档站内真实挂载的 `@cron-zen/vue3`，不是 iframe。  
本地完整 Element 壳仍可用 `pnpm dev`（apps/playground）。
:::

---

## Vue 3 · 业务弹层（本页可点）

输入框只读，点「选择 Cron」弹出编辑器；确定写回。弹层内默认 `showPreview=false`（业务弹窗常见做法）。

<CronZenBusinessDemo />

对应代码（可直接拷进业务）：

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
    <input v-model="cron" readonly @click="open" />
    <button type="button" @click="open">选择 Cron</button>
  </div>
  <dialog ref="dialogRef">
    <h3>配置 Cron</h3>
    <CronZen v-model="draft" :show-preview="false" />
    <button type="button" @click="dialogRef?.close()">取消</button>
    <button type="button" @click="confirm">确定</button>
  </dialog>
</template>
```

更多壳（Ant / Naive / Element Picker）→ [任意 UI 库集成](./any-ui)

---

## 各包独立 Demo（新窗口）

文档不嵌整页 iframe。要点完整编辑器 / 其它框架，点下面卡片：

<PackageDemoLinks />

| 包 | 本页 | 独立 Demo |
| --- | --- | --- |
| **vue3** | ↑ 业务弹层可点 | [整页编辑器](/examples/vue3.html) |
| **vanilla** | 贴代码即可 | [Demo](/examples/vanilla.html) |
| **react** | 贴代码即可 | [Demo](/examples/react.html) |
| **vue2** | 贴代码即可 | [Demo](/examples/vue2.html) |
| **core** | 贴代码即可 | [引擎沙箱](/examples/core.html) |

---

## 其它包代码速览

### vanilla

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.4/dist/cron-zen-vanilla.css" />
<div id="cron"></div>
<script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla@0.2.4/dist/cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen('#cron', {
    value: '',
    locale: 'zh-CN',
    onChange: function (expr) { console.log(expr) },
  })
</script>
```

### react

```tsx
import { useState } from 'react'
import { CronZen } from '@cron-zen/react'
import '@cron-zen/react/style.css'

export function App() {
  const [cron, setCron] = useState('')
  return <CronZen value={cron} onChange={setCron} locale="zh-CN" />
}
```

### vue2

```vue
<template>
  <cron-zen v-model="cron" locale="zh-CN" />
</template>
<script>
import { CronZen } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'
export default {
  components: { CronZen },
  data: () => ({ cron: '' }),
}
</script>
```

### core（只要引擎）

```js
import { parseCron, getNextRuns, formatRunTime } from '@cron-zen/core'

const res = parseCron('0 0 9 ? * 2-6')
if (res.success) {
  console.log(getNextRuns(res.state, 5).map(formatRunTime))
}
```

函数说明 → [API · core](/api/core)

---

## 本地 Playground（可选）

含 Element Plus 输入框 + 弹窗壳（与文档弹层同思路，只是壳换成 Element）：

```bash
pnpm install
pnpm dev
# → http://localhost:5173
```

生产请优先 [快速开始](./quick-start) / [任意 UI 库集成](./any-ui)；完整卡片列表 → [示例总览](./examples)。
