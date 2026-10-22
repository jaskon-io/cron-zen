<script lang="ts">
/**
 * @description 数值格子选择器（Vue2）：单选或多选字段候选值
 */
import Vue, { PropType } from 'vue';

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
  },
  computed: {
    cells(): number[] {
      const list: number[] = [];
      for (let i = this.min; i <= this.max; i++) list.push(i);
      return list;
    },
    selected(): Set<number> {
      return new Set(this.value);
    },
  },
  methods: {
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
        {{ labels && labels[n] != null ? labels[n] : n }}
      </button>
    </div>
  </div>
</template>
