<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { withBase } from 'vitepress';

/**
 * @description Embed the deployed playground with loading / error fallbacks.
 */
const src = withBase('/playground/');
const loaded = ref(false);
const failed = ref(false);
const timedOut = ref(false);

onMounted(() => {
  window.setTimeout(() => {
    if (!loaded.value) timedOut.value = true;
  }, 12000);
});

function onLoad() {
  loaded.value = true;
  failed.value = false;
  timedOut.value = false;
}

function onError() {
  failed.value = true;
}
</script>

<template>
  <div class="cz-playground">
    <div v-if="!loaded && !failed" class="cz-playground__status" aria-live="polite">
      <span class="cz-playground__spinner" />
      <span>正在加载 Playground…</span>
      <p v-if="timedOut" class="cz-playground__hint">
        若长时间空白，请
        <a :href="src" target="_blank" rel="noopener">新窗口打开</a>
        （首包含 Element Plus，体积较大）。
      </p>
    </div>

    <div v-if="failed" class="cz-playground__status cz-playground__status--error">
      <p>Playground 未能加载。</p>
      <a class="cz-playground__btn" :href="src" target="_blank" rel="noopener">新窗口打开</a>
    </div>

    <iframe
      class="cz-playground__frame"
      :class="{ 'is-ready': loaded }"
      :src="src"
      title="cron-zen playground"
      loading="lazy"
      @load="onLoad"
      @error="onError"
    />

    <p class="cz-playground__actions">
      <a class="cz-playground__btn" :href="src" target="_blank" rel="noopener">新窗口打开</a>
    </p>
  </div>
</template>

<style scoped>
.cz-playground {
  position: relative;
  margin: 1rem 0 0.5rem;
}

.cz-playground__frame {
  width: 100%;
  height: min(78vh, 880px);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.cz-playground__frame.is-ready {
  opacity: 1;
}

.cz-playground__status {
  position: absolute;
  inset: 0 0 48px 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 14px;
  pointer-events: none;
}

.cz-playground__status--error {
  pointer-events: auto;
}

.cz-playground__hint {
  margin: 8px 16px 0;
  max-width: 36rem;
  text-align: center;
  font-size: 13px;
  line-height: 1.5;
  pointer-events: auto;
}

.cz-playground__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--vp-c-brand-soft);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: cz-spin 0.8s linear infinite;
}

.cz-playground__actions {
  margin-top: 12px;
}

.cz-playground__btn {
  display: inline-flex;
  align-items: center;
  padding: 0 18px;
  height: 36px;
  border-radius: 20px;
  background: var(--vp-c-brand-1);
  color: #fff !important;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none !important;
}

.cz-playground__btn:hover {
  background: var(--vp-c-brand-2);
}

@keyframes cz-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
