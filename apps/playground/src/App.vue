<script setup lang="ts">
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';

const cron = ref('0 0 2 * * ? *');

const presets = [
  { label: '每天 02:00', value: '0 0 2 * * ? *' },
  { label: '每 5 分钟', value: '0 */5 * * * ? *' },
  { label: '工作日 9 点', value: '0 0 9 ? * 1-5 *' },
  { label: '每月 1 号', value: '0 0 0 1 * ? *' },
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
    <h1 class="pg__brand">cron-zen</h1>
    <p class="pg__lead">
      可视化 Cron 表达式生成器 Playground。修改字段后可即时预览表达式、自然语言与最近触发时间。
    </p>

    <div class="pg__panel">
      <div class="pg__meta">
        <div class="pg__presets" aria-label="预设">
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
        <label>
          当前表达式（可手动编辑）
          <input v-model="cron" spellcheck="false" />
        </label>
      </div>

      <CronZen v-model="cron" />
    </div>

    <p class="pg__footer">@cron-zen/vue3 · local playground</p>
  </main>
</template>
