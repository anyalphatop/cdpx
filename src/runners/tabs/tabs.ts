import type { Runner } from '../../runner.js';

export interface TabsParams {
  host: string;
  port: number;
  timeout: number;
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  type: string;
}

export class TabsRunner implements Runner<TabsParams, Tab[]> {
  async run({ host, port, timeout }: TabsParams): Promise<Tab[]> {
    const response = await fetch(`http://${host}:${port}/json/list`, {
      signal: AbortSignal.timeout(timeout),
    });
    const data = await response.json() as Tab[];
    return data.map(({ id, title, url, type }) => ({ id, title, url, type }));
  }
}
