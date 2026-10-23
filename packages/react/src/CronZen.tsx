import {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import type { CronState, WeekFormat } from '@cron-zen/core';
import { mountCronZen, type CronZenHandle } from '@cron-zen/vanilla';
/** 构建时打入 dist/cron-zen-react.css（与 vanilla 同源样式） */
import '../../vanilla/src/styles/cron-zen.css';

/**
 * @description React CronZen 组件 Props（薄封装 vanilla mount）
 */
export interface CronZenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * @description 受控表达式；空串不注入默认
   */
  value?: string;
  /**
   * @description 表达式变更（受控写回）
   * @param {string} expression - 新表达式
   * @param {CronState} state - 可视化状态
   */
  onChange?: (expression: string, state: CronState) => void;
  /**
   * @description 写回防抖毫秒；默认 0（即时）
   */
  debounceMs?: number;
  /**
   * @description 预览最近触发次数
   */
  nextCount?: number;
  /**
   * @description 是否展示底部预览（弹窗建议 false）
   */
  showPreview?: boolean;
  /**
   * @description 周字段输出写法
   */
  weekFormat?: WeekFormat;
  /**
   * @description IANA 时区（近 N 次）
   */
  timeZone?: string;
  /**
   * @description UI / 自然语言语言；默认 zh-CN
   */
  locale?: string;
  /**
   * @description 容器 className
   */
  className?: string;
  /**
   * @description 容器 style
   */
  style?: CSSProperties;
}

/**
 * @description 透传的 imperative 句柄（对齐 vanilla CronZenHandle）
 */
export type CronZenRef = CronZenHandle;

/**
 * @description React 可视化 Cron 编辑器（底层 mountCronZen）
 * @example
 * import { CronZen } from '@cron-zen/react';
 * import '@cron-zen/react/style.css';
 * <CronZen value={cron} onChange={setCron} locale="zh-CN" />
 */
export const CronZen = forwardRef<CronZenRef, CronZenProps>(function CronZen(
  {
    value = '',
    onChange,
    debounceMs = 0,
    nextCount = 10,
    showPreview = true,
    weekFormat = 'number',
    timeZone,
    locale = 'zh-CN',
    className,
    style,
    ...rest
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<CronZenHandle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 稳定回调，避免因 onChange 引用变化反复 remount
  const onChangeStable = useRef((expression: string, state: CronState) => {
    onChangeRef.current?.(expression, state);
  });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const api = mountCronZen(el, {
      value,
      debounceMs,
      nextCount,
      showPreview,
      weekFormat,
      timeZone,
      locale,
      onChange: (expression, state) => onChangeStable.current(expression, state),
    });
    apiRef.current = api;

    return () => {
      api.destroy();
      apiRef.current = null;
    };
    // 仅挂载一次；后续用 props 同步
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-once
  }, []);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    if (api.getValue() !== value) {
      api.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    apiRef.current?.controller.setLocale(locale);
  }, [locale]);

  useEffect(() => {
    apiRef.current?.controller.setTimeZone(timeZone);
  }, [timeZone]);

  useEffect(() => {
    apiRef.current?.controller.setWeekFormat(weekFormat);
  }, [weekFormat]);

  useImperativeHandle(
    ref,
    () =>
      ({
        getValue: () => apiRef.current?.getValue() ?? '',
        setValue: (expression: string) => apiRef.current?.setValue(expression),
        flush: () => apiRef.current?.flush(),
        reset: () => apiRef.current?.reset(),
        destroy: () => apiRef.current?.destroy(),
        get controller() {
          return apiRef.current!.controller;
        },
      }) as CronZenHandle,
    [],
  );

  return (
    <div
      ref={hostRef}
      className={className}
      style={style}
      data-cron-zen-react=""
      {...rest}
    />
  );
});

CronZen.displayName = 'CronZen';
