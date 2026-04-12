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
      const browserType = browser.browserType().name();
      const version = browser.version();
      await browser.close();

      return { browser: browserType, version };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }
}
