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

export interface PingParams {
  host?: string;
  port?: number;
}

export class PingRunner {
  async run(params?: PingParams): Promise<PingResult> {
    // 用传入的参数覆盖全局 config，未传则保持原值
    if (params?.host) config.cdp.host = params.host;
    if (params?.port) config.cdp.port = params.port;

    const { host, port, timeout } = config.cdp;
    const url = `http://${host}:${port}`;

    try {
      const browser = await getBrowser(timeout);
      const browserType = browser.browserType().name();
      const version = browser.version();

      return { host, port, browser: url, browserType, version };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { host, port, error: message };
    }
  }
}
