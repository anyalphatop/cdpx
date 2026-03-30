import type { Runner } from '../../runner.js';
import { config } from '../../config.js';

export interface Tab {
  id: string;
  title: string;
  url: string;
  type: string;
}

export class TabsRunner implements Runner<void, Tab[]> {
  async run(): Promise<Tab[]> {
    const { host, port, timeout } = config.cdp;
    const response = await fetch(`http://${host}:${port}/json/list`, {
      signal: AbortSignal.timeout(timeout),
    });
    const data = await response.json() as Tab[];
    return data.map(({ id, title, url, type }) => ({ id, title, url, type }));
  }
}
