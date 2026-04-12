import { config } from '../../config.js';
import { getBrowser } from '../../cdp/browser.js';

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
      const browser = await getBrowser(timeout);
      const browserType = browser.browserType().name();
      const version = browser.version();

      return { browser: url, browserType, version };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  }
}
