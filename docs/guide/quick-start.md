# 快速开始

<p class="cz-lead">
安装两个包，三行模板即可嵌入可视化编辑器。全程不需要 Element Plus。
</p>

## 环境

- Node.js `>= 18`
- Vue `^3.2`（仅使用 `@cron-zen/vue3` 时）

## 安装

::: code-group

```bash [推荐 · Vue UI]
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```bash [仅引擎]
pnpm add @cron-zen/core
```

```bash [可选 · Element 壳]
pnpm add element-plus
```

:::

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CronZen } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

/** 空串 = 无值，不注入默认 Cron */
const cron = ref('')
</script>

<template>
  <CronZen v-model="cron" />
  <pre>{{ cron }}</pre>
</template>
```

::: info 默认输出
重置后的配置态为 **6 段** `* * * * * ?`。年选择「不指定」时不会强行补第 7 段 `*`。
:::

## 只要引擎

```ts
import { parseCron, generateCron, createDefaultCronState } from '@cron-zen/core'

const parsed = parseCron('0 0/5 * * * ?')
if (parsed.success) {
  console.log(parsed.state?.minute)
}

const generated = generateCron(createDefaultCronState())
// → { success: true, expression: '* * * * * ?' }
```

## 弹窗 / 其它 UI 库

用现有 Modal 包一层 `CronZen`，或 `useCronZen` 自绘界面：

→ [任意 UI 库集成](./any-ui)

## 可选：Element Plus Picker

仅当你**已经**使用 Element Plus：

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

## 全局注册（可选）

```ts
import { createApp } from 'vue'
import { CronZenPlugin } from '@cron-zen/vue3'
import '@cron-zen/vue3/style.css'

createApp(App).use(CronZenPlugin).mount('#app')
```

按需 `import { CronZen } from '@cron-zen/vue3'` 即可，不必使用插件。

## 下一步

- [任意 UI 库集成](./any-ui)
- [API · vue3](/api/vue3)
- [在线 Playground](./playground)
