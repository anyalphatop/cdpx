import WebSocket from 'ws';
import { config } from '../config.js';

export class CdpClient {
  private _seq = 1;

  private constructor(
    private readonly tabId: string,
    private readonly ws: WebSocket,
  ) {}

  static async open(url: string): Promise<CdpClient> {
    const { host, port, timeout } = config.cdp;
    const response = await fetch(
      `http://${host}:${port}/json/new?${encodeURIComponent(url)}`,
      { method: 'PUT', signal: AbortSignal.timeout(timeout) }
    );
    if (!response.ok) throw new Error(`Failed to open tab: HTTP ${response.status}`);
    const tab = await response.json() as { id: string; webSocketDebuggerUrl: string };
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
    return new CdpClient(tab.id, ws);
  }

  eval(expression: string): Promise<unknown> {
    const id = this._seq++;
    return new Promise((resolve, reject) => {
      const handler = (raw: WebSocket.RawData) => {
        const msg = JSON.parse(raw.toString()) as { id: number; result: { result: { subtype?: string; description?: string; value?: unknown } } };
        if (msg.id !== id) return;
        this.ws.off('message', handler);
        if (msg.result?.result?.subtype === 'error') {
          reject(new Error(msg.result.result.description));
        } else {
          resolve(msg.result?.result?.value);
        }
      };
      this.ws.on('message', handler);
      this.ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression } }));
    });
  }

  async close(): Promise<void> {
    this.ws.close();
    const { host, port, timeout } = config.cdp;
    const response = await fetch(
      `http://${host}:${port}/json/close/${this.tabId}`,
      { signal: AbortSignal.timeout(timeout) }
    );
    if (!response.ok) throw new Error(`Failed to close tab: HTTP ${response.status}`);
  }
}
