import type { Runner } from '../../runner.js';

export interface PingParams {
  host: string;
  port: number;
  timeout: number;
}

export interface PingResult {
  connected: boolean;
  browser?: string;
  protocolVersion?: string;
  webSocketDebuggerUrl?: string;
  error?: string;
}

export class PingRunner implements Runner<PingParams, PingResult> {
  async run({ host, port, timeout }: PingParams): Promise<PingResult> {
    const url = `http://${host}:${port}/json/version`;

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        return { connected: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json() as {
        Browser?: string;
        'Protocol-Version'?: string;
        webSocketDebuggerUrl?: string;
      };

      return {
        connected: true,
        browser: data.Browser,
        protocolVersion: data['Protocol-Version'],
        webSocketDebuggerUrl: data.webSocketDebuggerUrl,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { connected: false, error: message };
    }
  }
}
