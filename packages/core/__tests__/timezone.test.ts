import { describe, it, expect } from 'vitest';
import {
  isValidTimeZone,
  getZonedParts,
  zonedWallTimeToUtc,
  getNextRuns,
  formatRunTime,
  createDefaultCronState,
  createEveryField,
  createUnsetField,
} from '../src';
import type { CronState } from '../src';

describe('timezone helpers', () => {
  it('isValidTimeZone 应识别常见 IANA', () => {
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Asia/Shanghai')).toBe(true);
    expect(isValidTimeZone('America/New_York')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('zonedWallTimeToUtc + getZonedParts 往返（UTC）', () => {
    const utc = zonedWallTimeToUtc(2026, 6, 15, 9, 30, 0, 'UTC');
    expect(utc).not.toBeNull();
    const parts = getZonedParts(utc!, 'UTC');
    expect(parts).toMatchObject({
      year: 2026,
      month: 6,
      day: 15,
      hour: 9,
      minute: 30,
      second: 0,
    });
  });

  it('Asia/Shanghai 墙上 9:00 应对应 UTC 1:00（冬令无 DST）', () => {
    const dt = zonedWallTimeToUtc(2026, 1, 15, 9, 0, 0, 'Asia/Shanghai');
    expect(dt).not.toBeNull();
    expect(dt!.toISOString()).toBe('2026-01-15T01:00:00.000Z');
  });
});

describe('getNextRuns + timeZone', () => {
  it('显式 UTC 与 formatRunTime 一致', () => {
    const state: CronState = {
      ...createDefaultCronState(),
      second: { mode: 'specific', raw: '0', value: '0' },
      minute: { mode: 'specific', raw: '0', value: '0' },
      hour: { mode: 'specific', raw: '9', value: '9' },
      day: createEveryField(),
      week: createUnsetField(),
    };
    const from = new Date('2026-01-01T00:00:00.000Z');
    const runs = getNextRuns(state, 1, from, { timeZone: 'UTC' });
    expect(runs).toHaveLength(1);
    expect(formatRunTime(runs[0], { timeZone: 'UTC' })).toBe('2026-01-01 09:00:00');
  });

  it('Asia/Shanghai 9:00 应落在 UTC 01:00', () => {
    const state: CronState = {
      ...createDefaultCronState(),
      second: { mode: 'specific', raw: '0', value: '0' },
      minute: { mode: 'specific', raw: '0', value: '0' },
      hour: { mode: 'specific', raw: '9', value: '9' },
      day: createEveryField(),
      week: createUnsetField(),
    };
    const from = new Date('2026-01-14T00:00:00.000Z');
    const runs = getNextRuns(state, 1, from, { timeZone: 'Asia/Shanghai' });
    expect(runs).toHaveLength(1);
    expect(runs[0].toISOString()).toBe('2026-01-14T01:00:00.000Z');
    expect(formatRunTime(runs[0], { timeZone: 'Asia/Shanghai' })).toBe(
      '2026-01-14 09:00:00',
    );
  });

  it('非法 timeZone 应回退本地行为（不抛错）', () => {
    const runs = getNextRuns(createDefaultCronState(), 2, new Date(2026, 0, 1, 12), {
      timeZone: 'Nope/Zone',
    });
    expect(runs.length).toBe(2);
  });
});
