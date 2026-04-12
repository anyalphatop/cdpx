import { chromium } from 'playwright-core';
import { config } from '../../config.js';

export interface PingResult {
  browser?: string;
  version?: string;
  error?: string;
}

export class PingRunner {
  async run(): Promise<PingResult> {
    const { host, port, timeout } = config.cdp;

    try {
      const browser = await chromium.connectOverCDP(
        `http://${host}:${port}`,
        { timeout },
      );
      const browser_type = browser.browserType().name();
      const version = browser.version();
      await browser.close();

      return { browser: browser_type, version };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }
}
