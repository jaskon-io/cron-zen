<script setup lang="ts">
/**
 * @description Element Plus 场景的 Cron 选择器：输入框 + 可自定义按钮 + 弹窗配置（无预览区）
 * @example
 * <CronZenPicker v-model="cron" />
 * <CronZenPicker v-model="cron">
 *   <template #trigger="{ open, disabled }">
 *     <el-button type="primary" :disabled="disabled" @click="open">自定义</el-button>
 *   </template>
 * </CronZenPicker>
 */
import { computed, ref, watch } from 'vue';
import { ElButton, ElDialog, ElInput, ElMessage } from 'element-plus';
import { parseCron } from '@cron-zen/core';
import CronZen from './CronZen.vue';

const props = withDefaults(
  defineProps<{
    /**
     * @description 双向绑定的 Cron 表达式（v-model）
     */
    modelValue?: string;
    /**
     * @description 输入框占位符
     */
    placeholder?: string;
    /**
     * @description 是否禁用
     */
    disabled?: boolean;
    /**
     * @description 输入框只读（只能通过弹窗改）
     */
    readonly?: boolean;
    /**
     * @description 是否可清空
     */
    clearable?: boolean;
    /**
     * @description Element Plus 尺寸
     */
    size?: 'large' | 'default' | 'small';
    /**
     * @description 默认按钮文案（未使用 #trigger 插槽时）
     */
    buttonText?: string;
    /**
     * @description 弹窗标题
     */
    dialogTitle?: string;
    /**
     * @description 弹窗宽度
     */
    dialogWidth?: string | number;
    /**
     * @description 生成防抖毫秒数
     */
    debounceMs?: number;
  }>(),
  {
    modelValue: '',
    placeholder: '请选择或输入 Cron 表达式',
    disabled: false,
    readonly: false,
    clearable: true,
    size: 'default',
    buttonText: '选择',
    dialogTitle: '选择 Cron 表达式',
    dialogWidth: '760px',
    // 弹窗内即时回写底部草稿，避免 300ms 滞后造成「点确定值还是旧的」体感
    debounceMs: 0,
  },
);

const emit = defineEmits<{
  /**
   * @description 表达式变更（v-model）
   * @param {string} value - 新表达式
   */
  (e: 'update:modelValue', value: string): void;
  /**
   * @description 弹窗点确定
   * @param {string} value - 确认后的表达式
   */
  (e: 'confirm', value: string): void;
  /**
   * @description 弹窗取消 / 关闭且未确认
   */
  (e: 'cancel'): void;
}>();

/** 与 core / CronZen 默认态一致 */
const DEFAULT_CRON = '* * * * * ? *';

const visible = ref(false);
const draft = ref('');
/** 每次打开递增，强制 CronZen 按当前草稿重新挂载回显 */
const editorKey = ref(0);
/** 打开时输入框是否已有值（无值取消不得写回默认表达式） */
const openedWithValue = ref(false);
let confirmed = false;

const inputValue = computed({
  get: () => props.modelValue ?? '',
  set: (val: string) => emit('update:modelValue', val ?? ''),
});

/**
 * @description 打开 Cron 选择弹窗：有值则回显，无值则用默认原始态编辑
 * @returns {void}
 */
function openPicker(): void {
  if (props.disabled) return;
  confirmed = false;
  const raw = (props.modelValue ?? '').trim();
  openedWithValue.value = raw.length > 0;
  // 有值：原样回显；无值：弹窗内用默认表达式，确定前不写回输入框
  draft.value = openedWithValue.value ? raw : DEFAULT_CRON;
  editorKey.value += 1;
  visible.value = true;
}

/**
 * @description 确认：校验通过后写回并关闭
 * @returns {void}
 */
function onConfirm(): void {
  const value = draft.value.trim();
  if (!value) return;
  const parsed = parseCron(value);
  if (!parsed.success) {
    ElMessage.error(parsed.error ?? 'Cron 表达式无效');
    return;
  }
  // 使用规范化后的表达式（含日周互斥修正）
  const normalized = parsed.expression ?? value;
  confirmed = true;
  emit('update:modelValue', normalized);
  emit('confirm', normalized);
  visible.value = false;
}

/**
 * @description 取消：关闭且不改输入框（无值仍保持空，有值保持原值）
 * @returns {void}
 */
function onCancel(): void {
  visible.value = false;
}

watch(visible, (v, prev) => {
  if (prev && !v && !confirmed) {
    emit('cancel');
  }
  if (v) {
    confirmed = false;
  }
});

defineExpose({
  /**
   * @description 命令式打开弹窗
   */
  open: openPicker,
  /**
   * @description 命令式关闭弹窗（等同取消）
   */
  close: onCancel,
  /**
   * @description 读取弹窗草稿表达式
   * @returns {string} 当前草稿
   */
  getDraft: (): string => draft.value,
  /**
   * @description 写入弹窗草稿（测试 / 高级用法）
   * @param {string} value - 草稿表达式
   * @returns {void}
   */
  setDraft: (value: string): void => {
    draft.value = value;
  },
});
</script>

<template>
  <div class="cz-picker" data-cron-zen-picker>
    <div class="cz-picker__row">
      <el-input
        v-model="inputValue"
        class="cz-picker__input"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :clearable="clearable && !readonly"
        :size="size"
        spellcheck="false"
      />
      <slot name="trigger" :open="openPicker" :disabled="disabled">
        <el-button :type="'primary'" :disabled="disabled" :size="size" @click="openPicker">
          {{ buttonText }}
        </el-button>
      </slot>
    </div>

    <el-dialog
      v-model="visible"
      class="cz-picker__dialog"
      :title="dialogTitle"
      :width="dialogWidth"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      destroy-on-close
      append-to-body
      align-center
      @closed="draft = ''"
    >
      <CronZen
        v-if="visible"
        :key="editorKey"
        v-model="draft"
        :show-preview="false"
        :debounce-ms="debounceMs"
      />

      <template #footer>
        <div class="cz-picker__footer">
          <code class="cz-picker__draft" :title="draft">{{ draft }}</code>
          <div class="cz-picker__actions">
            <el-button :size="size" @click="onCancel">取消</el-button>
            <el-button type="primary" :size="size" :disabled="!draft.trim()" @click="onConfirm">
              确定
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.cz-picker__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cz-picker__input {
  flex: 1 1 auto;
  min-width: 0;
}

.cz-picker__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.cz-picker__draft {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  text-align: left;
}

.cz-picker__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.cz-picker :deep(.cz-picker__dialog .el-dialog__body) {
  padding-top: 8px;
  padding-bottom: 8px;
}

@media (max-width: 640px) {
  .cz-picker__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .cz-picker__actions {
    justify-content: flex-end;
  }
}
</style>
