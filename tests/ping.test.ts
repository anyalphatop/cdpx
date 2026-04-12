import { test, expect } from 'vitest';
import { cdpx } from '../src/sdk.js';

test('ping', async () => {
  const result = await cdpx.ping();

  expect(result.browser).toBeDefined();
  expect(result.browserType).toBeDefined();
  expect(result.version).toBeDefined();
  expect(result.error).toBeUndefined();
});
