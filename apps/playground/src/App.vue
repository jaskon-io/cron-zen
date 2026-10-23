<script setup lang="ts">
/**
 * @description Playground：完整 CronZen（模板 + prevRuns）+ Element Picker 示例
 */
import { ref } from 'vue';
import { CronZen, CronZenPicker } from '@cron-zen/vue3';
import '@cron-zen/vue3/style.css';

const cronFull = ref('0 0 9 ? * 2-6');
const cron = ref('* * * * * ? *');
const cronCustom = ref('0 */5 * * * ? *');
</script>

<template>
  <main class="pg">
    <header class="pg__header">
      <h1 class="pg__brand">cron-zen</h1>
      <p class="pg__lead">
        完整编辑器含顶部「常用模板」与预览区「近 N 次 / 近 N 次已触发」；下方为 Element Plus 弹窗集成示例。
      </p>
    </header>

    <section class="pg__card pg__card--wide">
      <h2 class="pg__card-title">完整编辑器（模板 + 预览）</h2>
      <CronZen v-model="cronFull" :next-count="5" locale="zh-CN" time-zone="Asia/Shanghai" />
      <p class="pg__value">当前值：<code>{{ cronFull }}</code></p>
    </section>

    <section class="pg__card">
      <h2 class="pg__card-title">默认按钮（Picker）</h2>
      <CronZenPicker v-model="cron" button-text="选择 Cron" />
      <p class="pg__value">当前值：<code>{{ cron }}</code></p>
    </section>

    <section class="pg__card">
      <h2 class="pg__card-title">自定义按钮</h2>
      <CronZenPicker v-model="cronCustom" readonly>
        <template #trigger="{ open, disabled }">
          <el-button type="success" :disabled="disabled" @click="open">
            自定义选择
          </el-button>
        </template>
      </CronZenPicker>
      <p class="pg__value">当前值：<code>{{ cronCustom }}</code></p>
    </section>
  </main>
</template>
