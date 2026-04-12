import { chromium, type Browser } from 'playwright-core';
import { config } from '../config.js';

// 懒加载单例，全局共享同一个 Chrome browser 连接
let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    const { host, port } = config.cdp;
    // 手动 fetch WebSocket URL，避免 Playwright 内部访问 /json/version/ 时 Chrome 返回 400
    const resp = await fetch(`http://${host}:${port}/json/version`);
    const { webSocketDebuggerUrl } = await resp.json() as { webSocketDebuggerUrl: string };
    browser = await chromium.connectOverCDP(webSocketDebuggerUrl);
    // 断开连接时清除缓存，下次调用重新连接
    browser.on('disconnected', () => { browser = null; });
  }
  return browser;
}
