# @cron-zen/vue3

<p class="cz-lead">
<strong>Vue 3 专用</strong>适配层。包名中的 <code>vue3</code> 表示运行时要求，不是「也支持无 Vue 页面」。默认不依赖 Element Plus；Picker 仅为可选示例壳。
</p>

::: warning 没有 Vue？
请安装 [`@cron-zen/core`](./core)，不要只装本包。对照表：[选哪个包](/guide/choose-package)。
:::

## 导出一览

| 导出 | 需要 Vue | UI 库依赖 | 用途 |
| --- | --- | --- | --- |
| `CronZen` | 是 | 无 | 完整可视化编辑器（推荐） |
| `useCronZen` | 是 | 无 | 无头状态机（自绘 UI） |
| `CronZenPlugin` | 是 | 无 | 仅全局注册 `CronZen` |
| `CronZenPicker` | 是 | Element Plus（按需） | 可选示例壳；**不**随插件注册 |

弹层用原生 `<dialog>` / Ant / Naive：仍在 Vue 应用内，见 [任意 UI 库集成](/guide/any-ui)。

## 安装

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```ts
import '@cron-zen/vue3/style.css'
```

::: tip 不要为了弹窗去装 Element
默认路径是 `CronZen` / `useCronZen`。只有全站已在用 Element Plus 时，才考虑按需引入 `CronZenPicker`（并自行 `pnpm add element-plus`）。
:::

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

## CronZenPicker（可选 · 不推荐作为默认）

面向**已使用 Element Plus** 的表单胶水。其它 UI 库请用 [任意 UI 库集成](/guide/any-ui)。需按需导入，不会被 `CronZenPlugin` 全局注册。

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
