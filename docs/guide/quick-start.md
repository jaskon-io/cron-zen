# 快速开始

## 环境

- Node.js `>= 18`
- 用 Vue 适配时：Vue `^3.2`
- **不需要** Element Plus（除非你主动用 `CronZenPicker`）

## 推荐安装

```bash
pnpm add @cron-zen/vue3 @cron-zen/core vue
```

只要引擎、不要 Vue UI：

```bash
pnpm add @cron-zen/core
```

## 1. 最短路径：`CronZen`（无 UI 库）

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

/** 空串 = 无值（不注入默认表达式） */
const cron = ref('');
</script>

<template>
  <CronZen v-model="cron" />
  <pre>{{ cron }}</pre>
</template>
```

默认配置态（重置后）为 **6 段**：`* * * * * ?`（年「不指定」省略第 7 段）。

## 2. 只要逻辑：`@cron-zen/core`

```ts
import { parseCron, generateCron, createDefaultCronState } from '@cron-zen/core';

const parsed = parseCron('0 0/5 * * * ?');
if (parsed.success) {
  console.log(parsed.state?.minute);
}

const generated = generateCron(createDefaultCronState());
// { success: true, expression: '* * * * * ?' }
```

## 3. 弹窗 / 其它 UI 库

用你现有的 Modal + `CronZen`，或 `useCronZen` 自绘——见 **[任意 UI 库集成](./any-ui)**。

## 4. 可选：已有 Element Plus 时用 Picker

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

这是便捷壳，不是默认架构。

## 插件注册（可选）

```ts
import { createApp } from 'vue';
import { CronZenPlugin } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

createApp(App).use(CronZenPlugin).mount('#app');
```

按需 `import { CronZen } from '@cron-zen/vue3'` 即可，不必装插件。

## 下一步

- [任意 UI 库集成](./any-ui)
- [在线 Playground](./playground)
- [与 cron.ren 的差异](./vs-cron-ren)
- [API · vue3](/api/vue3) / [API · core](/api/core)
