<script lang="ts">
/**
 * @description Vue2 可视化 Cron 表达式生成器（三段式布局，v-model / value+.sync）
 * @example
 * <cron-zen v-model="cron" />
 * <cron-zen :value.sync="cron" />
 */
import Vue from 'vue';
import type {
  CronFieldName,
  CronFieldState,
  CronState,
  ValidateResult,
} from '@cron-zen/core';
import {
  createDefaultCronState,
  generateCron,
  parseCron,
  validateCronState,
  enforceDayWeekMutex,
  describeCron,
  formatRunTime,
  getNextRuns,
  getCronTabs,
} from '@cron-zen/core';
import FieldEditor from './components/FieldEditor.vue';
import './styles/cron-zen.css';

export default Vue.extend({
  name: 'CronZen',
  components: { FieldEditor },
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    /**
     * @description 双向绑定的 Cron 表达式（v-model / value）
     */
    value: { type: String, default: '0 0 0 * * ? *' },
    /**
     * @description 生成防抖毫秒数
     */
    debounceMs: { type: Number, default: 300 },
    /**
     * @description 预览最近触发次数
     */
    nextCount: { type: Number, default: 10 },
  },
  data() {
    return {
      state: createDefaultCronState() as CronState,
      activeTab: 'hour' as CronFieldName,
      expression: '0 0 0 * * ? *',
      description: '',
      nextRuns: [] as string[],
      validation: { valid: true, errors: [], warnings: [] } as ValidateResult,
      hint: '',
      tabs: getCronTabs(),
      timer: null as ReturnType<typeof setTimeout> | null,
      syncingOut: false,
    };
  },
  computed: {
    /** @description 夹紧后的预览条数 */
    safeNextCount(): number {
      const n = Number.isFinite(this.nextCount) ? Math.floor(this.nextCount) : 10;
      return Math.min(Math.max(n, 1), 100);
    },
    /** @description 夹紧后的防抖毫秒 */
    safeDebounceMs(): number {
      const d = Number.isFinite(this.debounceMs) ? Math.floor(this.debounceMs) : 300;
      return Math.min(Math.max(d, 0), 5000);
    },
    currentField(): CronFieldState {
      return this.state[this.activeTab];
    },
    dayLocked(): boolean {
      return (
        this.state.week.mode !== 'every' &&
        this.state.week.mode !== 'unset' &&
        this.activeTab === 'day'
      );
    },
    weekLocked(): boolean {
      return (
        this.state.day.mode !== 'every' &&
        this.state.day.mode !== 'unset' &&
        this.activeTab === 'week'
      );
    },
    mutexTip(): string {
      if (this.dayLocked) return '已配置「周」字段，日字段需保持为 ?（日周互斥）';
      if (this.weekLocked) return '已配置「日」字段，周字段需保持为 ?（日周互斥）';
      return '';
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(val: string) {
        if (this.syncingOut) return;
        if (val && val !== this.expression) {
          this.loadExpression(val);
        }
      },
    },
  },
  created() {
    this.refreshNow();
  },
  beforeDestroy() {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },
  methods: {
    /**
     * @description 立即刷新表达式 / 描述 / 预览
     * @returns {void}
     */
    refreshNow(): void {
      const gen = generateCron(this.state);
      if (gen.state) this.state = gen.state;
      this.validation = validateCronState(this.state);
      this.description = describeCron(this.state);
      this.nextRuns = getNextRuns(this.state, this.safeNextCount)
        .map(formatRunTime)
        .filter(Boolean);
      if (gen.warning) this.hint = gen.warning;
      else if (this.validation.warnings.length > 0) {
        this.hint = this.validation.warnings.join('；');
      } else if (!this.validation.valid) {
        this.hint = this.validation.errors.join('；');
      } else {
        this.hint = '';
      }
      if (gen.success && gen.expression) {
        this.expression = gen.expression;
        if (this.value !== gen.expression) {
          this.syncingOut = true;
          this.$emit('input', gen.expression);
          this.$emit('update:value', gen.expression);
          Promise.resolve().then(() => {
            this.syncingOut = false;
          });
        }
      }
      this.$emit('change', this.state);
    },
    /**
     * @description 防抖刷新
     * @returns {void}
     */
    scheduleRefresh(): void {
      if (this.timer != null) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.timer = null;
        this.refreshNow();
      }, this.safeDebounceMs);
    },
    /**
     * @description 切换 Tab
     * @param {CronFieldName} name - 字段名
     * @returns {void}
     */
    onTab(name: CronFieldName): void {
      this.activeTab = name;
    },
    /**
     * @description 更新字段
     * @param {CronFieldState} field - 新字段状态
     * @returns {void}
     */
    onFieldUpdate(field: CronFieldState): void {
      const next: CronState = { ...this.state, [this.activeTab]: field };
      if (this.activeTab === 'day' || this.activeTab === 'week') {
        const enforced = enforceDayWeekMutex(next);
        this.state = enforced.state;
        if (enforced.warning) this.hint = enforced.warning;
      } else {
        this.state = next;
      }
      this.scheduleRefresh();
    },
    /**
     * @description 从表达式反解析
     * @param {string} expr - Cron 表达式
     * @returns {void}
     */
    loadExpression(expr: string): void {
      const parsed = parseCron(expr);
      if (parsed.state) {
        this.state = parsed.state;
        this.expression = parsed.expression ?? expr;
        if (parsed.warning) this.hint = parsed.warning;
        if (parsed.error) this.hint = parsed.error;
        this.scheduleRefresh();
      }
    },
    /**
     * @description 重置默认状态
     * @returns {void}
     */
    reset(): void {
      this.state = createDefaultCronState();
      this.scheduleRefresh();
    },
    /**
     * @description 复制表达式
     * @returns {void}
     */
    copyExpression(): void {
      const text = this.expression;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => undefined);
        return;
      }
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore
      }
      document.body.removeChild(input);
    },
  },
});
</script>

<template>
  <div class="cron-zen" data-cron-zen>
    <nav class="cron-zen__tabs" aria-label="Cron 字段">
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

    <section class="cron-zen__body" aria-label="字段配置">
      <p v-if="mutexTip" class="cron-zen__mutex">{{ mutexTip }}</p>
      <FieldEditor
        :name="activeTab"
        :value="currentField"
        :disabled="dayLocked || weekLocked"
        :disabled-reason="mutexTip"
        @input="onFieldUpdate"
      />
    </section>

    <section class="cron-zen__preview" aria-label="预览">
      <div class="cron-zen__preview-block">
        <h3>Cron 表达式</h3>
        <pre class="cron-zen__expr">{{ expression }}</pre>
      </div>

      <div class="cron-zen__preview-block">
        <h3>自然语言</h3>
        <p class="cron-zen__desc">{{ description }}</p>
      </div>

      <div class="cron-zen__preview-block">
        <h3>最近 {{ safeNextCount }} 次</h3>
        <ol v-if="nextRuns.length" class="cron-zen__runs">
          <li v-for="(t, i) in nextRuns" :key="i">{{ t }}</li>
        </ol>
        <p v-else class="cron-zen__desc">当前模式暂无法估算触发时间（如 L / W / #）</p>
      </div>

      <p
        v-if="hint"
        class="cron-zen__hint"
        :class="{ 'is-error': !validation.valid }"
      >
        {{ hint }}
      </p>

      <div class="cron-zen__actions">
        <button type="button" class="cron-zen__btn" @click="reset">重置</button>
        <button type="button" class="cron-zen__btn" @click="copyExpression">复制表达式</button>
      </div>
    </section>
  </div>
</template>
