<script setup lang="ts">
/**
 * @description 单字段配置编辑器（骨架：every / specific / range / step / list / unset）
 */
import { computed, watch, ref } from 'vue';
import type { CronFieldMode, CronFieldName, CronFieldState } from '@cron-zen/core';
import { FIELD_RANGES } from '@cron-zen/core';

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

const mode = ref<CronFieldMode>(props.modelValue.mode);
const specific = ref(props.modelValue.value ?? String(range.value.min));
const rangeStart = ref(props.modelValue.value ?? String(range.value.min));
const rangeEnd = ref(props.modelValue.secondary ?? String(range.value.max));
const stepBase = ref(props.modelValue.value && props.modelValue.value !== '*' ? props.modelValue.value : String(range.value.min));
const stepValue = ref(props.modelValue.secondary ?? '1');
const listValue = ref((props.modelValue.values ?? []).join(',') || props.modelValue.value || '');

watch(
  () => props.modelValue,
  (v) => {
    mode.value = v.mode;
    if (v.mode === 'specific') specific.value = v.value ?? specific.value;
    if (v.mode === 'range') {
      rangeStart.value = v.value ?? rangeStart.value;
      rangeEnd.value = v.secondary ?? rangeEnd.value;
    }
    if (v.mode === 'step') {
      stepBase.value = v.value && v.value !== '*' ? v.value : stepBase.value;
      stepValue.value = v.secondary ?? stepValue.value;
    }
    if (v.mode === 'list') {
      listValue.value = (v.values ?? []).join(',') || v.value || '';
    }
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
 * @description 根据当前表单控件拼装字段状态并上抛
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
    case 'specific':
      next = { mode: 'specific', raw: specific.value, value: specific.value };
      break;
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
      const values = listValue.value
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
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

watch(mode, () => emitState());
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
      <label>
        指定值（{{ range.min }}-{{ range.max }}）
        <input
          v-model="specific"
          type="number"
          :min="range.min"
          :max="range.max"
          :disabled="disabled"
          @change="emitState"
        />
      </label>
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

    <div v-else-if="mode === 'list'" class="cz-field__controls">
      <label>
        枚举值（逗号分隔）
        <input
          v-model="listValue"
          type="text"
          placeholder="1,3,5"
          :disabled="disabled"
          @change="emitState"
        />
      </label>
    </div>

    <p v-else-if="mode === 'every'" class="cz-field__hint">每{{ name === 'week' ? '周' : '' }}单位都触发（*）</p>
    <p v-else-if="mode === 'unset'" class="cz-field__hint">不指定该字段（?），用于日/周互斥</p>
  </div>
</template>
