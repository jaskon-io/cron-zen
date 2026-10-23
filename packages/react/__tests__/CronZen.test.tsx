/**
 * @description @cron-zen/react CronZen 组件冒烟 / 受控写回 / locale
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { CronZen, type CronZenRef } from '../src/CronZen';
import { useCronZen } from '../src/useCronZen';

afterEach(() => {
  cleanup();
});

describe('CronZen', () => {
  it('应挂载并展示中文 Tab（默认 zh-CN）', async () => {
    const { container } = render(<CronZen value="" />);
    await waitFor(() => {
      expect(container.textContent).toContain('秒');
      expect(container.textContent).toContain('每秒');
    });
  });

  it('locale=en-US 应英文化', async () => {
    const { container } = render(<CronZen value="" locale="en-US" />);
    await waitFor(() => {
      expect(container.textContent).toContain('Second');
      expect(container.textContent).toContain('Every second');
      expect(container.textContent).not.toContain('每秒');
    });
  });

  it('受控 onChange 应在字段变更后触发', async () => {
    const onChange = vi.fn();
    const ref = createRef<CronZenRef>();
    render(<CronZen ref={ref} value="* * * * * ?" onChange={onChange} debounceMs={0} />);

    await waitFor(() => expect(ref.current).toBeTruthy());

    await act(async () => {
      ref.current!.controller.updateField('hour', {
        mode: 'specific',
        raw: '9',
        value: '9',
      });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      const expr = onChange.mock.calls.at(-1)?.[0] as string;
      expect(expr).toMatch(/9/);
    });
  });

  it('外部 value 变更应 setValue', async () => {
    const ref = createRef<CronZenRef>();
    const { rerender } = render(
      <CronZen ref={ref} value="* * * * * ?" debounceMs={0} />,
    );
    await waitFor(() => expect(ref.current?.getValue()).toMatch(/\*/));

    rerender(<CronZen ref={ref} value="0 0 9 * * ?" debounceMs={0} />);
    await waitFor(() => {
      expect(ref.current?.getValue()).toMatch(/0 0 9/);
    });
  });
});

describe('useCronZen', () => {
  it('应提供 expression 并可 setValue', async () => {
    let api: ReturnType<typeof useCronZen> | null = null;
    function Probe() {
      api = useCronZen({ value: '', debounceMs: 0 });
      return <span data-testid="expr">{api.expression}</span>;
    }
    const { getByTestId } = render(<Probe />);
    await waitFor(() => expect(api?.controller).toBeTruthy());

    await act(async () => {
      api!.setValue('0 0 8 * * ?');
    });

    await waitFor(() => {
      expect(getByTestId('expr').textContent).toMatch(/0 0 8/);
    });
  });
});
