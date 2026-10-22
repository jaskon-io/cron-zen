<script setup lang="ts">
/**
 * @description 数值格子选择器：单选或多选字段候选值
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
    /** @description 是否多选（list）；否则单选（specific） */
    multiple?: boolean;
    /** @description 是否禁用 */
    disabled?: boolean;
    /** @description 自定义标签，如周：0→日 */
    labels?: Record<number, string>;
  }>(),
  {
    multiple: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  /**
   * @description 选中值变更
   * @param {number[]} value - 选中数值
   */
  (e: 'update:modelValue', value: number[]): void;
}>();

const cells = computed(() => {
  const list: number[] = [];
  for (let i = props.min; i <= props.max; i++) list.push(i);
  return list;
});

const selected = computed(() => new Set(props.modelValue));

/**
 * @description 切换某个数值的选中状态
 * @param {number} n - 数值
 * @returns {void}
 */
function toggle(n: number): void {
  if (props.disabled) return;
  if (!props.multiple) {
    emit('update:modelValue', [n]);
    return;
  }
  const next = new Set(props.modelValue);
  if (next.has(n)) next.delete(n);
  else next.add(n);
  emit('update:modelValue', [...next].sort((a, b) => a - b));
}

/**
 * @description 全选 / 清空（仅多选）
 * @returns {void}
 */
function selectAll(): void {
  if (props.disabled || !props.multiple) return;
  emit('update:modelValue', [...cells.value]);
}

/**
 * @description 清空选中
 * @returns {void}
 */
function clearAll(): void {
  if (props.disabled) return;
  emit('update:modelValue', props.multiple ? [] : [props.min]);
}
</script>

<template>
  <div class="cz-grid" :class="{ 'cz-grid--disabled': disabled }">
    <div v-if="multiple" class="cz-grid__toolbar">
      <button type="button" class="cz-grid__tool" :disabled="disabled" @click="selectAll">全选</button>
      <button type="button" class="cz-grid__tool" :disabled="disabled" @click="clearAll">清空</button>
    </div>
    <div class="cz-grid__cells" role="group">
      <button
        v-for="n in cells"
        :key="n"
        type="button"
        class="cz-grid__cell"
        :class="{ 'is-active': selected.has(n) }"
        :disabled="disabled"
        :aria-pressed="selected.has(n)"
        @click="toggle(n)"
      >
        {{ labels?.[n] ?? n }}
      </button>
    </div>
  </div>
</template>
