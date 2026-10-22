<script setup lang="ts">
/**
 * @description Element Plus 项目用法：输入框 + 可自定义按钮 + 精简 Cron 弹窗
 */
import { ref } from 'vue';
import { CronZenPicker } from '@cron-zen/vue3';

const cron = ref('0 0 2 * * ? *');
const cronCustom = ref('0 */5 * * * ? *');
</script>

<template>
  <main class="pg">
    <header class="pg__header">
      <h1 class="pg__brand">cron-zen</h1>
      <p class="pg__lead">项目内用法：Element Plus 输入框旁按钮打开弹窗，仅配置 Cron，确定后回显。</p>
    </header>

    <section class="pg__card">
      <h2 class="pg__card-title">默认按钮</h2>
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
