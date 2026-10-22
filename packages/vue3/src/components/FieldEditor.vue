<script setup lang="ts">
/**
 * @description 单字段配置编辑器：模式切换 + 数值格子 / 区间 / 周期
 */
import { computed, watch, ref } from 'vue';
import type { CronFieldMode, CronFieldName, CronFieldState } from '@cron-zen/core';
import { FIELD_RANGES } from '@cron-zen/core';
import ValueGrid from './ValueGrid.vue';

const props = defineProps<{
  /** @description 字段名 */
  name: CronFieldName;
  /** @description 字段状态 */
  modelValue: CronFieldState;
  /** @description 是否禁用（如日周互斥锁定） */
  disabled?: boolean;
  /** @description 禁用原因提示 */
  disabledReason?: string;
}>();

const emit = defineEmits<{
  /**
   * @description 字段状态变更
   * @param {CronFieldState} value - 新状态
   */
  (e: 'update:modelValue', value: CronFieldState): void;
}>();

const range = computed(() => FIELD_RANGES[props.name]);

/** 年字段候选过多，格子仅展示近 10 年窗口 */
const yearWindow = computed(() => {
  const y = new Date().getFullYear();
  return { min: y, max: y + 9 };
});

const gridMin = computed(() => (props.name === 'year' ? yearWindow.value.min : range.value.min));
const gridMax = computed(() => (props.name === 'year' ? yearWindow.value.max : range.value.max));

const weekLabels: Record<number, string> = {
  0: '日',
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日',
};

const mode = ref<CronFieldMode>(props.modelValue.mode);
const specificVals = ref<number[]>([
  Number(props.modelValue.value ?? range.value.min) || range.value.min,
]);
const listVals = ref<number[]>(
  (props.modelValue.values ?? [])
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n)),
);
const rangeStart = ref(props.modelValue.value ?? String(range.value.min));
const rangeEnd = ref(props.modelValue.secondary ?? String(range.value.max));
const stepBase = ref(
  props.modelValue.value && props.modelValue.value !== '*'
    ? props.modelValue.value
    : String(range.value.min),
);
const stepValue = ref(props.modelValue.secondary ?? '1');

/** 父级回写时跳过 mode watch，避免 props→emit 回环 */
let syncingFromProp = false;

watch(
  () => props.modelValue,
  (v) => {
    syncingFromProp = true;
    mode.value = v.mode;
    if (v.mode === 'specific') {
      const n = Number(v.value);
      specificVals.value = [Number.isFinite(n) ? n : range.value.min];
    }
    if (v.mode === 'list') {
      listVals.value = (v.values ?? [])
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n));
    }
    if (v.mode === 'range') {
      rangeStart.value = v.value ?? rangeStart.value;
      rangeEnd.value = v.secondary ?? rangeEnd.value;
    }
    if (v.mode === 'step') {
      stepBase.value = v.value && v.value !== '*' ? v.value : stepBase.value;
      stepValue.value = v.secondary ?? stepValue.value;
    }
    Promise.resolve().then(() => {
      syncingFromProp = false;
    });
  },
  { deep: true },
);

const modes = computed(() => {
  const base: { value: CronFieldMode; label: string }[] = [
    { value: 'every', label: '每' },
    { value: 'specific', label: '指定' },
    { value: 'range', label: '区间' },
    { value: 'step', label: '周期' },
    { value: 'list', label: '枚举' },
  ];
  if (props.name === 'day' || props.name === 'week') {
    base.push({ value: 'unset', label: '不指定 (?)' });
  }
  return base;
});

/**
 * @description 根据当前控件拼装字段状态并上抛
 * @returns {void}
 */
function emitState(): void {
  if (props.disabled) return;
  let next: CronFieldState;
  switch (mode.value) {
    case 'every':
      next = { mode: 'every', raw: '*' };
      break;
    case 'unset':
      next = { mode: 'unset', raw: '?' };
      break;
    case 'specific': {
      const v = String(specificVals.value[0] ?? range.value.min);
      next = { mode: 'specific', raw: v, value: v };
      break;
    }
    case 'range':
      next = {
        mode: 'range',
        raw: `${rangeStart.value}-${rangeEnd.value}`,
        value: rangeStart.value,
        secondary: rangeEnd.value,
      };
      break;
    case 'step':
      next = {
        mode: 'step',
        raw: `${stepBase.value}/${stepValue.value}`,
        value: stepBase.value,
        secondary: stepValue.value,
      };
      break;
    case 'list': {
      const values = listVals.value.map(String);
      next = {
        mode: 'list',
        raw: values.join(','),
        value: values.join(','),
        values,
      };
      break;
    }
    default:
      next = { mode: 'every', raw: '*' };
  }
  emit('update:modelValue', next);
}

/**
 * @description 指定模式格子变更
 * @param {number[]} vals - 选中值
 * @returns {void}
 */
function onSpecific(vals: number[]): void {
  specificVals.value = vals.length ? vals : [range.value.min];
  emitState();
}

/**
 * @description 枚举模式格子变更
 * @param {number[]} vals - 选中值
 * @returns {void}
 */
function onList(vals: number[]): void {
  listVals.value = vals;
  emitState();
}

watch(mode, () => {
  if (syncingFromProp) return;
  if (mode.value === 'list' && listVals.value.length === 0) {
    listVals.value = [range.value.min];
  }
  emitState();
});
</script>

<template>
  <div class="cz-field" :class="{ 'cz-field--disabled': disabled }">
    <p v-if="disabled && disabledReason" class="cz-field__lock">
      {{ disabledReason }}
    </p>

    <div class="cz-field__modes" role="radiogroup">
      <label v-for="m in modes" :key="m.value" class="cz-field__mode">
        <input
          v-model="mode"
          type="radio"
          :value="m.value"
          :disabled="disabled"
        />
        <span>{{ m.label }}</span>
      </label>
    </div>

    <div v-if="mode === 'specific'" class="cz-field__controls">
      <p class="cz-field__hint">点击选择一个值（{{ gridMin }}-{{ gridMax }}）</p>
      <ValueGrid
        :min="gridMin"
        :max="gridMax"
        :model-value="specificVals"
        :multiple="false"
        :disabled="disabled"
        :labels="name === 'week' ? weekLabels : undefined"
        @update:model-value="onSpecific"
      />
    </div>

    <div v-else-if="mode === 'list'" class="cz-field__controls">
      <p class="cz-field__hint">可多选枚举值</p>
      <ValueGrid
        :min="gridMin"
        :max="gridMax"
        :model-value="listVals"
        :multiple="true"
        :disabled="disabled"
        :labels="name === 'week' ? weekLabels : undefined"
        @update:model-value="onList"
      />
    </div>

    <div v-else-if="mode === 'range'" class="cz-field__controls cz-field__controls--row">
      <label>
        从
        <input
          v-model="rangeStart"
          type="number"
          :min="range.min"
          :max="range.max"
          :disabled="disabled"
          @change="emitState"
        />
      </label>
      <label>
        到
        <input
          v-model="rangeEnd"
          type="number"
          :min="range.min"
          :max="range.max"
          :disabled="disabled"
          @change="emitState"
        />
      </label>
    </div>

    <div v-else-if="mode === 'step'" class="cz-field__controls cz-field__controls--row">
      <label>
        从
        <input
          v-model="stepBase"
          type="number"
          :min="range.min"
          :max="range.max"
          :disabled="disabled"
          @change="emitState"
        />
      </label>
      <label>
        每
        <input
          v-model="stepValue"
          type="number"
          min="1"
          :max="range.max"
          :disabled="disabled"
          @change="emitState"
        />
        执行一次
      </label>
    </div>

    <p v-else-if="mode === 'every'" class="cz-field__hint">
      每一{{ name === 'week' ? '周' : '' }}单位都触发（*）
    </p>
    <p v-else-if="mode === 'unset'" class="cz-field__hint">
      不指定该字段（?），用于日/周互斥
    </p>
  </div>
</template>
