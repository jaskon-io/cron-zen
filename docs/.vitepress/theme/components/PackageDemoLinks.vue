<script setup lang="ts">
/**
 * @description 各包独立 Demo 入口（新窗口打开，文档内不嵌 iframe）
 * @example
 * <PackageDemoLinks />
 */
import { withBase } from 'vitepress';

const demos = [
  {
    id: 'vanilla',
    label: '@cron-zen/vanilla',
    href: '/examples/vanilla.html',
    note: '无框架 · script 直引',
  },
  {
    id: 'react',
    label: '@cron-zen/react',
    href: '/examples/react.html',
    note: 'React 18 · ESM',
  },
  {
    id: 'vue2',
    label: '@cron-zen/vue2',
    href: '/examples/vue2.html',
    note: 'Vue 2.7 · ESM',
  },
  {
    id: 'vue3',
    label: '@cron-zen/vue3',
    href: '/examples/vue3.html',
    note: 'Vue 3 · 整页编辑器',
  },
  {
    id: 'core',
    label: '@cron-zen/core',
    href: '/examples/core.html',
    note: '只要引擎 · 无 UI',
  },
] as const;
</script>

<template>
  <div class="cz-demos">
    <a
      v-for="d in demos"
      :key="d.id"
      class="cz-demos__card"
      :href="withBase(d.href)"
      target="_blank"
      rel="noopener"
    >
      <span class="cz-demos__label">{{ d.label }}</span>
      <span class="cz-demos__note">{{ d.note }} · 新窗口</span>
    </a>
  </div>
</template>

<style scoped>
.cz-demos {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  margin: 1rem 0 1.5rem;
}

.cz-demos__card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  text-decoration: none !important;
  color: inherit !important;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.cz-demos__card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px var(--vp-c-brand-soft);
}

.cz-demos__label {
  font-size: 0.92rem;
  font-weight: 650;
  color: var(--vp-c-brand-1);
}

.cz-demos__note {
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}
</style>
