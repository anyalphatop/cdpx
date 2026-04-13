import { getBrowser } from '../../cdp/browser.js';

export interface PingResult {
  browserType: string;
  version: string;
}

export class PingRunner {
  async run(): Promise<PingResult> {
    const browser = await getBrowser();
    const browserType = browser.browserType().name();
    const version = browser.version();

    return { browserType, version };
  }
}
