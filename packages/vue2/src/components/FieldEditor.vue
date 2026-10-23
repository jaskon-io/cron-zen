<script lang="ts">
/**
 * @description 单字段配置编辑器（Vue2 Options API，能力对齐 vue3）
 */
import Vue, { PropType } from 'vue';
import type {
  CronFieldMode,
  CronFieldName,
  CronFieldState,
  WeekFormat,
} from '@cron-zen/core';
import { FIELD_RANGES, QUARTZ_WEEK_UI_ORDER, getUiMessages } from '@cron-zen/core';
import ValueGrid from './ValueGrid.vue';

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
    /** @description 周字段输出写法 */
    weekFormat: { type: String as PropType<WeekFormat>, default: 'number' },
    /** @description UI 语言 zh-CN | en-US */
    locale: { type: String, default: 'zh-CN' },
  },
  data() {
    const range = FIELD_RANGES[this.name];
    const yearNow = new Date().getFullYear();
    return {
      modeRadioGroup: `cz-mode-${Math.random().toString(36).slice(2, 9)}`,
      weekFormatGroup: `cz-week-fmt-${Math.random().toString(36).slice(2, 9)}`,
      mode: (this.value.mode === 'specific' ? 'list' : this.value.mode) as CronFieldMode,
      rangeStart: Number(this.value.value ?? range.min) || range.min,
      rangeEnd:
        Number(this.value.secondary ?? Math.min(range.min + 1, range.max)) || range.min + 1,
      stepBase:
        this.value.value && this.value.value !== '*'
          ? Number(this.value.value) || range.min
          : range.min,
      stepValue: Number(this.value.secondary ?? 1) || 1,
      weekdayNear: Number(this.value.value ?? 1) || 1,
      nthOrder: Number(this.value.secondary ?? 1) || 1,
      nthWeekday: Number(this.value.value ?? 2) || 2,
      lastWeekday: Number(this.value.value ?? 2) || 2,
      listVals: ((this.value.values ?? [])
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))) as number[],
      weekOrder: [...QUARTZ_WEEK_UI_ORDER] as number[],
      yearNow,
      yearMax: yearNow + 23,
      syncingFromProp: false,
    };
  },
  computed: {
    range(): { min: number; max: number } {
      return FIELD_RANGES[this.name];
    },
    ui() {
      return getUiMessages(this.locale);
    },
    unitLabel(): string {
      return this.ui.editorUnits[this.name];
    },
    everyLabel(): string {
      return this.ui.every(this.unitLabel);
    },
    stepOnceUnit(): string {
      return this.name === 'day' ? this.ui.dayStepUnit : this.unitLabel;
    },
    weekLabels(): Record<number, string> {
      return { ...this.ui.weekDayEditor };
    },
    monthLabels(): Record<number, string> {
      return { ...this.ui.monthEditor };
    },
    weekOptions(): { value: number; label: string }[] {
      return QUARTZ_WEEK_UI_ORDER.map((value) => ({
        value,
        label: this.ui.weekDayEditor[value],
      }));
    },
    gridMin(): number {
      if (this.name === 'year') return this.yearNow;
      if (this.name === 'week') return 1;
      return this.range.min;
    },
    gridMax(): number {
      if (this.name === 'year') return this.yearMax;
      if (this.name === 'week') return 7;
      return this.range.max;
    },
    listDefaultValue(): number {
      return this.name === 'week' ? 2 : this.gridMin;
    },
  },
  watch: {
    name() {
      this.hydrate(this.value);
    },
    value: {
      deep: true,
      immediate: true,
      handler(v: CronFieldState) {
        this.syncingFromProp = true;
        this.hydrate(v);
        Promise.resolve().then(() => {
          this.syncingFromProp = false;
        });
      },
    },
  },
  methods: {
    /**
     * @description 夹紧到字段范围
     * @param {number} n - 原值
     * @returns {number} 夹紧值
     */
    clamp(n: number): number {
      const v = Math.floor(Number(n));
      const min = this.name === 'week' ? 1 : this.range.min;
      const max = this.name === 'week' ? 7 : this.range.max;
      if (!Number.isFinite(v)) return min;
      return Math.min(max, Math.max(min, v));
    },
    /**
     * @description 重置本地控件默认值
     * @returns {void}
     */
    resetLocalDefaults(): void {
      const min = this.range.min;
      const max = this.range.max;
      this.rangeStart = this.name === 'day' || this.name === 'month' ? Math.max(min, 1) : min;
      this.rangeEnd = Math.min(this.rangeStart + 1, max);
      this.stepBase =
        this.name === 'day' || this.name === 'month' || this.name === 'year'
          ? Math.max(min, 1)
          : min;
      this.stepValue = 1;
      this.weekdayNear = 1;
      this.nthOrder = 1;
      this.nthWeekday = 2;
      this.lastWeekday = 2;
      this.listVals = [this.listDefaultValue];
    },
    /**
     * @description 从 props 回显
     * @param {CronFieldState} v - 字段状态
     * @returns {void}
     */
    hydrate(v: CronFieldState): void {
      this.mode = (v.mode === 'specific' ? 'list' : v.mode) as CronFieldMode;
      this.resetLocalDefaults();
      if (v.mode === 'range') {
        const a = Number(v.value);
        const b = Number(v.secondary);
        if (Number.isFinite(a)) this.rangeStart = a;
        if (Number.isFinite(b)) this.rangeEnd = b;
      } else if (v.mode === 'step') {
        if (v.value && v.value !== '*') {
          this.stepBase = Number(v.value) || this.stepBase;
        } else {
          this.stepBase =
            this.name === 'day' || this.name === 'month' || this.name === 'year'
              ? Math.max(this.range.min, 1)
              : this.range.min;
        }
        this.stepValue = Number(v.secondary) || 1;
      } else if (v.mode === 'weekday') {
        this.weekdayNear = Number(v.value) || 1;
      } else if (v.mode === 'nth') {
        this.nthWeekday = Number(v.value) || 2;
        this.nthOrder = Number(v.secondary) || 1;
      } else if (v.mode === 'last') {
        if (v.value) this.lastWeekday = Number(v.value) || 2;
      } else if (v.mode === 'list' || v.mode === 'specific') {
        const vals =
          v.mode === 'list'
            ? (v.values ?? []).map(Number).filter((n) => Number.isFinite(n))
            : [Number(v.value)].filter((n) => Number.isFinite(n));
        this.listVals = vals.length ? vals : [this.listDefaultValue];
      }
    },
    /**
     * @description 拼装并上抛字段状态
     * @returns {void}
     */
    emitState(): void {
      if (this.disabled || this.syncingFromProp) return;
      let next: CronFieldState;
      switch (this.mode) {
        case 'every':
          next = { mode: 'every', raw: '*' };
          break;
        case 'unset':
          next = { mode: 'unset', raw: '?' };
          break;
        case 'range': {
          const start = this.clamp(this.rangeStart);
          const end = this.clamp(this.rangeEnd);
          next = {
            mode: 'range',
            raw: `${start}-${end}`,
            value: String(start),
            secondary: String(end),
          };
          break;
        }
        case 'step': {
          const base = this.clamp(this.stepBase);
          const step = Math.max(1, Math.floor(this.stepValue) || 1);
          next = {
            mode: 'step',
            raw: `${base}/${step}`,
            value: String(base),
            secondary: String(step),
          };
          break;
        }
        case 'weekday': {
          const d = Math.min(31, Math.max(1, Math.floor(this.weekdayNear) || 1));
          next = { mode: 'weekday', raw: `${d}W`, value: String(d) };
          break;
        }
        case 'last': {
          if (this.name === 'week') {
            const w = Math.min(7, Math.max(1, Math.floor(this.lastWeekday) || 1));
            next = { mode: 'last', raw: `${w}L`, value: String(w) };
          } else {
            next = { mode: 'last', raw: 'L' };
          }
          break;
        }
        case 'lastWeekday':
          next = { mode: 'lastWeekday', raw: 'LW' };
          break;
        case 'nth': {
          const w = Math.min(7, Math.max(1, Math.floor(this.nthWeekday) || 1));
          const n = Math.min(5, Math.max(1, Math.floor(this.nthOrder) || 1));
          next = {
            mode: 'nth',
            raw: `${w}#${n}`,
            value: String(w),
            secondary: String(n),
          };
          break;
        }
        case 'list':
        case 'specific': {
          const values = (
            this.listVals.length ? this.listVals : [this.listDefaultValue]
          ).map(String);
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
     * @description 选择模式并上抛
     * @param {CronFieldMode} m - 模式
     * @returns {void}
     */
    selectMode(m: CronFieldMode): void {
      if (this.disabled) return;
      this.syncingFromProp = false;
      this.mode = m;
      if ((m === 'list' || m === 'specific') && this.listVals.length === 0) {
        this.listVals = [this.listDefaultValue];
      }
      if (m === 'range' && this.name === 'week') {
        this.rangeStart = 2;
        this.rangeEnd = 3;
      }
      this.emitState();
    },
    /**
     * @description 控件聚焦时切模式
     * @param {CronFieldMode} m - 模式
     * @returns {void}
     */
    focusMode(m: CronFieldMode): void {
      if (this.disabled) return;
      if (this.mode !== m) this.selectMode(m);
    },
    /**
     * @description 控件输入时切模式并上抛
     * @param {CronFieldMode} m - 模式
     * @returns {void}
     */
    controlInput(m: CronFieldMode): void {
      if (this.disabled) return;
      this.syncingFromProp = false;
      if (this.mode !== m) {
        this.selectMode(m);
        return;
      }
      this.emitState();
    },
    /**
     * @description 指定格子变更
     * @param {number[]} vals - 选中值
     * @returns {void}
     */
    onList(vals: number[]): void {
      this.listVals = vals.length ? vals : [this.listDefaultValue];
      if (this.mode !== 'list' && this.mode !== 'specific') {
        this.selectMode('list');
        return;
      }
      this.emitState();
    },
    /**
     * @description 周写法变更
     * @param {WeekFormat} format - number | abbr
     * @returns {void}
     */
    onWeekFormat(format: WeekFormat): void {
      this.$emit('update:weekFormat', format);
    },
  },
});
</script>

<template>
  <div class="cz-field" :class="{ 'cz-field--disabled': disabled }">
    <p v-if="disabled && disabledReason" class="cz-field__lock">{{ disabledReason }}</p>

    <label v-if="name === 'day' || name === 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'unset'"
        :disabled="disabled"
        @change="selectMode('unset')"
      />
      <span>{{ ui.unset }}</span>
      <span class="cz-row__muted">{{ ui.wildcardsAllowed('[, - * / L W #]') }}</span>
    </label>

    <label v-if="name === 'year'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'unset'"
        :disabled="disabled"
        @change="selectMode('unset')"
      />
      <span
        >{{ ui.unset }} <span class="cz-row__muted">（{{ ui.yearOptional }}）</span></span
      >
    </label>

    <label class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'every'"
        :disabled="disabled"
        @change="selectMode('every')"
      />
      <span>{{ everyLabel }} {{ ui.wildcardsAllowed('[, - * /]') }}</span>
    </label>

    <label class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'range'"
        :disabled="disabled"
        @change="selectMode('range')"
      />
      <span class="cz-row__inline">
        {{ ui.range }}{{ ui.from }}
        <input
          v-model.number="rangeStart"
          type="number"
          :min="name === 'week' ? 1 : range.min"
          :max="name === 'week' ? 7 : range.max"
          :disabled="disabled"
          @focus="focusMode('range')"
          @change="controlInput('range')"
          @input="controlInput('range')"
        />
        -
        <input
          v-model.number="rangeEnd"
          type="number"
          :min="name === 'week' ? 1 : range.min"
          :max="name === 'week' ? 7 : range.max"
          :disabled="disabled"
          @focus="focusMode('range')"
          @change="controlInput('range')"
          @input="controlInput('range')"
        />
        {{ unitLabel }}
      </span>
    </label>

    <label v-if="name !== 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'step'"
        :disabled="disabled"
        @change="selectMode('step')"
      />
      <span class="cz-row__inline">
        {{ ui.from }}
        <input
          v-model.number="stepBase"
          type="number"
          :min="range.min"
          :max="range.max"
          :disabled="disabled"
          @focus="focusMode('step')"
          @change="controlInput('step')"
          @input="controlInput('step')"
        />
        {{ ui.stepStart(unitLabel) }}
        <input
          v-model.number="stepValue"
          type="number"
          min="1"
          :max="range.max"
          :disabled="disabled"
          @focus="focusMode('step')"
          @change="controlInput('step')"
          @input="controlInput('step')"
        />
        {{ ui.stepOnce(stepOnceUnit) }}
      </span>
    </label>

    <label v-if="name === 'day'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'weekday'"
        :disabled="disabled"
        @change="selectMode('weekday')"
      />
      <span class="cz-row__inline">
        {{ ui.nearestWorkdayPrefix }}
        <input
          v-model.number="weekdayNear"
          type="number"
          min="1"
          max="31"
          :disabled="disabled"
          @focus="focusMode('weekday')"
          @change="controlInput('weekday')"
          @input="controlInput('weekday')"
        />
        {{ ui.nearestWorkdaySuffix }}
      </span>
    </label>

    <label v-if="name === 'day'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'last'"
        :disabled="disabled"
        @change="selectMode('last')"
      />
      <span><strong>{{ ui.lastDayOfMonth }}</strong></span>
    </label>

    <label v-if="name === 'day'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'lastWeekday'"
        :disabled="disabled"
        @change="selectMode('lastWeekday')"
      />
      <span><strong>{{ ui.lastWorkdayOfMonth }}</strong></span>
    </label>

    <label v-if="name === 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'nth'"
        :disabled="disabled"
        @change="selectMode('nth')"
      />
      <span class="cz-row__inline">
        {{ ui.nthPrefix }}
        <input
          v-model.number="nthOrder"
          type="number"
          min="1"
          max="5"
          :disabled="disabled"
          @focus="focusMode('nth')"
          @change="controlInput('nth')"
          @input="controlInput('nth')"
        />
        {{ ui.nthMiddle }}
        <select
          v-model.number="nthWeekday"
          :disabled="disabled"
          @focus="focusMode('nth')"
          @change="controlInput('nth')"
        >
          <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </span>
    </label>

    <label v-if="name === 'week'" class="cz-row">
      <input
        type="radio"
        :name="modeRadioGroup"
        :checked="mode === 'last'"
        :disabled="disabled"
        @change="selectMode('last')"
      />
      <span class="cz-row__inline">
        {{ ui.lastWeekdayPrefix }}
        <select
          v-model.number="lastWeekday"
          :disabled="disabled"
          @focus="focusMode('last')"
          @change="controlInput('last')"
        >
          <option v-for="o in weekOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </span>
    </label>

    <div class="cz-row cz-row--block">
      <label class="cz-row__head">
        <input
          type="radio"
          :name="modeRadioGroup"
          :checked="mode === 'list' || mode === 'specific'"
          :disabled="disabled"
          @change="selectMode('list')"
        />
        <strong>{{ ui.specific }}</strong>
      </label>
      <ValueGrid
        :min="gridMin"
        :max="gridMax"
        :value="mode === 'list' || mode === 'specific' ? listVals : []"
        :multiple="true"
        :disabled="disabled"
        :pad="name !== 'week' && name !== 'year'"
        :labels="name === 'week' ? weekLabels : name === 'month' ? monthLabels : undefined"
        :order="name === 'week' ? weekOrder : undefined"
        @input="onList"
      />
    </div>

    <div
      v-if="name === 'week'"
      class="cz-week-format"
      role="radiogroup"
      :aria-label="ui.weekFormatAria"
    >
      <span class="cz-week-format__label">{{ ui.weekFormatLabel }}</span>
      <label class="cz-week-format__opt">
        <input
          type="radio"
          :name="weekFormatGroup"
          :checked="weekFormat === 'number'"
          :disabled="disabled"
          @change="onWeekFormat('number')"
        />
        {{ ui.weekFormatNumber }}
      </label>
      <label class="cz-week-format__opt">
        <input
          type="radio"
          :name="weekFormatGroup"
          :checked="weekFormat === 'abbr'"
          :disabled="disabled"
          @change="onWeekFormat('abbr')"
        />
        {{ ui.weekFormatAbbr }}
      </label>
    </div>
  </div>
</template>
