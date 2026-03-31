import WebSocket from 'ws';
import { config } from '../config.js';

export class CdpClient {
  private _seq = 1;

  private constructor(
    private readonly tabId: string,
    private readonly ws: WebSocket,
  ) {}

  static async openBlank(): Promise<CdpClient> {
    return CdpClient.open('about:blank');
  }

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

  async waitForNetworkIdle(idleWindow: number, excludePatterns: (string | RegExp)[] = []): Promise<void> {
    await this.send('Network.enable');
    const isExcluded = (url: string) =>
      excludePatterns.some(p => typeof p === 'string' ? url.includes(p) : p.test(url));
    const inflight = new Set<string>();
    return new Promise((resolve, reject) => {
      const overallTimer = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout: network did not become idle'));
      }, config.cdp.readyTimeout);
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleIdleCheck = () => {
        if (inflight.size === 0) {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => { cleanup(); resolve(); }, idleWindow);
        }
      };
      const onMessage = (raw: WebSocket.RawData) => {
        const msg = JSON.parse(raw.toString()) as { method?: string; params?: Record<string, unknown> };
        if (!msg.method) return;
        if (msg.method === 'Network.requestWillBeSent') {
          const p = msg.params as { requestId: string; request: { url: string }; type?: string };
          if (!isExcluded(p.request.url) && !p.request.url.startsWith('blob:') && p.type !== 'WebSocket') {
            inflight.add(p.requestId);
            if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
          }
        } else if (msg.method === 'Network.responseReceived') {
          const p = msg.params as { requestId: string; response: { mimeType: string } };
          if (p.response.mimeType === 'text/event-stream') {
            inflight.delete(p.requestId);
            scheduleIdleCheck();
          }
        } else if (msg.method === 'Network.loadingFinished' || msg.method === 'Network.loadingFailed') {
          const p = msg.params as { requestId: string };
          inflight.delete(p.requestId);
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

  async listenRequests(callback: (url: string) => void): Promise<void> {
    await this.send('Network.enable');
    this.ws.on('message', (raw: WebSocket.RawData) => {
      const msg = JSON.parse(raw.toString()) as { method?: string; params?: Record<string, unknown> };
      if (msg.method === 'Network.requestWillBeSent') {
        const p = msg.params as { request: { url: string }; type?: string };
        if (!p.request.url.startsWith('blob:') && p.type !== 'WebSocket') {
          callback(p.request.url);
        }
      }
    });
  }

  async navigateTo(url: string): Promise<void> {
    await this.send('Page.navigate', { url });
  }

  async captureJsonResponse(urlPart: string): Promise<unknown> {
    await this.send('Network.enable');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout: no response matching ${urlPart}`));
      }, config.cdp.readyTimeout);
      const pending = new Set<string>();
      const onMessage = async (raw: WebSocket.RawData) => {
        const msg = JSON.parse(raw.toString()) as { method?: string; params?: Record<string, unknown> };
        if (!msg.method) return;
        if (msg.method === 'Network.requestWillBeSent') {
          const p = msg.params as { requestId: string; request: { url: string } };
          if (p.request.url.includes(urlPart)) pending.add(p.requestId);
        } else if (msg.method === 'Network.loadingFinished') {
          const p = msg.params as { requestId: string };
          if (pending.has(p.requestId)) {
            cleanup();
            try {
              const result = await this.send('Network.getResponseBody', { requestId: p.requestId });
              const r = result as { body: string; base64Encoded: boolean };
              const text = r.base64Encoded ? Buffer.from(r.body, 'base64').toString() : r.body;
              resolve(JSON.parse(text));
            } catch (e) { reject(e); }
          }
        }
      };
      const cleanup = () => { clearTimeout(timer); this.ws.off('message', onMessage); };
      this.ws.on('message', onMessage);
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

  async onJsonResponse(urlPart: string, callback: (data: unknown) => void): Promise<() => void> {
    await this.send('Network.enable');
    const pending = new Set<string>();
    const onMessage = async (raw: WebSocket.RawData) => {
      const msg = JSON.parse(raw.toString()) as { method?: string; params?: Record<string, unknown> };
      if (!msg.method) return;
      if (msg.method === 'Network.requestWillBeSent') {
        const p = msg.params as { requestId: string; request: { url: string } };
        if (p.request.url.includes(urlPart)) pending.add(p.requestId);
      } else if (msg.method === 'Network.loadingFinished') {
        const p = msg.params as { requestId: string };
        if (pending.has(p.requestId)) {
          pending.delete(p.requestId);
          try {
            const result = await this.send('Network.getResponseBody', { requestId: p.requestId });
            const r = result as { body: string; base64Encoded: boolean };
            const text = r.base64Encoded ? Buffer.from(r.body, 'base64').toString() : r.body;
            callback(JSON.parse(text));
          } catch {}
        }
      }
    };
    this.ws.on('message', onMessage);
    return () => this.ws.off('message', onMessage);
  }

  async pollFor(expression: string, timeout: number): Promise<void> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const count = await this.eval(expression) as number;
      if (count > 0) return;
      await new Promise(r => setTimeout(r, config.cdp.pollInterval));
    }
    throw new Error(`Timeout waiting for: ${expression}`);
  }

  async setFileInputFiles(selector: string, files: string[]): Promise<void> {
    const { root } = await this.send('DOM.getDocument') as { root: { nodeId: number } };
    const { nodeId } = await this.send('DOM.querySelector', { nodeId: root.nodeId, selector }) as { nodeId: number };
    if (!nodeId) throw new Error(`Element not found: ${selector}`);
    await this.send('DOM.setFileInputFiles', { nodeId, files });
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
