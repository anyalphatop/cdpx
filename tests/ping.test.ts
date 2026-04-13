import { test, expect } from 'vitest';
import { cdpx } from '../src/sdk.js';

test('ping', async () => {
  const result = await cdpx.ping();

  expect(result.browserType).toBe('chromium');
  expect(result.version).toBeDefined();
  expect(result.error).toBeUndefined();
});
