import { chromium } from 'playwright-core';
import { config } from '../../config.js';

export interface PingResult {
  browser?: string;
  browserType?: string;
  version?: string;
  error?: string;
}

export class PingRunner {
  async run(): Promise<PingResult> {
    const { host, port, timeout } = config.cdp;
    const url = `http://${host}:${port}`;

    try {
      // Fetch the WebSocket URL from /json/version to avoid trailing-slash 400 issue
      const res = await fetch(`${url}/json/version`, { signal: AbortSignal.timeout(timeout) });
      const { webSocketDebuggerUrl } = await res.json() as { webSocketDebuggerUrl: string };

      const browser = await chromium.connectOverCDP(webSocketDebuggerUrl, { timeout });
      const browserType = browser.browserType().name();
      const version = browser.version();
      await browser.close();

      return { browser: url, browserType, version };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }
}
