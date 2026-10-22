<script lang="ts">
/**
 * @description 单字段配置编辑器（Vue2 Options API）
 */
import Vue, { PropType } from 'vue';
import type { CronFieldMode, CronFieldName, CronFieldState } from '@cron-zen/core';
import { FIELD_RANGES } from '@cron-zen/core';
import ValueGrid from './ValueGrid.vue';

const WEEK_LABELS: Record<number, string> = {
  0: '日',
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日',
};

export default Vue.extend({
  name: 'FieldEditor',
  components: { ValueGrid },
  props: {
    /** @description 字段名 */
    name: { type: String as PropType<CronFieldName>, required: true },
    /** @description 字段状态（v-model） */
    value: { type: Object as PropType<CronFieldState>, required: true },
    /** @description 是否禁用 */
    disabled: { type: Boolean, default: false },
    /** @description 禁用原因 */
    disabledReason: { type: String, default: '' },
  },
  data() {
    const range = FIELD_RANGES[this.name];
    return {
      mode: this.value.mode as CronFieldMode,
      specificVals: [Number(this.value.value ?? range.min) || range.min] as number[],
      listVals: ((this.value.values ?? []).map((v) => Number(v)).filter((n) => Number.isFinite(n))) as number[],
      rangeStart: this.value.value ?? String(range.min),
      rangeEnd: this.value.secondary ?? String(range.max),
      stepBase:
        this.value.value && this.value.value !== '*'
          ? this.value.value
          : String(range.min),
      stepValue: this.value.secondary ?? '1',
      weekLabels: WEEK_LABELS,
      syncingFromProp: false,
    };
  },
  computed: {
    range(): { min: number; max: number } {
      return FIELD_RANGES[this.name];
    },
    yearWindow(): { min: number; max: number } {
      const y = new Date().getFullYear();
      return { min: y, max: y + 9 };
    },
    gridMin(): number {
      return this.name === 'year' ? this.yearWindow.min : this.range.min;
    },
    gridMax(): number {
      return this.name === 'year' ? this.yearWindow.max : this.range.max;
    },
    modes(): { value: CronFieldMode; label: string }[] {
      const base: { value: CronFieldMode; label: string }[] = [
        { value: 'every', label: '每' },
        { value: 'specific', label: '指定' },
        { value: 'range', label: '区间' },
        { value: 'step', label: '周期' },
        { value: 'list', label: '枚举' },
      ];
      if (this.name === 'day' || this.name === 'week') {
        base.push({ value: 'unset', label: '不指定 (?)' });
      }
      return base;
    },
  },
  watch: {
    value: {
      deep: true,
      handler(v: CronFieldState) {
        this.syncingFromProp = true;
        this.mode = v.mode;
        if (v.mode === 'specific') {
          const n = Number(v.value);
          this.specificVals = [Number.isFinite(n) ? n : this.range.min];
        }
        if (v.mode === 'list') {
          this.listVals = (v.values ?? [])
            .map((x) => Number(x))
            .filter((n) => Number.isFinite(n));
        }
        if (v.mode === 'range') {
          this.rangeStart = v.value ?? this.rangeStart;
          this.rangeEnd = v.secondary ?? this.rangeEnd;
        }
        if (v.mode === 'step') {
          this.stepBase = v.value && v.value !== '*' ? v.value : this.stepBase;
          this.stepValue = v.secondary ?? this.stepValue;
        }
        Promise.resolve().then(() => {
          this.syncingFromProp = false;
        });
      },
    },
    mode() {
      if (this.syncingFromProp) return;
      if (this.mode === 'list' && this.listVals.length === 0) {
        this.listVals = [this.range.min];
      }
      this.emitState();
    },
  },
  methods: {
    /**
     * @description 拼装并上抛字段状态
     * @returns {void}
     */
    emitState(): void {
      if (this.disabled) return;
      let next: CronFieldState;
      switch (this.mode) {
        case 'every':
          next = { mode: 'every', raw: '*' };
          break;
        case 'unset':
          next = { mode: 'unset', raw: '?' };
          break;
        case 'specific': {
          const v = String(this.specificVals[0] ?? this.range.min);
          next = { mode: 'specific', raw: v, value: v };
          break;
        }
        case 'range':
          next = {
            mode: 'range',
            raw: `${this.rangeStart}-${this.rangeEnd}`,
            value: this.rangeStart,
            secondary: this.rangeEnd,
          };
          break;
        case 'step':
          next = {
            mode: 'step',
            raw: `${this.stepBase}/${this.stepValue}`,
            value: this.stepBase,
            secondary: this.stepValue,
          };
          break;
        case 'list': {
          const values = this.listVals.map(String);
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
      this.$emit('input', next);
    },
    /**
     * @description 指定模式格子变更
     * @param {number[]} vals - 选中值
     * @returns {void}
     */
    onSpecific(vals: number[]): void {
      this.specificVals = vals.length ? vals : [this.range.min];
      this.emitState();
    },
    /**
     * @description 枚举模式格子变更
     * @param {number[]} vals - 选中值
     * @returns {void}
     */
    onList(vals: number[]): void {
      this.listVals = vals;
      this.emitState();
    },
  },
});
</script>

<template>
  <div class="cz-field" :class="{ 'cz-field--disabled': disabled }">
    <p v-if="disabled && disabledReason" class="cz-field__lock">{{ disabledReason }}</p>

    <div class="cz-field__modes" role="radiogroup">
      <label v-for="m in modes" :key="m.value" class="cz-field__mode">
        <input v-model="mode" type="radio" :value="m.value" :disabled="disabled" />
        <span>{{ m.label }}</span>
      </label>
    </div>

    <div v-if="mode === 'specific'" class="cz-field__controls">
      <p class="cz-field__hint">点击选择一个值（{{ gridMin }}-{{ gridMax }}）</p>
      <ValueGrid
        :min="gridMin"
        :max="gridMax"
        :value="specificVals"
        :multiple="false"
        :disabled="disabled"
        :labels="name === 'week' ? weekLabels : undefined"
        @input="onSpecific"
      />
    </div>

    <div v-else-if="mode === 'list'" class="cz-field__controls">
      <p class="cz-field__hint">可多选枚举值</p>
      <ValueGrid
        :min="gridMin"
        :max="gridMax"
        :value="listVals"
        :multiple="true"
        :disabled="disabled"
        :labels="name === 'week' ? weekLabels : undefined"
        @input="onList"
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
