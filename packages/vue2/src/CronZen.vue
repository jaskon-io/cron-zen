<script lang="ts">
/**
 * @description Vue2 可视化 Cron 表达式生成器（三段式布局，对齐 vue3 行为）
 * @example
 * <cron-zen v-model="cron" />
 * <cron-zen :value.sync="cron" :show-preview="false" />
 */
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  ref,
  toRef,
} from 'vue';
import type { CronFieldName, CronFieldState, WeekFormat } from '@cron-zen/core';
import { getCronTabs, getUiMessages } from '@cron-zen/core';
import { displayFieldValue, useCronZen } from './composables/useCronZen';
import FieldEditor from './components/FieldEditor.vue';
import './styles/cron-zen.css';

export default defineComponent({
  name: 'CronZen',
  components: { FieldEditor },
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    /**
     * @description 双向绑定的 Cron 表达式（v-model / value）；空串不注入默认
     */
    value: { type: String, default: '' },
    /**
     * @description 写回防抖毫秒；默认 0（即时）
     */
    debounceMs: { type: Number, default: 0 },
    /**
     * @description 预览最近触发次数
     */
    nextCount: { type: Number, default: 10 },
    /**
     * @description 是否展示底部预览（弹窗建议 false）
     */
    showPreview: { type: Boolean, default: true },
    /**
     * @description IANA 时区（近 N 次）
     */
    timeZone: { type: String, default: undefined },
    /**
     * @description 自然语言语言 zh-CN | en-US
     */
    locale: { type: String, default: 'zh-CN' },
  },
  emits: ['input', 'update:value', 'change'],
  setup(props, { emit }) {
    const modelRef = toRef(props, 'value');

    const writableModel = computed({
      get: () => modelRef.value,
      set: (val: string | undefined) => {
        if (val != null) {
          emit('input', val);
          emit('update:value', val);
        }
      },
    });

    const {
      state,
      activeTab,
      expression,
      description,
      nextRuns,
      validation,
      hint,
      weekFormat,
      updateField,
      setWeekFormat,
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

    /** @description 日周互斥提示（不锁死编辑） */
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
     * @description 字段编辑回调
     * @param {CronFieldState} field - 新字段状态
     * @returns {void}
     */
    function onFieldUpdate(field: CronFieldState): void {
      updateField(activeTab.value, field);
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
     * @description 重置并回到「秒」Tab
     * @returns {void}
     */
    function onReset(): void {
      reset();
      activeTab.value = 'second';
      emit('change', state.value);
    }

    /**
     * @description 复制当前表达式
     * @returns {void}
     */
    function copyExpression(): void {
      flush();
      const text = expression.value;
      const done = () => {
        copied.value = true;
        if (copiedTimer != null) clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => {
          copied.value = false;
          copiedTimer = null;
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => undefined);
        return;
      }
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        done();
      } catch {
        // ignore
      }
      document.body.removeChild(input);
    }

    onBeforeUnmount(() => {
      if (copiedTimer != null) {
        clearTimeout(copiedTimer);
        copiedTimer = null;
      }
    });

    return {
      showPreview: toRef(props, 'showPreview'),
      nextCount: toRef(props, 'nextCount'),
      locale: toRef(props, 'locale'),
      state,
      activeTab,
      expression,
      description,
      nextRuns,
      validation,
      hint,
      weekFormat,
      tabs,
      ui,
      currentField,
      fieldParts,
      mutexTip,
      copied,
      onTab,
      onFieldUpdate,
      onWeekFormat,
      onReset,
      copyExpression,
    };
  },
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
      <p v-if="mutexTip" class="cron-zen__mutex">{{ mutexTip }}</p>
      <FieldEditor
        :key="activeTab"
        :name="activeTab"
        :value="currentField"
        :week-format="weekFormat"
        :locale="locale"
        @input="onFieldUpdate"
        @update:weekFormat="onWeekFormat"
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
        <pre class="cron-zen__expr">{{ expression || ui.expressionPlaceholder }}</pre>
        <p class="cron-zen__desc">{{ description }}</p>
      </div>

      <div class="cron-zen__preview-block">
        <h3>{{ ui.nextRunsTitle(nextCount) }}</h3>
        <ol v-if="nextRuns.length" class="cron-zen__runs">
          <li v-for="(t, i) in nextRuns" :key="i">{{ t }}</li>
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
