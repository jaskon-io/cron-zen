# 快速开始

<p class="cz-lead">
本页面向 <strong>Vue 3</strong> 可视化接入。无 Vue / 只要解析生成 → 只装 <code>@cron-zen/core</code>，见 <a href="./choose-package">选哪个包</a>。全程不需要 Element Plus。
</p>

## 环境

- Node.js `>= 18`
- **Vue `^3.2`**（使用本页的 `CronZen` / `useCronZen` 时必需）

## 安装

::: code-group

```bash [Vue 3 可视化]
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

```bash [Vue 2.7 可视化]
pnpm add @cron-zen/vue2 @cron-zen/core vue@2.7
```

```bash [仅引擎 · 无 Vue 也可]
pnpm add @cron-zen/core
```

```bash [可选 · 已有 Element 时]
pnpm add element-plus
```

:::

::: warning `@cron-zen/vue3` 不能脱离 Vue
包名中的 `vue3` 表示适配层。纯 HTML、jQuery 页、仅 Node 服务请用 `@cron-zen/core`，不要只装 `vue3` 却期望出现组件。
:::

## 基础用法（Vue 3）

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

## Vue 2.7 用法

```vue
<template>
  <cron-zen v-model="cron" />
</template>

<script>
import { CronZen } from '@cron-zen/vue2'
import '@cron-zen/vue2/style.css'

export default {
  components: { CronZen },
  data() {
    return { cron: '' }
  },
}
</script>
```

完整 API → [API · vue2](/api/vue2)

## 只要引擎：`@cron-zen/core`（原生 / Node 可用）

不依赖 Vue。适合脚本、接口校验、非 Vue 前端：

```ts
import { parseCron, generateCron, createDefaultCronState } from '@cron-zen/core'

const parsed = parseCron('0 0/5 * * * ?')
if (parsed.success) {
  console.log(parsed.state?.minute)
}

const generated = generateCron(createDefaultCronState())
// → { success: true, expression: '* * * * * ?' }
```

## 弹窗 / 其它 UI 库（仍在 Vue 3 应用内）

用现有 Modal 或原生 `<dialog>` 包一层 `CronZen`——**宿主仍是 Vue**，换的只是弹层实现：

→ [任意 UI 库集成](./any-ui)

选包细表 → [选哪个包](./choose-package)

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

- [选哪个包](./choose-package)
- [任意 UI 库集成](./any-ui)
- [API · vue3](/api/vue3)
- [在线 Playground](./playground)
