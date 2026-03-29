import type { Runner } from './runner.js';
import { config } from './config.js';
import WebSocket from 'ws';

export abstract class PageRunner<TParams, TResult> implements Runner<TParams, TResult> {
  protected params!: TParams;
  private tabId!: string;
  private ws!: WebSocket;
  private _seq = 1;

  async run(params: TParams): Promise<TResult> {
    this.params = params;
    try {
      await this.navigate();
      await this.ready();
      await this.interact();
      await this.settle();
      return await this.extract();
    } finally {
      await this.dispose();
    }
  }

  async dispose(): Promise<void> {
    this.ws?.close();
    if (this.tabId) await this.closeTab(this.tabId).catch(() => {});
  }

  protected async openTab(url: string): Promise<void> {
    const { host, port, timeout } = config.cdp;
    const response = await fetch(
      `http://${host}:${port}/json/new?${encodeURIComponent(url)}`,
      { method: 'PUT', signal: AbortSignal.timeout(timeout) }
    );
    if (!response.ok) throw new Error(`Failed to open tab: HTTP ${response.status}`);
    const tab = await response.json() as { id: string; webSocketDebuggerUrl: string };
    this.tabId = tab.id;
    this.ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws.once('open', resolve);
      this.ws.once('error', reject);
    });
  }

  protected eval(expression: string): Promise<unknown> {
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

  private async closeTab(tabId: string): Promise<void> {
    const { host, port, timeout } = config.cdp;
    const response = await fetch(
      `http://${host}:${port}/json/close/${tabId}`,
      { signal: AbortSignal.timeout(timeout) }
    );
    if (!response.ok) throw new Error(`Failed to close tab: HTTP ${response.status}`);
  }

  abstract navigate(): Promise<void>;
  abstract ready(): Promise<void>;
  abstract extract(): Promise<TResult>;

  interact(): Promise<void> {
    return Promise.resolve();
  }

  settle(): Promise<void> {
    return Promise.resolve();
  }
}
