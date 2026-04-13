import { test, expect } from 'vitest';
import { cdpx } from '../src/sdk.js';

test('tab list', async () => {
  const result = await cdpx.tab.list();

  expect(Array.isArray(result)).toBe(true);
  for (const tab of result) {
    expect(typeof tab.title).toBe('string');
    expect(typeof tab.url).toBe('string');
  }
});

test('tab count', async () => {
  const result = await cdpx.tab.count();

  expect(typeof result).toBe('number');
  expect(result).toBeGreaterThanOrEqual(0);
});
