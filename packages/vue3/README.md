# @cron-zen/vue3

Vue 3 可视化 Cron 表达式生成器。基于 `@cron-zen/core`，交互对齐 [cron.ren](https://www.cron.ren/index.html)：顶部 Tab + 中部配置 + 底部预览（可选）。

**本包需要 Vue 3。** 包名中的 `vue3` 即运行时要求；无 Vue 请用 [`@cron-zen/core`](https://www.npmjs.com/package/@cron-zen/core)。

**默认不依赖 Element / Ant 等 UI 库。** `CronZen` / `useCronZen` 即可嵌入；文档里的原生 `<dialog>` 示例仍是 Vue SFC，只是弹层没用组件库。`CronZenPicker` 仅为 Element 可选壳。

选包：[选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package) · 弹层：[任意 UI 库集成](https://jaskon-io.github.io/cron-zen/guide/any-ui)。

## Install

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```bash
pnpm add element-plus   # 仅使用 CronZenPicker 时需要；不是安装前提
```

```ts
import { createApp } from 'vue';
import { CronZenPlugin } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

createApp(App).use(CronZenPlugin).mount('#app');
```

也可按需引入组件，不必装插件。

## Quick Start

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

/** 空串 = 无值（不注入默认表达式）；有值则回显 */
const cron = ref('');
</script>

<template>
  <CronZen v-model="cron" />
</template>
```

默认配置态（点「重置」或内部默认）为 **6 段**：`* * * * * ?`（年「不指定」省略，对齐 cron.ren）。选「每年 / 周期 / 指定年」后才会带第 7 段。

---

## `CronZen`

完整可视化编辑器。

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | Cron 表达式；**空值不注入默认**，UI 仍可编辑 |
| `debounceMs` | `number` | `0` | 写回 v-model 的防抖；本地预览始终即时。需要节流时可传 `300` |
| `nextCount` | `number` | `10` | 底部「近 N 次」条数（最大 100） |
| `showPreview` | `boolean` | `true` | 是否显示底部字段表 / 表达式 / 自然语言 / 近 N 次。弹窗场景建议 `false` |

### Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | v-model |
| `change` | `CronState` | 可视化状态变更 |

### 示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';
import type { CronState } from '@cron-zen/vue3';

const cron = ref('0 0/5 * * * ?');
function onChange(state: CronState) {
  console.log(state.minute); // { mode: 'step', ... }
}
</script>

<template>
  <CronZen
    v-model="cron"
    :show-preview="true"
    :next-count="10"
    @change="onChange"
  />
</template>
```

弹窗内嵌（无预览区）：

```vue
<CronZen v-model="draft" :show-preview="false" />
```

---

## `CronZenPicker`（可选 · Element 壳）

输入框 +「选择」按钮 + Dialog，**仅当你已在用 Element Plus** 时省胶水代码。弹窗内使用 `CronZen`（`showPreview=false`）。其它 UI 库请自行包一层 Dialog，不必为此引入 Element。

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `string` | `''` | Cron 表达式 |
| `placeholder` | `string` | `请选择或输入 Cron 表达式` | 输入框占位 |
| `disabled` | `boolean` | `false` | 禁用 |
| `readonly` | `boolean` | `false` | 输入框只读（只能弹窗改） |
| `clearable` | `boolean` | `true` | 可清空 |
| `size` | `'large' \| 'default' \| 'small'` | `'default'` | Element Plus 尺寸 |
| `buttonText` | `string` | `'选择'` | 默认按钮文案 |
| `dialogTitle` | `string` | `'选择 Cron 表达式'` | 弹窗标题 |
| `dialogWidth` | `string \| number` | `'760px'` | 弹窗宽度 |
| `debounceMs` | `number` | `0` | 弹窗内草稿写回防抖 |

### Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string` | v-model |
| `confirm` | `string` | 点确定且校验通过后的规范化表达式 |
| `cancel` | — | 关闭弹窗且未确认 |

### Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `trigger` | `{ open, disabled }` | 自定义打开按钮 |

### Expose

| Method | Description |
| --- | --- |
| `open()` | 打开弹窗（有值回显，无值保持空） |
| `close()` | 关闭（等同取消） |
| `getDraft()` / `setDraft(value)` | 读写弹窗草稿 |

### 示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZenPicker } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';
import 'element-plus/dist/index.css';

const cron = ref('');
</script>

<template>
  <CronZenPicker
    v-model="cron"
    readonly
    @confirm="(v) => console.log('ok', v)"
  />

  <!-- 自定义触发器 -->
  <CronZenPicker v-model="cron">
    <template #trigger="{ open, disabled }">
      <el-button type="primary" :disabled="disabled" @click="open">
        配置定时
      </el-button>
    </template>
  </CronZenPicker>
</template>
```

---

## `useCronZen`（无 UI）

只拿状态机 / 预览，自己画界面时用。

```ts
import { ref } from 'vue';
import { useCronZen } from '@cron-zen/vue3';

const model = ref('0 0 0 * * ?');
const {
  state,
  expression,
  description,
  nextRuns,
  hint,
  weekFormat,
  activeTab,
  updateField,
  setWeekFormat,
  loadExpression,
  reset,
  flush,
} = useCronZen({
  modelValue: model,
  debounceMs: 0,
  nextCount: 10,
  showPreview: true,
});

updateField('minute', { mode: 'step', raw: '0/5', value: '0', secondary: '5' });
setWeekFormat('abbr'); // MON / TUE …
loadExpression('0 15 10 ? * 6L 2024-2030'); // 回显；6L 保持数字写法
reset(); // → * * * * * ?
flush(); // 立刻写回 v-model（跳过防抖）
```

同时从包入口可再导出 core API：`parseCron`、`generateCron`、`describeCron`、`getNextRuns` 等。

---

## 行为说明（对齐 cron.ren）

- **空 v-model**：不注入默认 Cron；UI 用「每秒 / 每分 / …」原始态编辑，确定/生成后再写出表达式
- **年不指定**：输出 6 段（如 `* * * * * ?`），不补尾部 `*`
- **日 / 周互斥**：一侧具体值时，另一侧自动变为 `?`，Tab 上有提示
- **周写法**：数字 `1~7`（1=周日）或英文 `SUN…SAT`；加载 `6L` 不会误判成 abbr 改写成 `FRIL`
- **周期倒序**：如周「周六→周二」输出 `7-3`（与 cron.ren 一致），近 N 次可能无法展开
- **主题**：覆盖 CSS 变量（见打包后的 `style.css` / 源码 `styles/cron-zen.css`）

```css
:root {
  --cz-primary: #2563eb;
  --cz-border: #e5e7eb;
  /* 更多变量见样式文件 */
}
```

---

## 已知差异 / 限制

相对 cron.ren 主路径已对齐；以下为已知差异（非阻塞）：

| 项 | 说明 |
| --- | --- |
| 经典表 `* * MON-FRI` | 加载后日段会规范为 `?`（Quartz 合法态） |
| 自然语言预览 | 周区间可能显示为「周 2-6」而非「周一至周五」 |
| `LW` / 月名 `JAN` | 可解析保留，UI 无独立选项 |
| 近 N 次 | `L` / `W` / `#` / 倒序区间等可能无法估算 |

---

## License

MIT
