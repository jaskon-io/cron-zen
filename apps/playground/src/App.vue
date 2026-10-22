<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';

const cron = ref('0 0 2 * * ? *');

const presets = [
  { label: '每天 02:00', value: '0 0 2 * * ? *' },
  { label: '每 5 分钟', value: '0 */5 * * * ? *' },
  { label: '工作日 9 点', value: '0 0 9 ? * 2-6 *' },
  { label: '每月 1 号', value: '0 0 0 1 * ? *' },
  { label: '每月最后一天', value: '0 0 0 L * ? *' },
];

/**
 * @description 应用预设表达式
 * @param {string} value - Cron 表达式
 * @returns {void}
 */
function applyPreset(value: string): void {
  cron.value = value;
}
</script>

<template>
  <main class="pg">
    <header class="pg__header">
      <h1 class="pg__brand">cron-zen</h1>
      <p class="pg__lead">
        可视化 Cron 表达式生成器（交互参考
        <a href="https://www.cron.ren/index.html" target="_blank" rel="noreferrer">cron.ren</a>
        经典版）
      </p>
    </header>

    <div class="pg__meta">
      <div class="pg__presets">
        <button
          v-for="p in presets"
          :key="p.value"
          type="button"
          class="pg__chip"
          @click="applyPreset(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
      <label class="pg__expr-input">
        当前表达式
        <input v-model="cron" spellcheck="false" />
      </label>
    </div>

    <CronZen v-model="cron" />
  </main>
</template>
