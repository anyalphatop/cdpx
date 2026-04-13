import { config } from '../../config.js';
import { getBrowser } from '../../cdp/browser.js';

export interface PingResult {
  host: string;
  port: number;
  browser?: string;
  browserType?: string;
  version?: string;
  error?: string;
}

export class PingRunner {
  async run(): Promise<PingResult> {
    const { host, port } = config.cdp;
    const url = `http://${host}:${port}`;

    try {
      const browser = await getBrowser();
      const browserType = browser.browserType().name();
      const version = browser.version();

      return { host, port, browser: url, browserType, version };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { host, port, error: message };
    }
  }
}
