<script setup lang="ts">
/**
 * @description 复选格子选择器（参考经典 Cron 生成器：指定值多选）
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** @description 最小值（含） */
    min: number;
    /** @description 最大值（含） */
    max: number;
    /** @description 已选值列表 */
    modelValue: number[];
    /** @description 是否禁用 */
    disabled?: boolean;
    /** @description 自定义标签 */
    labels?: Record<number, string>;
    /** @description 是否两位补零显示 */
    pad?: boolean;
    /** @description 每行列数（默认 10） */
    columns?: number;
    /** @description 可选分组：如小时 AM/PM */
    groups?: { label: string; min: number; max: number }[];
    /**
     * @description 自定义格子顺序（如周：周一→周日）；缺省按 min..max
     */
    order?: number[];
  }>(),
  {
    disabled: false,
    pad: true,
    columns: 10,
  },
);

const emit = defineEmits<{
  /**
   * @description 选中值变更
   * @param {number[]} value - 选中数值
   */
  (e: 'update:modelValue', value: number[]): void;
}>();

/** 防止异常 min/max 生成海量 DOM 导致内存/卡顿 */
const MAX_GRID_CELLS = 120;

const selected = computed(() => new Set(props.modelValue));

/**
 * @description 在安全上限内生成连续格子
 * @param {number} a - 起
 * @param {number} b - 止
 * @returns {number[]} 数值列表
 */
function safeRange(a: number, b: number): number[] {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) return [];
  const list: number[] = [];
  const end = Math.min(b, a + MAX_GRID_CELLS - 1);
  for (let i = a; i <= end; i++) list.push(i);
  return list;
}

const flatCells = computed(() => {
  if (props.order && props.order.length > 0) {
    return props.order
      .filter((n) => n >= props.min && n <= props.max)
      .slice(0, MAX_GRID_CELLS);
  }
  return safeRange(props.min, props.max);
});


/**
 * @description 格式化格子文案
 * @param {number} n - 数值
 * @returns {string} 显示文本
 */
function labelOf(n: number): string {
  if (props.labels?.[n] != null) return props.labels[n];
  if (props.pad) return String(n).padStart(2, '0');
  return String(n);
}

/**
 * @description 切换选中（多选）
 * @param {number} n - 数值
 * @returns {void}
 */
function toggle(n: number): void {
  if (props.disabled) return;
  const next = new Set(props.modelValue);
  if (next.has(n)) next.delete(n);
  else next.add(n);
  const values = [...next].sort((a, b) => a - b);
  // 至少保留一个，避免空 list 生成非法字段
  emit('update:modelValue', values.length > 0 ? values : [props.min]);
}

/**
 * @description 区间内单元格
 * @param {number} a - 起
 * @param {number} b - 止
 * @returns {number[]} 数值列表
 */
/**
 * @description 分组内单元格（带上限）
 * @param {number} a - 起
 * @param {number} b - 止
 * @returns {number[]} 数值列表
 */
function rangeCells(a: number, b: number): number[] {
  return safeRange(a, b);
}
</script>

<template>
  <div class="cz-grid" :class="{ 'cz-grid--disabled': disabled }" :style="{ '--cz-cols': columns }">
    <template v-if="groups?.length">
      <div v-for="g in groups" :key="g.label" class="cz-grid__group">
        <span class="cz-grid__group-label">{{ g.label }}</span>
        <div class="cz-grid__cells">
          <label
            v-for="n in rangeCells(g.min, g.max)"
            :key="n"
            class="cz-grid__check"
            :class="{ 'is-active': selected.has(n) }"
          >
            <input
              type="checkbox"
              :checked="selected.has(n)"
              :disabled="disabled"
              @change="toggle(n)"
            />
            <span>{{ labelOf(n) }}</span>
          </label>
        </div>
      </div>
    </template>
    <div v-else class="cz-grid__cells">
      <label
        v-for="n in flatCells"
        :key="n"
        class="cz-grid__check"
        :class="{ 'is-active': selected.has(n) }"
      >
        <input
          type="checkbox"
          :checked="selected.has(n)"
          :disabled="disabled"
          @change="toggle(n)"
        />
        <span>{{ labelOf(n) }}</span>
      </label>
    </div>
  </div>
</template>
