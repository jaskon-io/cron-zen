# 任意 UI 库集成

**结论先说：默认路径不依赖 Element Plus（或任何 UI 库）。**

`cron-zen` 的内核是 Cron 能力；页面上的按钮、弹窗、表单控件由你现有技术栈承载。

## 分层（记住这张图）

```text
@cron-zen/core
    解析 / 生成 / 校验 / 描述 / 近 N 次
         │
         ▼
@cron-zen/vue3
    useCronZen     ← 无 UI 状态机（推荐自绘）
    CronZen        ← 自带可视化，仅 CSS 变量，无 Element
    CronZenPicker  ← 可选示例壳（目前用 Element Plus）
         │
         ▼
你的业务壳
    Ant Design Vue / Naive UI / Vuetify / 自研 Dialog …
```

| 你想要 | 用什么 | 要不要装 UI 库 |
| --- | --- | --- |
| 只要解析生成 | `@cron-zen/core` | 否 |
| 嵌完整编辑器 | `CronZen` | 否 |
| 自绘弹窗 / 抽屉 | `useCronZen` 或 `CronZen` + 你的 Dialog | 用你已有的 |
| 快速 Element 表单 | `CronZenPicker` | 要 Element Plus |

---

## 模式 A：页面内嵌（零弹窗）

最常见、也最干净——不绑任何组件库：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

const cron = ref('');
</script>

<template>
  <CronZen v-model="cron" />
</template>
```

---

## 模式 B：自绘弹窗（任意 UI 库）

用你项目里已有的 Dialog；编辑器继续用 `CronZen`（`showPreview=false` 更适合弹层）。

下面用**原生 `<dialog>`** 演示原理，换成 `a-modal` / `n-modal` / `el-dialog` 同理：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

const cron = ref('');
const draft = ref('');
const dialogRef = ref<HTMLDialogElement | null>(null);

function open() {
  draft.value = cron.value;
  dialogRef.value?.showModal();
}

function confirm() {
  cron.value = draft.value;
  dialogRef.value?.close();
}

function cancel() {
  dialogRef.value?.close();
}
</script>

<template>
  <div class="row">
    <input v-model="cron" readonly placeholder="Cron 表达式" />
    <button type="button" @click="open">选择</button>
  </div>

  <dialog ref="dialogRef">
    <form method="dialog" @submit.prevent>
      <h3>配置 Cron</h3>
      <CronZen v-model="draft" :show-preview="false" />
      <footer>
        <button type="button" @click="cancel">取消</button>
        <button type="button" @click="confirm">确定</button>
      </footer>
    </form>
  </dialog>
</template>
```

### Ant Design Vue 示意

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Modal, Input, Button } from 'ant-design-vue';
import { CronZen } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

const cron = ref('');
const draft = ref('');
const open = ref(false);

function show() {
  draft.value = cron.value;
  open.value = true;
}
function ok() {
  cron.value = draft.value;
  open.value = false;
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

Naive UI / Vuetify / Arco 等：同样是「打开时拷贝 draft → 弹层里绑 `CronZen` → 确定写回」。

---

## 模式 C：完全自绘 UI（只要状态机）

字段 Tab、单选、预览区都自己画时，用 `useCronZen`：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useCronZen } from '@cron-zen/vue3';

const model = ref('');
const {
  expression,
  description,
  nextRuns,
  activeTab,
  updateField,
  loadExpression,
  reset,
} = useCronZen({
  modelValue: model,
  debounceMs: 0,
  nextCount: 5,
  showPreview: true,
});

function everyFiveMinutes() {
  updateField('second', { mode: 'every', raw: '*', value: '*' });
  updateField('minute', {
    mode: 'step',
    raw: '0/5',
    value: '0',
    secondary: '5',
  });
  // …按需更新其它字段
}
</script>

<template>
  <p>表达式：{{ expression }}</p>
  <p>{{ description }}</p>
  <ul>
    <li v-for="(t, i) in nextRuns" :key="i">{{ t }}</li>
  </ul>
  <button type="button" @click="everyFiveMinutes">每 5 分钟</button>
  <button type="button" @click="reset">重置</button>
</template>
```

字段 `mode` / `raw` 约定见 [API · vue3](/api/vue3) 与 [API · core](/api/core)。

---

## 模式 D：官方 Element 壳（可选）

仅当你**已经**在用 Element Plus，想少写胶水代码时：

```bash
pnpm add element-plus
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZenPicker } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';
import 'element-plus/dist/index.css';

const cron = ref('');
</script>

<template>
  <CronZenPicker v-model="cron" readonly />
</template>
```

`CronZenPicker` = 一种官方示例壳，**不是**使用 cron-zen 的前提。

---

## 选型建议

1. 新项目 / 不确定 UI 库 → `CronZen` 或 `useCronZen`
2. 已有 Ant / Naive / 自研弹层 → 模式 B
3. 全站 Element Plus → 可以用 `CronZenPicker`，也可以仍用模式 B（更易换库）

差异化在于：**Cron 引擎可嵌入任意页面架构**；UI 库只是外壳。
