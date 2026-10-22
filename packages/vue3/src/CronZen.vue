<script setup lang="ts">
/**
 * @description Vue3 可视化 Cron 表达式生成器（参考经典生成器布局：Tab + 配置 + 底部字段表/表达式/近10次）
 * @example
 * <CronZen v-model="cron" />
 */
import { computed, toRef } from 'vue';
import type { CronFieldName, CronFieldState } from '@cron-zen/core';
import { getCronTabs, stringifyField } from '@cron-zen/core';
import { useCronZen } from './composables/useCronZen';
import FieldEditor from './components/FieldEditor.vue';
import './styles/cron-zen.css';

const props = withDefaults(
  defineProps<{
    /**
     * @description 双向绑定的 Cron 表达式（v-model）
     */
    modelValue?: string;
    /**
     * @description 生成防抖毫秒数
     */
    debounceMs?: number;
    /**
     * @description 预览最近触发次数
     */
    nextCount?: number;
  }>(),
  {
    modelValue: '0 0 0 * * ? *',
    debounceMs: 300,
    nextCount: 10,
  },
);

const emit = defineEmits<{
  /**
   * @description 表达式变更（v-model）
   * @param {string} value - 新表达式
   */
  (e: 'update:modelValue', value: string): void;
  /**
   * @description 状态变更
   * @param {import('@cron-zen/core').CronState} state - 可视化状态
   */
  (e: 'change', state: import('@cron-zen/core').CronState): void;
}>();

const modelRef = toRef(props, 'modelValue');

const writableModel = computed({
  get: () => modelRef.value,
  set: (val: string | undefined) => {
    if (val != null) emit('update:modelValue', val);
  },
});

const {
  state,
  activeTab,
  expression,
  description,
  nextRuns,
  validation,
  hint,
  updateField,
  reset,
} = useCronZen({
  modelValue: writableModel,
  debounceMs: props.debounceMs,
  nextCount: props.nextCount,
});

const tabs = getCronTabs();
const currentField = computed(() => state.value[activeTab.value]);

const fieldParts = computed(() =>
  tabs.map((tab) => ({
    name: tab.name,
    label: tab.label,
    value: stringifyField(state.value[tab.name]),
  })),
);

const dayLocked = computed(
  () =>
    state.value.week.mode !== 'every' &&
    state.value.week.mode !== 'unset' &&
    activeTab.value === 'day',
);

const weekLocked = computed(
  () =>
    state.value.day.mode !== 'every' &&
    state.value.day.mode !== 'unset' &&
    activeTab.value === 'week',
);

const mutexTip = computed(() => {
  if (dayLocked.value) {
    return '已配置「周」字段，日字段需保持为 ?（日周互斥）';
  }
  if (weekLocked.value) {
    return '已配置「日」字段，周字段需保持为 ?（日周互斥）';
  }
  return '';
});

/**
 * @description 切换顶部 Tab
 * @param {CronFieldName} name - 字段名
 * @returns {void}
 */
function onTab(name: CronFieldName): void {
  activeTab.value = name;
}

/**
 * @description 字段编辑回调
 * @param {CronFieldState} field - 新字段状态
 * @returns {void}
 */
function onFieldUpdate(field: CronFieldState): void {
  updateField(activeTab.value, field);
  emit('change', state.value);
}

/**
 * @description 复制当前表达式
 * @returns {Promise<void>}
 */
async function copyExpression(): Promise<void> {
  try {
    await navigator.clipboard.writeText(expression.value);
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="cron-zen" data-cron-zen>
    <nav class="cron-zen__tabs" aria-label="Cron 字段">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        type="button"
        class="cron-zen__tab"
        :class="{ 'is-active': activeTab === tab.name }"
        @click="onTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <section class="cron-zen__body" aria-label="字段配置">
      <p v-if="mutexTip" class="cron-zen__mutex">{{ mutexTip }}</p>
      <FieldEditor
        :name="activeTab"
        :model-value="currentField"
        :disabled="dayLocked || weekLocked"
        :disabled-reason="mutexTip"
        @update:model-value="onFieldUpdate"
      />
    </section>

    <section class="cron-zen__preview" aria-label="预览">
      <div class="cron-zen__fields">
        <div class="cron-zen__fields-head">
          <span v-for="p in fieldParts" :key="p.name">{{ p.label }}</span>
        </div>
        <div class="cron-zen__fields-body">
          <code v-for="p in fieldParts" :key="p.name + '-v'">{{ p.value }}</code>
        </div>
      </div>

      <div class="cron-zen__preview-block">
        <div class="cron-zen__preview-title">
          <h3>表达式</h3>
          <div class="cron-zen__actions">
            <button type="button" class="cron-zen__btn" @click="copyExpression">复制</button>
            <button type="button" class="cron-zen__btn" @click="reset">重置</button>
          </div>
        </div>
        <pre class="cron-zen__expr">{{ expression }}</pre>
        <p class="cron-zen__desc">{{ description }}</p>
      </div>

      <div class="cron-zen__preview-block">
        <h3>近 {{ nextCount }} 次执行时间</h3>
        <ol v-if="nextRuns.length" class="cron-zen__runs">
          <li v-for="(t, i) in nextRuns" :key="i">{{ t }}</li>
        </ol>
        <p v-else class="cron-zen__desc">当前模式暂无法估算触发时间（如 L / W / #）</p>
      </div>

      <p
        v-if="hint"
        class="cron-zen__hint"
        :class="{ 'is-error': !validation.valid }"
      >
        {{ hint }}
      </p>
    </section>
  </div>
</template>
