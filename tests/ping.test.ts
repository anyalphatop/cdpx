import { test, expect } from 'vitest';
import { cdpx } from '../src/sdk.js';
import { config } from '../src/config.js';

test('ping', async () => {
  const result = await cdpx.ping();

  expect(result.browser).toMatch(/^http/);
  expect(result.browser).toContain(config.cdp.host);
  expect(result.browser).toContain(String(config.cdp.port));

  expect(result.browserType).toBe('chromium');
  expect(result.version).toBeDefined();
  expect(result.error).toBeUndefined();
});
