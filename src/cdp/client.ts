import WebSocket from 'ws';

interface CdpResponse {
  id: number;
  result?: {
    result?: {
      subtype?: string;
      description?: string;
      value?: unknown;
    };
  };
}

export class CdpClient {
  private seq = 0;

  private constructor(private ws: WebSocket) {}

  static async connect(wsUrl: string): Promise<CdpClient> {
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });
    return new CdpClient(ws);
  }

  eval(expression: string, { awaitPromise = false } = {}): Promise<unknown> {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const handler = (raw: WebSocket.RawData) => {
        const msg = JSON.parse(String(raw)) as CdpResponse;
        if (msg.id !== id) return;
        this.ws.off('message', handler);
        if (msg.result?.result?.subtype === 'error') {
          reject(new Error(msg.result.result.description));
        } else {
          resolve(msg.result?.result?.value);
        }
      };
      this.ws.on('message', handler);
      this.ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise } }));
    });
  }

  close(): void {
    this.ws.close();
  }
}
