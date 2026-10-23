import type { CronFieldName, CronState, WeekFormat } from '@cron-zen/core';
import { getCronTabs, getUiMessages } from '@cron-zen/core';
import {
  createCronZen,
  displayFieldValue,
  type CronZenController,
  type CronZenModel,
} from './createCronZen';
import { mountFieldEditor, type FieldEditorHandle } from './render/fieldEditor';
import './styles/cron-zen.css';

/**
 * @description mountCronZen 配置
 */
export interface MountCronZenOptions {
  /** @description 初始 / 受控表达式；空串不注入默认 */
  value?: string;
  /** @description 表达式变更 */
  onChange?: (expression: string, state: CronState) => void;
  /** @description 写回防抖毫秒（默认 0） */
  debounceMs?: number;
  /** @description 近 N 次（默认 10） */
  nextCount?: number;
  /** @description 是否展示底部预览（默认 true） */
  showPreview?: boolean;
  /** @description 周字段写法 */
  weekFormat?: WeekFormat;
  /** @description IANA 时区 */
  timeZone?: string;
  /** @description zh-CN | en-US */
  locale?: string;
}

/**
 * @description mountCronZen 句柄
 */
export interface CronZenHandle {
  /** @description 当前表达式 */
  getValue: () => string;
  /** @description 设置表达式（反解析） */
  setValue: (expression: string) => void;
  /** @description 立即写回 / 刷新预览 */
  flush: () => void;
  /** @description 重置默认 */
  reset: () => void;
  /** @description 卸载并清理定时器 */
  destroy: () => void;
  /** @description 底层控制器（高级用法） */
  controller: CronZenController;
}

/**
 * @description 在任意 DOM 节点挂载 Cron 可视化编辑器（无 Vue / React 依赖）
 * @param {HTMLElement | string} target - 容器元素或 CSS 选择器
 * @param {MountCronZenOptions} [options] - 配置
 * @returns {CronZenHandle} 句柄
 * @example
 * import { mountCronZen } from '@cron-zen/vanilla';
 * import '@cron-zen/vanilla/style.css';
 * const api = mountCronZen('#app', {
 *   value: '',
 *   onChange: (expr) => console.log(expr),
 * });
 */
export function mountCronZen(
  target: HTMLElement | string,
  options: MountCronZenOptions = {},
): CronZenHandle {
  const el =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) {
    throw new Error(`[cron-zen/vanilla] mount target not found: ${String(target)}`);
  }

  let externalValue = options.value ?? '';
  let ctrl!: CronZenController;
  const model: CronZenModel = {
    get value() {
      return externalValue;
    },
    set value(v) {
      externalValue = v ?? '';
      options.onChange?.(externalValue, ctrl.getSnapshot().state);
    },
  };

  ctrl = createCronZen({
    modelValue: model,
    debounceMs: options.debounceMs ?? 0,
    nextCount: options.nextCount,
    showPreview: options.showPreview,
    weekFormat: options.weekFormat,
    timeZone: options.timeZone,
    locale: options.locale,
  });

  const showPreview = options.showPreview !== false;
  let fieldHandle: FieldEditorHandle | null = null;
  let copiedTimer: ReturnType<typeof setTimeout> | null = null;

  const root = document.createElement('div');
  root.className = 'cron-zen';
  root.setAttribute('data-cron-zen', '');
  if (!showPreview) root.classList.add('cron-zen--compact');

  const nav = document.createElement('nav');
  nav.className = 'cron-zen__tabs';

  const body = document.createElement('section');
  body.className = 'cron-zen__body';

  const mutexEl = document.createElement('p');
  mutexEl.className = 'cron-zen__mutex';
  mutexEl.hidden = true;

  const fieldHost = document.createElement('div');
  body.appendChild(mutexEl);
  body.appendChild(fieldHost);

  const compactHint = document.createElement('p');
  compactHint.className = 'cron-zen__hint cron-zen__hint--compact';
  compactHint.hidden = true;

  const preview = document.createElement('section');
  preview.className = 'cron-zen__preview';
  preview.hidden = !showPreview;

  el.replaceChildren(root);
  root.appendChild(nav);
  root.appendChild(body);
  root.appendChild(compactHint);
  root.appendChild(preview);

  const renderTabs = (): void => {
    const snap = ctrl.getSnapshot();
    const tabs = getCronTabs(snap.locale);
    const active = ctrl.getActiveTab();
    nav.replaceChildren();
    for (const tab of tabs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cron-zen__tab' + (active === tab.name ? ' is-active' : '');
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        ctrl.setActiveTab(tab.name);
      });
      nav.appendChild(btn);
    }
  };

  const mutexTip = (snap: ReturnType<CronZenController['getSnapshot']>): string => {
    const m = getUiMessages(snap.locale);
    const dayConcrete =
      snap.state.day.mode !== 'every' && snap.state.day.mode !== 'unset';
    const weekConcrete =
      snap.state.week.mode !== 'every' && snap.state.week.mode !== 'unset';
    if (snap.activeTab === 'day' && weekConcrete) {
      return m.mutexDayOccupied;
    }
    if (snap.activeTab === 'week' && dayConcrete) {
      return m.mutexWeekOccupied;
    }
    return '';
  };

  const ensureFieldEditor = (name: CronFieldName): void => {
    const snap = ctrl.getSnapshot();
    fieldHandle?.destroy();
    fieldHandle = mountFieldEditor(fieldHost, {
      name,
      field: snap.state[name],
      weekFormat: snap.weekFormat,
      locale: snap.locale,
      onChange: (field) => ctrl.updateField(name, field),
      onWeekFormat: (f) => ctrl.setWeekFormat(f),
    });
  };

  let lastTab: CronFieldName | null = null;
  let lastLocale: string | null = null;

  const renderPreview = (): void => {
    const snap = ctrl.getSnapshot();
    const m = getUiMessages(snap.locale);
    if (!showPreview) {
      if (snap.hint) {
        compactHint.hidden = false;
        compactHint.textContent = snap.hint;
        compactHint.classList.toggle('is-error', !snap.validation.valid);
      } else {
        compactHint.hidden = true;
      }
      return;
    }

    preview.replaceChildren();
    preview.setAttribute('aria-label', m.ariaPreview);

    const tabs = getCronTabs(snap.locale);
    const fields = document.createElement('div');
    fields.className = 'cron-zen__fields';
    const head = document.createElement('div');
    head.className = 'cron-zen__fields-head';
    const vals = document.createElement('div');
    vals.className = 'cron-zen__fields-body';
    for (const tab of tabs) {
      const tBtn = document.createElement('button');
      tBtn.type = 'button';
      tBtn.className =
        'cron-zen__field-tab' + (snap.activeTab === tab.name ? ' is-active' : '');
      tBtn.textContent = tab.label;
      tBtn.addEventListener('click', () => ctrl.setActiveTab(tab.name));
      head.appendChild(tBtn);

      const vBtn = document.createElement('button');
      vBtn.type = 'button';
      vBtn.className =
        'cron-zen__field-val' + (snap.activeTab === tab.name ? ' is-active' : '');
      vBtn.title = m.editField(tab.label);
      const code = document.createElement('code');
      code.textContent = displayFieldValue(
        tab.name,
        snap.state[tab.name],
        snap.weekFormat,
      );
      vBtn.appendChild(code);
      vBtn.addEventListener('click', () => ctrl.setActiveTab(tab.name));
      vals.appendChild(vBtn);
    }
    fields.appendChild(head);
    fields.appendChild(vals);
    preview.appendChild(fields);

    const exprBlock = document.createElement('div');
    exprBlock.className = 'cron-zen__preview-block';
    const titleRow = document.createElement('div');
    titleRow.className = 'cron-zen__preview-title';
    titleRow.appendChild(
      Object.assign(document.createElement('h3'), { textContent: m.expression }),
    );
    const actions = document.createElement('div');
    actions.className = 'cron-zen__actions';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'cron-zen__btn';
    copyBtn.textContent = m.copy;
    copyBtn.addEventListener('click', async () => {
      ctrl.flush();
      try {
        await navigator.clipboard.writeText(ctrl.getSnapshot().expression);
        copyBtn.textContent = m.copied;
        if (copiedTimer) clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => {
          copyBtn.textContent = m.copy;
          copiedTimer = null;
        }, 1500);
      } catch {
        // ignore
      }
    });
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'cron-zen__btn';
    resetBtn.textContent = m.reset;
    resetBtn.addEventListener('click', () => {
      ctrl.reset();
      ctrl.setActiveTab('second');
    });
    actions.appendChild(copyBtn);
    actions.appendChild(resetBtn);
    titleRow.appendChild(actions);
    exprBlock.appendChild(titleRow);
    const pre = document.createElement('pre');
    pre.className = 'cron-zen__expr';
    pre.textContent = snap.expression || m.expressionPlaceholder;
    exprBlock.appendChild(pre);
    const desc = document.createElement('p');
    desc.className = 'cron-zen__desc';
    desc.textContent = snap.description;
    exprBlock.appendChild(desc);
    preview.appendChild(exprBlock);

    const runsBlock = document.createElement('div');
    runsBlock.className = 'cron-zen__preview-block';
    const runsTitle = document.createElement('h3');
    const n = Math.min(Math.max(options.nextCount ?? 10, 1), 100);
    runsTitle.textContent = m.nextRunsTitle(n);
    runsBlock.appendChild(runsTitle);
    if (snap.nextRuns.length) {
      const ol = document.createElement('ol');
      ol.className = 'cron-zen__runs';
      for (const t of snap.nextRuns) {
        const li = document.createElement('li');
        li.textContent = t;
        ol.appendChild(li);
      }
      runsBlock.appendChild(ol);
    } else {
      const p = document.createElement('p');
      p.className = 'cron-zen__desc';
      p.textContent = m.cannotEstimate;
      runsBlock.appendChild(p);
    }
    preview.appendChild(runsBlock);

    if (snap.hint) {
      const hint = document.createElement('p');
      hint.className = 'cron-zen__hint' + (snap.validation.valid ? '' : ' is-error');
      hint.textContent = snap.hint;
      preview.appendChild(hint);
    }
  };

  const render = (): void => {
    const snap = ctrl.getSnapshot();
    const m = getUiMessages(snap.locale);
    nav.setAttribute('aria-label', m.ariaTabs);
    body.setAttribute('aria-label', m.ariaBody);
    const tip = mutexTip(snap);
    if (tip) {
      mutexEl.hidden = false;
      mutexEl.textContent = tip;
    } else {
      mutexEl.hidden = true;
    }

    renderTabs();
    // 仅切 Tab / 换语言时重建编辑器，避免输入时重绘抢焦点
    if (lastTab !== snap.activeTab || lastLocale !== snap.locale) {
      lastTab = snap.activeTab;
      lastLocale = snap.locale;
      ensureFieldEditor(snap.activeTab);
    }
    renderPreview();
  };

  const unsub = ctrl.subscribe(render);
  render();

  return {
    getValue: () => ctrl.getSnapshot().expression,
    setValue: (expression: string) => {
      externalValue = expression;
      ctrl.loadExpression(expression);
    },
    flush: () => ctrl.flush(),
    reset: () => ctrl.reset(),
    destroy: () => {
      unsub();
      ctrl.destroy();
      fieldHandle?.destroy();
      if (copiedTimer) clearTimeout(copiedTimer);
      el.replaceChildren();
    },
    controller: ctrl,
  };
}
