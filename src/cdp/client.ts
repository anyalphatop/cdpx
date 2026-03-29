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

  private send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = this._seq++;
    return new Promise((resolve, reject) => {
      const handler = (raw: WebSocket.RawData) => {
        const msg = JSON.parse(raw.toString()) as { id: number; result?: unknown; error?: { message: string } };
        if (msg.id !== id) return;
        this.ws.off('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      };
      this.ws.on('message', handler);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async waitForNetworkIdle(idleWindow = 500): Promise<void> {
    await this.send('Network.enable');
    let inflight = 0;
    return new Promise((resolve, reject) => {
      const overallTimer = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout: network did not become idle'));
      }, config.cdp.readyTimeout);
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleIdleCheck = () => {
        if (inflight === 0) {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => { cleanup(); resolve(); }, idleWindow);
        }
      };
      const onMessage = (raw: WebSocket.RawData) => {
        const msg = JSON.parse(raw.toString()) as { method?: string };
        if (!msg.method) return;
        if (msg.method === 'Network.requestWillBeSent') {
          inflight++;
          if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
        } else if (msg.method === 'Network.loadingFinished' || msg.method === 'Network.loadingFailed') {
          inflight = Math.max(0, inflight - 1);
          scheduleIdleCheck();
        }
      };
      const cleanup = () => {
        clearTimeout(overallTimer);
        if (idleTimer) clearTimeout(idleTimer);
        this.ws.off('message', onMessage);
      };
      this.ws.on('message', onMessage);
      scheduleIdleCheck();
    });
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

  async captureClipboard(clickExpression: string): Promise<string> {
    await this.eval(`
      window.__copiedText = null;
      document.addEventListener('copy', (e) => {
        const sel = window.getSelection()?.toString();
        window.__copiedText = sel || e.clipboardData?.getData('text/plain') || null;
      }, true);
      const _origExec = document.execCommand.bind(document);
      document.execCommand = (cmd, ...args) => {
        if (cmd === 'copy') window.__copiedText = window.getSelection()?.toString() || window.__copiedText;
        return _origExec(cmd, ...args);
      };
      if (navigator.clipboard?.writeText) {
        const _orig = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = (text) => { window.__copiedText = text; return _orig(text).catch(() => {}); };
      }
      (${clickExpression});
    `);
    await new Promise(r => setTimeout(r, config.cdp.copyDelay));
    return await this.eval(`window.__copiedText`) as string;
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
