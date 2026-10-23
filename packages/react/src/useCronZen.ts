import { useEffect, useMemo, useRef, useState } from 'react';
import type { CronState, WeekFormat } from '@cron-zen/core';
import {
  createCronZen,
  type CreateCronZenOptions,
  type CronZenController,
  type CronZenSnapshot,
} from '@cron-zen/vanilla';

/**
 * @description useCronZen 选项（无头状态机，不挂可视化 DOM）
 */
export interface UseCronZenOptions {
  /** @description 初始 / 受控表达式 */
  value?: string;
  /** @description 写回防抖毫秒 */
  debounceMs?: number;
  /** @description 近 N 次 */
  nextCount?: number;
  /** @description 是否计算预览描述与近 N 次 */
  showPreview?: boolean;
  /** @description 周字段写法 */
  weekFormat?: WeekFormat;
  /** @description IANA 时区 */
  timeZone?: string;
  /** @description UI / 自然语言；默认 zh-CN */
  locale?: string;
  /** @description 表达式变更 */
  onChange?: (expression: string, state: CronState) => void;
}

/**
 * @description useCronZen 返回值
 */
export interface UseCronZenReturn {
  /** @description 当前表达式 */
  expression: string;
  /** @description 自然语言 */
  description: string;
  /** @description 近 N 次（格式化） */
  nextRuns: string[];
  /** @description 提示 */
  hint: string;
  /** @description 底层控制器（挂载后可用） */
  controller: CronZenController | null;
  /** @description 立即写回 */
  flush: () => void;
  /** @description 重置 */
  reset: () => void;
  /** @description 加载表达式 */
  setValue: (expression: string) => void;
}

/**
 * @description 无头 CronZen 状态机（createCronZen）。需要完整 UI 请用 `<CronZen />`
 * @param {UseCronZenOptions} [options] - 配置
 * @returns {UseCronZenReturn}
 * @example
 * const { expression, setValue } = useCronZen({ value: '', locale: 'zh-CN' });
 */
export function useCronZen(options: UseCronZenOptions = {}): UseCronZenReturn {
  const onChangeRef = useRef(options.onChange);
  onChangeRef.current = options.onChange;

  const modelRef = useRef({ value: options.value ?? '' });
  const ctrlRef = useRef<CronZenController | null>(null);
  const [snap, setSnap] = useState<CronZenSnapshot | null>(null);

  useEffect(() => {
    let ctrl!: CronZenController;
    const model = {
      get value() {
        return modelRef.current.value;
      },
      set value(v: string) {
        modelRef.current.value = v ?? '';
        onChangeRef.current?.(modelRef.current.value, ctrl.getSnapshot().state);
      },
    };

    const opts: CreateCronZenOptions = {
      modelValue: model,
      debounceMs: options.debounceMs ?? 0,
      nextCount: options.nextCount,
      showPreview: options.showPreview,
      weekFormat: options.weekFormat,
      timeZone: options.timeZone,
      locale: options.locale,
    };

    ctrl = createCronZen(opts);
    ctrlRef.current = ctrl;
    setSnap(ctrl.getSnapshot());
    const unsub = ctrl.subscribe(() => setSnap(ctrl.getSnapshot()));

    return () => {
      unsub();
      ctrl.destroy();
      ctrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once
  }, []);

  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl) return;
    if ((options.value ?? '') !== ctrl.getSnapshot().expression) {
      ctrl.loadExpression(options.value ?? '');
    }
  }, [options.value]);

  useEffect(() => {
    ctrlRef.current?.setLocale(options.locale ?? 'zh-CN');
  }, [options.locale]);

  useEffect(() => {
    ctrlRef.current?.setTimeZone(options.timeZone);
  }, [options.timeZone]);

  useEffect(() => {
    if (options.weekFormat) ctrlRef.current?.setWeekFormat(options.weekFormat);
  }, [options.weekFormat]);

  const api = useMemo(
    () => ({
      flush: () => ctrlRef.current?.flush(),
      reset: () => ctrlRef.current?.reset(),
      setValue: (expression: string) => {
        modelRef.current.value = expression;
        ctrlRef.current?.loadExpression(expression);
      },
    }),
    [],
  );

  return {
    expression: snap?.expression ?? '',
    description: snap?.description ?? '',
    nextRuns: snap?.nextRuns ?? [],
    hint: snap?.hint ?? '',
    controller: ctrlRef.current,
    ...api,
  };
}
