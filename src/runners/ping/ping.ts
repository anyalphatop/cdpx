import { chromium } from 'playwright-core';
import { config } from '../../config.js';

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
    // 优先使用传入参数，未传则回退到全局 config，不修改全局配置
    const host = params?.host ?? config.cdp.host;
    const port = params?.port ?? config.cdp.port;
    const { timeout } = config.cdp;
    const url = `http://${host}:${port}`;

    try {
      // ping 独立建立连接，不走共享单例，避免影响其他命令
      const resp = await fetch(`${url}/json/version`, { signal: AbortSignal.timeout(timeout) });
      const { webSocketDebuggerUrl } = await resp.json() as { webSocketDebuggerUrl: string };
      const b = await chromium.connectOverCDP(webSocketDebuggerUrl, { timeout });
      const browserType = b.browserType().name();
      const version = b.version();
      await b.close();

      return { host, port, browser: url, browserType, version };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { host, port, error: message };
    }
  }
}
