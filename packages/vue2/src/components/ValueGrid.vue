<script lang="ts">
/**
 * @description 数值格子选择器（Vue2）：对齐 vue3（上限 / order / pad）
 */
import Vue, { PropType } from 'vue';

const MAX_GRID_CELLS = 120;

export default Vue.extend({
  name: 'ValueGrid',
  props: {
    /** @description 最小值（含） */
    min: { type: Number, required: true },
    /** @description 最大值（含） */
    max: { type: Number, required: true },
    /** @description 已选值列表（v-model） */
    value: { type: Array as PropType<number[]>, default: () => [] },
    /** @description 是否多选 */
    multiple: { type: Boolean, default: false },
    /** @description 是否禁用 */
    disabled: { type: Boolean, default: false },
    /** @description 自定义标签 */
    labels: { type: Object as PropType<Record<number, string>>, default: undefined },
    /** @description 是否两位补零 */
    pad: { type: Boolean, default: true },
    /** @description 自定义格子顺序 */
    order: { type: Array as PropType<number[]>, default: undefined },
  },
  computed: {
    cells(): number[] {
      if (this.order && this.order.length > 0) {
        return this.order
          .filter((n) => n >= this.min && n <= this.max)
          .slice(0, MAX_GRID_CELLS);
      }
      const list: number[] = [];
      if (!Number.isFinite(this.min) || !Number.isFinite(this.max) || this.min > this.max) {
        return list;
      }
      const end = Math.min(this.max, this.min + MAX_GRID_CELLS - 1);
      for (let i = this.min; i <= end; i++) list.push(i);
      return list;
    },
    selected(): Set<number> {
      return new Set(this.value);
    },
  },
  methods: {
    /**
     * @description 格子显示文案
     * @param {number} n - 数值
     * @returns {string} 文案
     */
    labelOf(n: number): string {
      if (this.labels && this.labels[n] != null) return this.labels[n];
      if (this.pad && n >= 0 && n <= 99) return String(n).padStart(2, '0');
      return String(n);
    },
    /**
     * @description 切换选中
     * @param {number} n - 数值
     * @returns {void}
     */
    toggle(n: number): void {
      if (this.disabled) return;
      if (!this.multiple) {
        this.$emit('input', [n]);
        return;
      }
      const next = new Set(this.value);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      this.$emit('input', [...next].sort((a, b) => a - b));
    },
    /**
     * @description 全选
     * @returns {void}
     */
    selectAll(): void {
      if (this.disabled || !this.multiple) return;
      this.$emit('input', [...this.cells]);
    },
    /**
     * @description 清空
     * @returns {void}
     */
    clearAll(): void {
      if (this.disabled) return;
      this.$emit('input', this.multiple ? [] : [this.min]);
    },
  },
});
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
        {{ labelOf(n) }}
      </button>
    </div>
  </div>
</template>
