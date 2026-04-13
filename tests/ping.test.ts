import { test, expect } from 'vitest';
import { cdpx } from '../src/sdk.js';
import { config } from '../src/config.js';

test('ping', async () => {
  const result = await cdpx.ping();

  expect(result.host).toBe(config.cdp.host);
  expect(result.port).toBe(config.cdp.port);

  expect(result.browserType).toBe('chromium');
  expect(result.version).toBeDefined();
  expect(result.error).toBeUndefined();
});
