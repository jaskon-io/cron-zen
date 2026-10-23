# @cron-zen/vue3

<p class="cz-lead">
Vue 3 适配层。默认路径不依赖 Element Plus；Picker 仅为可选示例壳。
</p>

## 导出一览

| 导出 | UI 库依赖 | 用途 |
| --- | --- | --- |
| `CronZen` | 无 | 完整可视化编辑器 |
| `useCronZen` | 无 | 无头状态机 |
| `CronZenPicker` | Element Plus（optional peer） | 官方 Element 壳 |
| `CronZenPlugin` | 无 | 可选全局注册 |

跨库接法：[任意 UI 库集成](/guide/any-ui)

## 安装

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```bash
pnpm add element-plus   # 仅 CronZenPicker
```

```ts
import '@cron-zen/vue3/style.css'
```

---

## CronZen

### Props

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | Cron；空值不注入默认 |
| `debounceMs` | `number` | `0` | 写回防抖；本地预览始终即时 |
| `nextCount` | `number` | `10` | 近 N 次（最大 100） |
| `showPreview` | `boolean` | `true` | 底部预览；弹窗建议 `false` |

### Events

| 事件 | 载荷 |
| --- | --- |
| `update:modelValue` | `string` |
| `change` | `CronState` |

### 示例

```vue
<CronZen v-model="cron" :show-preview="true" :next-count="10" />
```

---

## useCronZen

```ts
import { ref } from 'vue'
import { useCronZen } from '@cron-zen/vue3'

const model = ref('0 0 0 * * ?')
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
})
```

入口同时再导出 core API（`parseCron`、`generateCron` 等）。

---

## CronZenPicker

面向**已使用 Element Plus** 的表单。其它 UI 库请用 [任意 UI 库集成](/guide/any-ui)。

### Props

| Prop | 默认 | 说明 |
| --- | --- | --- |
| `modelValue` | `''` | Cron |
| `placeholder` | `请选择或输入 Cron 表达式` | 占位 |
| `readonly` | `false` | 仅弹窗可改 |
| `clearable` | `true` | 可清空 |
| `buttonText` | `选择` | 按钮文案 |
| `dialogTitle` | `选择 Cron 表达式` | 标题 |
| `dialogWidth` | `760px` | 宽度 |

### Events / Slots / Expose

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

完整变量见 `packages/vue3/src/styles/cron-zen.css`。
