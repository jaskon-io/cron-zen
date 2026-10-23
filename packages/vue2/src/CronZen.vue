<script lang="ts">
/**
 * @description Vue2 可视化 Cron 表达式生成器（三段式布局，对齐 vue3 行为）
 * @example
 * <cron-zen v-model="cron" />
 * <cron-zen :value.sync="cron" :show-preview="false" />
 */
import Vue from 'vue';
import type {
  CronFieldName,
  CronFieldState,
  CronState,
  ValidateResult,
  WeekFormat,
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
  stringifyField,
  weekTokenUsesAbbr,
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
  },
  data() {
    return {
      state: createDefaultCronState() as CronState,
      activeTab: 'second' as CronFieldName,
      expression: '',
      description: '',
      nextRuns: [] as string[],
      validation: { valid: true, errors: [], warnings: [] } as ValidateResult,
      hint: '',
      tabs: getCronTabs(),
      timer: null as ReturnType<typeof setTimeout> | null,
      syncingOut: false,
      weekFormat: 'number' as WeekFormat,
      copied: false,
      copiedTimer: null as ReturnType<typeof setTimeout> | null,
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
      const d = Number.isFinite(this.debounceMs) ? Math.floor(this.debounceMs) : 0;
      return Math.min(Math.max(d, 0), 5000);
    },
    currentField(): CronFieldState {
      return this.state[this.activeTab];
    },
    fieldParts(): { name: CronFieldName; label: string; value: string }[] {
      return this.tabs.map((tab) => ({
        name: tab.name,
        label: tab.label,
        value: stringifyField(this.state[tab.name], {
          fieldName: tab.name,
          weekFormat: this.weekFormat,
        }),
      }));
    },
    /** @description 日周互斥提示（不锁死编辑） */
    mutexTip(): string {
      const dayConcrete =
        this.state.day.mode !== 'every' && this.state.day.mode !== 'unset';
      const weekConcrete =
        this.state.week.mode !== 'every' && this.state.week.mode !== 'unset';
      if (this.activeTab === 'day' && weekConcrete) {
        return '当前已配置「周」字段；若在此选择具体「日」，将自动把周改为 ?（日周互斥）';
      }
      if (this.activeTab === 'week' && dayConcrete) {
        return '当前已配置「日」字段；若在此选择具体「周」，将自动把日改为 ?（日周互斥）';
      }
      return '';
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(val: string) {
        if (this.syncingOut) return;
        if (!val) {
          // 空 v-model：保留可编辑默认态，不写回表达式
          this.state = createDefaultCronState();
          this.expression = '';
          this.weekFormat = 'number';
          this.refreshPreviewOnly();
          return;
        }
        if (val !== this.expression) {
          this.loadExpression(val);
        }
      },
    },
    showPreview(v: boolean) {
      if (v) this.refreshPreviewOnly();
    },
  },
  created() {
    if (this.value) this.loadExpression(this.value);
    else this.refreshPreviewOnly();
  },
  beforeDestroy() {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.copiedTimer != null) {
      clearTimeout(this.copiedTimer);
      this.copiedTimer = null;
    }
  },
  methods: {
    /**
     * @description 仅刷新描述 / 近 N 次 / 校验（不写回空 v-model）
     * @returns {void}
     */
    refreshPreviewOnly(): void {
      this.validation = validateCronState(this.state);
      this.description = describeCron(this.state);
      if (this.showPreview) {
        this.nextRuns = getNextRuns(this.state, this.safeNextCount)
          .map(formatRunTime)
          .filter(Boolean);
      } else {
        this.nextRuns = [];
      }
    },
    /**
     * @description 立即刷新表达式 / 描述 / 预览
     * @returns {void}
     */
    refreshNow(): void {
      const gen = generateCron(this.state, { weekFormat: this.weekFormat });
      if (gen.state) this.state = gen.state;
      this.validation = validateCronState(this.state);
      this.description = describeCron(this.state);
      if (this.showPreview) {
        this.nextRuns = getNextRuns(this.state, this.safeNextCount)
          .map(formatRunTime)
          .filter(Boolean);
      } else {
        this.nextRuns = [];
      }
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
      if (this.safeDebounceMs === 0) {
        this.refreshNow();
        return;
      }
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
     * @description 周写法变更
     * @param {WeekFormat} format - number | abbr
     * @returns {void}
     */
    onWeekFormat(format: WeekFormat): void {
      this.weekFormat = format === 'abbr' ? 'abbr' : 'number';
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
        const weekToken = expr.trim().split(/\s+/)[5];
        this.weekFormat = weekToken && weekTokenUsesAbbr(weekToken) ? 'abbr' : 'number';
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
      this.weekFormat = 'number';
      this.scheduleRefresh();
    },
    /**
     * @description 复制表达式
     * @returns {void}
     */
    copyExpression(): void {
      const text = this.expression;
      const done = () => {
        this.copied = true;
        if (this.copiedTimer) clearTimeout(this.copiedTimer);
        this.copiedTimer = setTimeout(() => {
          this.copied = false;
          this.copiedTimer = null;
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
        :week-format="weekFormat"
        @input="onFieldUpdate"
        @update:weekFormat="onWeekFormat"
      />
    </section>

    <section v-if="showPreview" class="cron-zen__preview" aria-label="预览">
      <div v-if="fieldParts.length" class="cron-zen__preview-block">
        <h3>字段</h3>
        <ul class="cron-zen__parts">
          <li v-for="p in fieldParts" :key="p.name">
            <span class="cron-zen__parts-label">{{ p.label }}</span>
            <code>{{ p.value }}</code>
          </li>
        </ul>
      </div>

      <div class="cron-zen__preview-block">
        <h3>Cron 表达式</h3>
        <pre class="cron-zen__expr">{{ expression || '（编辑后生成）' }}</pre>
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
        <p v-else class="cron-zen__desc">暂无触发点（或当前模式无法估算）</p>
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
        <button type="button" class="cron-zen__btn" @click="copyExpression">
          {{ copied ? '已复制' : '复制表达式' }}
        </button>
      </div>
    </section>
  </div>
</template>
