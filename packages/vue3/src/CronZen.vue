<script setup lang="ts">
/**
 * @description Vue3 可视化 Cron 表达式生成器（对齐 cron.ren：Tab + 配置 + 可选预览 + 日周联动）
 * @example
 * <CronZen v-model="cron" />
 * <CronZen v-model="cron" :show-preview="false" />
 */
import { computed, onBeforeUnmount, ref, toRef } from 'vue';
import type { CronFieldName, CronFieldState, WeekFormat } from '@cron-zen/core';
import { getCronPresets, getCronTabs, getUiMessages } from '@cron-zen/core';
import { displayFieldValue, useCronZen } from './composables/useCronZen';
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
    /**
     * @description 是否展示底部字段表 / 表达式 / 近 N 次（弹窗场景建议 false）
     */
    showPreview?: boolean;
    /**
     * @description IANA 时区（近 N 次）；默认运行环境本地
     */
    timeZone?: string;
    /**
     * @description 自然语言语言：zh-CN | en-US
     */
    locale?: string;
  }>(),
  {
    // 无值保持空，不注入默认表达式；UI 仍用「每*」原始态供编辑
    modelValue: '',
    // 对齐 cron.ren：配置即时反映到表达式；需要节流时可显式传 debounceMs
    debounceMs: 0,
    nextCount: 10,
    showPreview: true,
    timeZone: undefined,
    locale: 'zh-CN',
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
  prevRuns,
  validation,
  hint,
  weekFormat,
  updateField,
  setWeekFormat,
  loadExpression,
  reset,
  flush,
} = useCronZen({
  modelValue: writableModel,
  debounceMs: props.debounceMs,
  nextCount: props.nextCount,
  showPreview: props.showPreview,
  timeZone: toRef(props, 'timeZone'),
  locale: toRef(props, 'locale'),
});

const tabs = computed(() => getCronTabs(props.locale));
const ui = computed(() => getUiMessages(props.locale));
const presets = computed(() => getCronPresets(props.locale));
const presetId = ref('');
const currentField = computed(() => state.value[activeTab.value]);
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const fieldParts = computed(() =>
  tabs.value.map((tab) => ({
    name: tab.name,
    label: tab.label,
    value: displayFieldValue(tab.name, state.value[tab.name], weekFormat.value),
  })),
);

/** 日被周占用时的提示（不锁死编辑，选具体值会自动把另一侧改为 ?） */
const mutexTip = computed(() => {
  const dayConcrete =
    state.value.day.mode !== 'every' && state.value.day.mode !== 'unset';
  const weekConcrete =
    state.value.week.mode !== 'every' && state.value.week.mode !== 'unset';

  if (activeTab.value === 'day' && weekConcrete) {
    return ui.value.mutexDayOccupied;
  }
  if (activeTab.value === 'week' && dayConcrete) {
    return ui.value.mutexWeekOccupied;
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
 * @description 字段编辑回调（确保 change 与最新 state/expression 同步）
 * @param {CronFieldState} field - 新字段状态
 * @returns {void}
 */
function onFieldUpdate(field: CronFieldState): void {
  updateField(activeTab.value, field);
  // 非日/周走防抖；此处先抛当前 state，表达式随后经 v-model 同步
  emit('change', state.value);
}

/**
 * @description 周字段写法变更
 * @param {WeekFormat} format - number | abbr
 * @returns {void}
 */
function onWeekFormat(format: WeekFormat): void {
  setWeekFormat(format);
  emit('change', state.value);
}

/**
 * @description 应用常用模板
 * @param {Event} e - select change
 * @returns {void}
 */
function onPresetChange(e: Event): void {
  const id = (e.target as HTMLSelectElement).value;
  presetId.value = id;
  if (!id) return;
  const preset = presets.value.find((p) => p.id === id);
  if (!preset) return;
  loadExpression(preset.expression);
}

/**
 * @description 重置并回到「秒」Tab
 * @returns {void}
 */
function onReset(): void {
  reset();
  activeTab.value = 'second';
  emit('change', state.value);
}

/**
 * @description 复制当前表达式（带短暂「已复制」反馈）
 * @returns {Promise<void>}
 */
async function copyExpression(): Promise<void> {
  flush();
  try {
    await navigator.clipboard.writeText(expression.value);
    copied.value = true;
    if (copiedTimer != null) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
      copiedTimer = null;
    }, 1500);
  } catch {
    // ignore
  }
}

onBeforeUnmount(() => {
  if (copiedTimer != null) {
    clearTimeout(copiedTimer);
    copiedTimer = null;
  }
});
</script>

<template>
  <div class="cron-zen" :class="{ 'cron-zen--compact': !showPreview }" data-cron-zen>
    <nav class="cron-zen__tabs" :aria-label="ui.ariaTabs">
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

    <section class="cron-zen__body" :aria-label="ui.ariaBody">
      <label class="cron-zen__presets">
        <span class="cron-zen__presets-label">{{ ui.presetsLabel }}</span>
        <select
          class="cron-zen__presets-select"
          :value="presetId"
          @change="onPresetChange"
        >
          <option value="">{{ ui.presetsPlaceholder }}</option>
          <option v-for="p in presets" :key="p.id" :value="p.id">
            {{ p.label }}
          </option>
        </select>
      </label>
      <p v-if="mutexTip" class="cron-zen__mutex">{{ mutexTip }}</p>
      <FieldEditor
        :key="activeTab"
        :name="activeTab"
        :model-value="currentField"
        :week-format="weekFormat"
        :locale="locale"
        @update:model-value="onFieldUpdate"
        @update:week-format="onWeekFormat"
      />
    </section>

    <p
      v-if="!showPreview && hint"
      class="cron-zen__hint cron-zen__hint--compact"
      :class="{ 'is-error': !validation.valid }"
    >
      {{ hint }}
    </p>

    <section v-if="showPreview" class="cron-zen__preview" :aria-label="ui.ariaPreview">
      <div class="cron-zen__fields">
        <div class="cron-zen__fields-head">
          <button
            v-for="p in fieldParts"
            :key="p.name"
            type="button"
            class="cron-zen__field-tab"
            :class="{ 'is-active': activeTab === p.name }"
            @click="onTab(p.name)"
          >
            {{ p.label }}
          </button>
        </div>
        <div class="cron-zen__fields-body">
          <button
            v-for="p in fieldParts"
            :key="p.name + '-v'"
            type="button"
            class="cron-zen__field-val"
            :class="{ 'is-active': activeTab === p.name }"
            :title="ui.editField(p.label)"
            @click="onTab(p.name)"
          >
            <code>{{ p.value }}</code>
          </button>
        </div>
      </div>

      <div class="cron-zen__preview-block">
        <div class="cron-zen__preview-title">
          <h3>{{ ui.expression }}</h3>
          <div class="cron-zen__actions">
            <button type="button" class="cron-zen__btn" @click="copyExpression">
              {{ copied ? ui.copied : ui.copy }}
            </button>
            <button type="button" class="cron-zen__btn" @click="onReset">{{ ui.reset }}</button>
          </div>
        </div>
        <pre class="cron-zen__expr">{{ expression }}</pre>
        <p class="cron-zen__desc">{{ description }}</p>
      </div>

      <div class="cron-zen__preview-block">
        <h3>{{ ui.nextRunsTitle(nextCount) }}</h3>
        <ol v-if="nextRuns.length" class="cron-zen__runs">
          <li v-for="(t, i) in nextRuns" :key="i">{{ t }}</li>
        </ol>
        <p v-else class="cron-zen__desc">{{ ui.cannotEstimate }}</p>
      </div>

      <div class="cron-zen__preview-block">
        <h3>{{ ui.prevRunsTitle(nextCount) }}</h3>
        <ol v-if="prevRuns.length" class="cron-zen__runs">
          <li v-for="(t, i) in prevRuns" :key="'p' + i">{{ t }}</li>
        </ol>
        <p v-else class="cron-zen__desc">{{ ui.cannotEstimate }}</p>
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
