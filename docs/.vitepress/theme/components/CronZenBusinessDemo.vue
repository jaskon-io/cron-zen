<script setup lang="ts">
/**
 * @description 文档站内嵌：业务弹层用法（按钮 → dialog → CronZen），无 iframe
 * @example
 * <CronZenBusinessDemo />
 */
import { ref } from 'vue';
import { CronZen } from '@cron-zen/vue3';

withDefaults(
  defineProps<{
    /** @description 弹层标题 */
    title?: string;
    /** @description 触发按钮文案 */
    buttonText?: string;
    /** @description 弹层内是否显示预览区（业务弹层默认 false） */
    showPreview?: boolean;
  }>(),
  {
    title: '配置 Cron',
    buttonText: '选择 Cron',
    showPreview: false,
  },
);

const cron = ref('0 0 9 ? * 2-6');
const draft = ref(cron.value);
const dialogRef = ref<HTMLDialogElement | null>(null);

/**
 * @description 打开弹层并拷贝当前值为草稿
 * @returns {void}
 */
function open() {
  draft.value = cron.value;
  dialogRef.value?.showModal();
}

/**
 * @description 取消并关闭
 * @returns {void}
 */
function cancel() {
  dialogRef.value?.close();
}

/**
 * @description 确定写回并关闭
 * @returns {void}
 */
function confirm() {
  cron.value = draft.value;
  dialogRef.value?.close();
}
</script>

<template>
  <div class="cz-biz">
    <div class="cz-biz__row">
      <input
        class="cz-biz__input"
        type="text"
        readonly
        :value="cron"
        aria-label="当前 Cron"
        @click="open"
      />
      <button type="button" class="cz-biz__btn" @click="open">
        {{ buttonText }}
      </button>
    </div>
    <p class="cz-biz__hint">
      文档页不嵌 iframe：点按钮用原生
      <code>&lt;dialog&gt;</code>
      挂载
      <code>CronZen</code>
      （与 Element Modal / Ant Modal 同一交互模型）。
    </p>

    <dialog ref="dialogRef" class="cz-biz__dialog" @cancel="cancel">
      <form class="cz-biz__dialog-head" method="dialog" @submit.prevent>
        <h3 class="cz-biz__dialog-title">{{ title }}</h3>
        <button type="button" class="cz-biz__icon" aria-label="关闭" @click="cancel">
          ×
        </button>
      </form>
      <div class="cz-biz__dialog-body">
        <CronZen
          v-model="draft"
          :show-preview="showPreview"
          :next-count="5"
          locale="zh-CN"
          time-zone="Asia/Shanghai"
        />
      </div>
      <div class="cz-biz__dialog-foot">
        <button type="button" class="cz-biz__btn cz-biz__btn--ghost" @click="cancel">
          取消
        </button>
        <button type="button" class="cz-biz__btn" @click="confirm">确定</button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.cz-biz {
  margin: 1rem 0 1.5rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.cz-biz__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cz-biz__input {
  flex: 1 1 12rem;
  min-width: 0;
  height: 36px;
  padding: 0 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  cursor: pointer;
}

.cz-biz__btn {
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.cz-biz__btn:hover {
  background: var(--vp-c-brand-2);
}

.cz-biz__btn--ghost {
  background: transparent;
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.cz-biz__btn--ghost:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: transparent;
}

.cz-biz__hint {
  margin: 0.65rem 0 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.cz-biz__dialog {
  width: min(760px, calc(100vw - 2rem));
  max-height: min(88vh, 900px);
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.28);
}

.cz-biz__dialog::backdrop {
  background: rgba(15, 23, 42, 0.45);
}

.cz-biz__dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin: 0;
}

.cz-biz__dialog-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.cz-biz__icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.cz-biz__icon:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.cz-biz__dialog-body {
  padding: 0.75rem 1rem;
  overflow: auto;
  max-height: min(62vh, 640px);
}

.cz-biz__dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
