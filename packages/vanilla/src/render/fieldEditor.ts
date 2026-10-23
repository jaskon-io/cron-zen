import type {
  CronFieldMode,
  CronFieldName,
  CronFieldState,
  WeekFormat,
} from '@cron-zen/core';
import {
  FIELD_RANGES,
  QUARTZ_MONTH_LABELS,
  QUARTZ_WEEK_LABELS,
  QUARTZ_WEEK_UI_ORDER,
} from '@cron-zen/core';

const MAX_GRID = 120;

type UiMode = CronFieldMode;

/**
 * @description 字段编辑器销毁 / 更新接口
 */
export interface FieldEditorHandle {
  /** @description 用外部状态重绘 */
  update: (field: CronFieldState, weekFormat: WeekFormat) => void;
  /** @description 卸载 */
  destroy: () => void;
}

/**
 * @description 挂载单字段编辑器（对齐 vue3 FieldEditor 主路径）
 * @param {HTMLElement} host - 容器
 * @param {object} opts - 配置
 * @returns {FieldEditorHandle}
 */
export function mountFieldEditor(
  host: HTMLElement,
  opts: {
    name: CronFieldName;
    field: CronFieldState;
    weekFormat: WeekFormat;
    onChange: (field: CronFieldState) => void;
    onWeekFormat?: (format: WeekFormat) => void;
  },
): FieldEditorHandle {
  const range = FIELD_RANGES[opts.name];
  const yearNow = new Date().getFullYear();
  const uid = Math.random().toString(36).slice(2, 9);
  const radioName = `cz-mode-${uid}`;
  const weekFmtName = `cz-week-fmt-${uid}`;

  let mode: UiMode = opts.field.mode;
  let weekFormat = opts.weekFormat;
  let rangeStart = Number(opts.field.value ?? range.min) || range.min;
  let rangeEnd =
    Number(opts.field.secondary ?? Math.min(range.min + 1, range.max)) || range.min + 1;
  let stepBase = Number(opts.field.value ?? range.min) || range.min;
  let stepValue = Number(opts.field.secondary ?? 1) || 1;
  let weekdayNear = Number(opts.field.value ?? 1) || 1;
  let nthOrder = Number(opts.field.secondary ?? 1) || 1;
  let nthWeekday = Number(opts.field.value ?? 2) || 2;
  let lastWeekday = Number(opts.field.value ?? 2) || 2;
  let listVals: number[] = (opts.field.values ?? [])
    .map(Number)
    .filter((n) => Number.isFinite(n));

  const unitMap: Record<CronFieldName, string> = {
    second: '秒',
    minute: '分钟',
    hour: '小时',
    day: '日',
    month: '月',
    week: '周',
    year: '年',
  };
  const unitLabel = unitMap[opts.name];

  const gridMin = opts.name === 'week' ? 1 : range.min;
  const gridMax =
    opts.name === 'year' ? yearNow + 23 : opts.name === 'week' ? 7 : range.max;

  const clamp = (n: number): number => {
    const v = Math.floor(Number(n));
    const min = opts.name === 'week' ? 1 : range.min;
    const max = opts.name === 'week' ? 7 : range.max;
    if (!Number.isFinite(v)) return min;
    return Math.min(max, Math.max(min, v));
  };

  const listDefault = (): number => {
    if (opts.name === 'week') return 2;
    if (opts.name === 'year') return yearNow;
    return gridMin;
  };

  const emitState = (): void => {
    let next: CronFieldState;
    switch (mode) {
      case 'every':
        next = { mode: 'every', raw: '*' };
        break;
      case 'unset':
        next = { mode: 'unset', raw: '?' };
        break;
      case 'range': {
        const start = clamp(rangeStart);
        const end = clamp(rangeEnd);
        next = {
          mode: 'range',
          raw: `${start}-${end}`,
          value: String(start),
          secondary: String(end),
        };
        break;
      }
      case 'step': {
        const base = clamp(stepBase);
        const step = Math.max(1, Math.floor(stepValue) || 1);
        next = {
          mode: 'step',
          raw: `${base}/${step}`,
          value: String(base),
          secondary: String(step),
        };
        break;
      }
      case 'weekday': {
        const d = Math.min(31, Math.max(1, Math.floor(weekdayNear) || 1));
        next = { mode: 'weekday', raw: `${d}W`, value: String(d) };
        break;
      }
      case 'last':
        if (opts.name === 'week') {
          const w = Math.min(7, Math.max(1, Math.floor(lastWeekday) || 1));
          next = { mode: 'last', raw: `${w}L`, value: String(w) };
        } else {
          next = { mode: 'last', raw: 'L' };
        }
        break;
      case 'lastWeekday':
        next = { mode: 'lastWeekday', raw: 'LW' };
        break;
      case 'nth': {
        const w = Math.min(7, Math.max(1, Math.floor(nthWeekday) || 1));
        const n = Math.min(5, Math.max(1, Math.floor(nthOrder) || 1));
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
        const values = (listVals.length ? listVals : [listDefault()]).map(String);
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
    opts.onChange(next);
  };

  const selectMode = (m: UiMode): void => {
    mode = m;
    if ((m === 'list' || m === 'specific') && listVals.length === 0) {
      listVals = [listDefault()];
    }
    if (m === 'range' && opts.name === 'week') {
      if (rangeStart < 1 || rangeStart > 7) rangeStart = 2;
      if (rangeEnd < 1 || rangeEnd > 7) rangeEnd = 3;
    }
    emitState();
    render();
  };

  const weekOptions = QUARTZ_WEEK_UI_ORDER.map((v) => ({
    value: v,
    label: QUARTZ_WEEK_LABELS[v] ?? String(v),
  }));

  const el = (tag: string, className?: string, text?: string): HTMLElement => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const numInput = (
    value: number,
    min: number,
    max: number,
    onInput: (v: number) => void,
    m: UiMode,
  ): HTMLInputElement => {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.addEventListener('focus', () => {
      if (mode !== m) selectMode(m);
    });
    input.addEventListener('input', () => {
      onInput(Number(input.value));
      if (mode !== m) selectMode(m);
      else {
        emitState();
      }
    });
    return input;
  };

  const weekSelect = (
    value: number,
    onChange: (v: number) => void,
    m: UiMode,
  ): HTMLSelectElement => {
    const sel = document.createElement('select');
    for (const o of weekOptions) {
      const opt = document.createElement('option');
      opt.value = String(o.value);
      opt.textContent = o.label;
      if (o.value === value) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener('focus', () => {
      if (mode !== m) selectMode(m);
    });
    sel.addEventListener('change', () => {
      onChange(Number(sel.value));
      if (mode !== m) selectMode(m);
      else emitState();
    });
    return sel;
  };

  const rowRadio = (m: UiMode, body: HTMLElement): HTMLElement => {
    const label = el('label', 'cz-row');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = radioName;
    input.checked = mode === m || (m === 'list' && (mode === 'list' || mode === 'specific'));
    input.addEventListener('change', () => selectMode(m));
    label.appendChild(input);
    label.appendChild(body);
    return label;
  };

  const renderGrid = (): HTMLElement => {
    const wrap = el('div', 'cz-grid');
    const order =
      opts.name === 'week'
        ? [...QUARTZ_WEEK_UI_ORDER]
        : Array.from({ length: Math.min(MAX_GRID, gridMax - gridMin + 1) }, (_, i) => gridMin + i);
    const selected = new Set(
      mode === 'list' || mode === 'specific' ? listVals : [],
    );
    for (const n of order.slice(0, MAX_GRID)) {
      if (n < gridMin || n > gridMax) continue;
      const lab = el('label', 'cz-grid__cell');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selected.has(n);
      cb.addEventListener('change', () => {
        if (mode !== 'list' && mode !== 'specific') mode = 'list';
        const set = new Set(listVals);
        if (cb.checked) set.add(n);
        else set.delete(n);
        listVals = [...set].sort((a, b) => a - b).slice(0, gridMax - gridMin + 1);
        emitState();
        render();
      });
      const span = el('span');
      if (opts.name === 'week') span.textContent = QUARTZ_WEEK_LABELS[n] ?? String(n);
      else if (opts.name === 'month') span.textContent = QUARTZ_MONTH_LABELS[n] ?? String(n);
      else if (opts.name === 'year') span.textContent = String(n);
      else span.textContent = String(n).padStart(2, '0');
      lab.appendChild(cb);
      lab.appendChild(span);
      wrap.appendChild(lab);
    }
    return wrap;
  };

  const render = (): void => {
    host.replaceChildren();
    const root = el('div', 'cz-field');

    if (opts.name === 'year') {
      const body = el('span');
      body.innerHTML = '<strong>不指定</strong><em> 非必填</em>';
      root.appendChild(rowRadio('unset', body));
    }

    {
      const body = el('span');
      body.innerHTML = `<strong>每${unitLabel}</strong>`;
      root.appendChild(rowRadio('every', body));
    }

    if (opts.name === 'day' || opts.name === 'week') {
      const body = el('span');
      body.innerHTML = '<strong>不指定</strong>';
      root.appendChild(rowRadio('unset', body));
    }

    {
      const body = el('span', 'cz-row__inline');
      body.appendChild(el('strong', undefined, '周期'));
      body.appendChild(document.createTextNode(' 从 '));
      if (opts.name === 'week') {
        body.appendChild(
          weekSelect(rangeStart, (v) => {
            rangeStart = v;
          }, 'range'),
        );
        body.appendChild(document.createTextNode(' - '));
        body.appendChild(
          weekSelect(rangeEnd, (v) => {
            rangeEnd = v;
          }, 'range'),
        );
      } else {
        body.appendChild(
          numInput(rangeStart, range.min, range.max, (v) => {
            rangeStart = v;
          }, 'range'),
        );
        body.appendChild(document.createTextNode(' - '));
        body.appendChild(
          numInput(rangeEnd, range.min, range.max, (v) => {
            rangeEnd = v;
          }, 'range'),
        );
        body.appendChild(document.createTextNode(` ${unitLabel}`));
      }
      root.appendChild(rowRadio('range', body));
    }

    if (opts.name !== 'week') {
      const body = el('span', 'cz-row__inline');
      body.appendChild(el('strong', undefined, '间隔'));
      body.appendChild(document.createTextNode(' 从 '));
      body.appendChild(
        numInput(stepBase, range.min, range.max, (v) => {
          stepBase = v;
        }, 'step'),
      );
      body.appendChild(document.createTextNode(` ${unitLabel}开始, 每 `));
      body.appendChild(
        numInput(stepValue, 1, range.max, (v) => {
          stepValue = v;
        }, 'step'),
      );
      body.appendChild(
        document.createTextNode(` ${opts.name === 'day' ? '天' : unitLabel}执行一次`),
      );
      root.appendChild(rowRadio('step', body));
    }

    if (opts.name === 'day') {
      const bodyW = el('span', 'cz-row__inline');
      bodyW.appendChild(document.createTextNode('每月 '));
      bodyW.appendChild(
        numInput(weekdayNear, 1, 31, (v) => {
          weekdayNear = v;
        }, 'weekday'),
      );
      bodyW.appendChild(document.createTextNode(' 号最近的那个工作日'));
      root.appendChild(rowRadio('weekday', bodyW));

      const bodyL = el('span');
      bodyL.innerHTML = '<strong>每月最后一天</strong>';
      root.appendChild(rowRadio('last', bodyL));

      const bodyLW = el('span');
      bodyLW.innerHTML = '<strong>本月最后一个工作日</strong>';
      root.appendChild(rowRadio('lastWeekday', bodyLW));
    }

    if (opts.name === 'week') {
      const bodyN = el('span', 'cz-row__inline');
      bodyN.appendChild(document.createTextNode('第 '));
      bodyN.appendChild(
        numInput(nthOrder, 1, 5, (v) => {
          nthOrder = v;
        }, 'nth'),
      );
      bodyN.appendChild(document.createTextNode(' 个 '));
      bodyN.appendChild(
        weekSelect(nthWeekday, (v) => {
          nthWeekday = v;
        }, 'nth'),
      );
      root.appendChild(rowRadio('nth', bodyN));

      const bodyLast = el('span', 'cz-row__inline');
      bodyLast.appendChild(document.createTextNode('本月最后一个 '));
      bodyLast.appendChild(
        weekSelect(lastWeekday, (v) => {
          lastWeekday = v;
        }, 'last'),
      );
      root.appendChild(rowRadio('last', bodyLast));
    }

    const listBlock = el('div', 'cz-row cz-row--block');
    const head = el('label', 'cz-row__head');
    const listRadio = document.createElement('input');
    listRadio.type = 'radio';
    listRadio.name = radioName;
    listRadio.checked = mode === 'list' || mode === 'specific';
    listRadio.addEventListener('change', () => selectMode('list'));
    head.appendChild(listRadio);
    head.appendChild(el('strong', undefined, '指定'));
    listBlock.appendChild(head);
    listBlock.appendChild(renderGrid());
    root.appendChild(listBlock);

    if (opts.name === 'week' && opts.onWeekFormat) {
      const fmt = el('div', 'cz-week-format');
      fmt.setAttribute('role', 'radiogroup');
      fmt.appendChild(el('span', 'cz-week-format__label', '周字段写法：'));
      for (const f of ['number', 'abbr'] as WeekFormat[]) {
        const lab = el('label', 'cz-week-format__opt');
        const r = document.createElement('input');
        r.type = 'radio';
        r.name = weekFmtName;
        r.checked = weekFormat === f;
        r.addEventListener('change', () => {
          weekFormat = f;
          opts.onWeekFormat?.(f);
        });
        lab.appendChild(r);
        lab.appendChild(
          document.createTextNode(
            f === 'number'
              ? '数字 1~7（1=周日，2=周一，…，7=周六）'
              : '英文缩写 SUN…SAT',
          ),
        );
        fmt.appendChild(lab);
      }
      root.appendChild(fmt);
    }

    host.appendChild(root);
  };

  const hydrate = (field: CronFieldState): void => {
    mode = field.mode;
    if (field.mode === 'range') {
      rangeStart = Number(field.value) || rangeStart;
      rangeEnd = Number(field.secondary) || rangeEnd;
    } else if (field.mode === 'step') {
      stepBase = Number(field.value) || stepBase;
      stepValue = Number(field.secondary) || 1;
    } else if (field.mode === 'weekday') {
      weekdayNear = Number(field.value) || 1;
    } else if (field.mode === 'nth') {
      nthWeekday = Number(field.value) || 2;
      nthOrder = Number(field.secondary) || 1;
    } else if (field.mode === 'last' && field.value) {
      lastWeekday = Number(field.value) || 2;
    } else if (field.mode === 'list' || field.mode === 'specific') {
      listVals =
        field.mode === 'list'
          ? (field.values ?? []).map(Number).filter((n) => Number.isFinite(n))
          : [Number(field.value)].filter((n) => Number.isFinite(n));
    }
  };

  hydrate(opts.field);
  render();

  return {
    update: (field, wf) => {
      weekFormat = wf;
      hydrate(field);
      render();
    },
    destroy: () => {
      host.replaceChildren();
    },
  };
}
