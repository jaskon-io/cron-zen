# `@cron-zen/vue3`

Vue 3 适配层。默认路径 **不依赖 Element Plus**。

| 导出 | 依赖 UI 库？ | 用途 |
| --- | --- | --- |
| `CronZen` | 否 | 完整可视化编辑器 |
| `useCronZen` | 否 | 无 UI 状态机，自绘界面 |
| `CronZenPicker` | **Element Plus（optional peer）** | 官方示例壳，已用 EP 时可省胶水 |
| `CronZenPlugin` | 否 | 可选全局注册 |

跨 UI 库接法见 [任意 UI 库集成](/guide/any-ui)。

## 安装

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

仅当使用 `CronZenPicker`：

```bash
pnpm add element-plus
```

```ts
import '@cron-zen/vue3/style.css';
```

---

## `CronZen`

完整可视化编辑器（顶部 Tab + 中部配置 + 可选底部预览）。**无 Element 依赖。**

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | Cron；**空值不注入默认** |
| `debounceMs` | `number` | `0` | 写回 v-model 防抖；本地预览始终即时 |
| `nextCount` | `number` | `10` | 「近 N 次」条数（最大 100） |
| `showPreview` | `boolean` | `true` | 底部预览；弹窗内建议 `false` |

### Events

| Event | Payload |
| --- | --- |
| `update:modelValue` | `string` |
| `change` | `CronState` |

```vue
<CronZen v-model="cron" :show-preview="true" :next-count="10" />
```

---

## `useCronZen`

无 UI 状态机，自绘 Tab / 控件 / 预览时用。

```ts
import { ref } from 'vue';
import { useCronZen } from '@cron-zen/vue3';

const model = ref('0 0 0 * * ?');
const {
  state,
  expression,
  description,
  nextRuns,
  updateField,
  loadExpression,
  reset,
  flush,
} = useCronZen({
  modelValue: model,
  debounceMs: 0,
  nextCount: 10,
});
```

包入口同时再导出 core API（`parseCron`、`generateCron` 等）。

---

## `CronZenPicker`（可选 Element 壳）

输入框 +「选择」+ Dialog，面向 **已使用 Element Plus** 的表单。  
若项目是 Ant / Naive / 自研弹层，请用 [任意 UI 库集成](/guide/any-ui)，不要为此引入 Element。

### 主要 Props

| Prop | Default | Description |
| --- | --- | --- |
| `modelValue` | `''` | Cron |
| `placeholder` | `请选择或输入 Cron 表达式` | 占位 |
| `readonly` | `false` | 只能弹窗改 |
| `clearable` | `true` | 可清空 |
| `buttonText` | `选择` | 按钮文案 |
| `dialogTitle` | `选择 Cron 表达式` | 标题 |
| `dialogWidth` | `760px` | 宽度 |

### Events / Slots

- Events：`update:modelValue`、`confirm`、`cancel`
- Slot：`trigger="{ open, disabled }"`
- Expose：`open()` / `close()` / `getDraft()` / `setDraft()`

---

## 主题

```css
:root {
  --cz-primary: #2563eb;
  --cz-border: #e5e7eb;
}
```

完整变量见源码 `packages/vue3/src/styles/cron-zen.css`。

更完整说明见 [`packages/vue3/README.md`](https://github.com/jaskon-io/cron-zen/blob/main/packages/vue3/README.md)。
