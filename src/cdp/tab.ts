import { config } from '../config.js';

export interface TabInfo {
  id: string;
  webSocketDebuggerUrl: string;
}

export async function openTab(url: string): Promise<TabInfo> {
  const { host, port, timeout } = config.cdp;
  const response = await fetch(
    `http://${host}:${port}/json/new?${encodeURIComponent(url)}`,
    { method: 'PUT', signal: AbortSignal.timeout(timeout) }
  );
  if (!response.ok) throw new Error(`Failed to open tab: HTTP ${response.status}`);
  return response.json() as Promise<TabInfo>;
}

export async function closeTab(tabId: string): Promise<void> {
  const { host, port, timeout } = config.cdp;
  const response = await fetch(
    `http://${host}:${port}/json/close/${tabId}`,
    { signal: AbortSignal.timeout(timeout) }
  );
  if (!response.ok) throw new Error(`Failed to close tab: HTTP ${response.status}`);
}
