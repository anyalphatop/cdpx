import { chromium } from 'playwright-core';
import type { Runner } from '../../runner.js';
import { config } from '../../config.js';

export interface DouyinVideoDownloadLinkParams {
  // 抖音分享链接，支持 v.douyin.com 短链或完整链接
  url: string;
}

export interface DouyinVideoDownloadLinkResult {
  downloadUrl: string;
}

export class DouyinVideoDownloadLinkRunner implements Runner<DouyinVideoDownloadLinkParams, DouyinVideoDownloadLinkResult> {
  async run(params: DouyinVideoDownloadLinkParams): Promise<DouyinVideoDownloadLinkResult> {
    const { host, port } = config.cdp;

    // 通过 CDP 连接已运行的 Chrome 实例
    // 手动 fetch WebSocket URL，避免 Playwright 内部访问 /json/version/ 时 Chrome 返回 400
    const versionResp = await fetch(`http://${host}:${port}/json/version`);
    const { webSocketDebuggerUrl } = await versionResp.json() as { webSocketDebuggerUrl: string };
    const browser = await chromium.connectOverCDP(webSocketDebuggerUrl);

    const context = browser.contexts()[0] ?? await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('https://savetik.co/en2', { waitUntil: 'load' });

      // 等待输入框出现，确保 Cloudflare cookie 已写入
      await page.waitForSelector('#s_input', { timeout: config.cdp.readyTimeout });

      // 在页面上下文中调用 ajaxSearch 接口，自动携带 cookie
      const body = new URLSearchParams({ q: params.url, lang: 'en', cftoken: '' }).toString();
      const downloadUrl = await page.evaluate(async (body) => {
        const res = await fetch('/api/ajaxSearch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body,
        });
        const json = await res.json() as { status: string; data: string };
        if (json.status !== 'ok') throw new Error('ajaxSearch failed: ' + json.status);

        // 解析响应 HTML，找到文本含 "Download MP4 [" 的下载链接
        const doc = new DOMParser().parseFromString(json.data, 'text/html');
        for (const a of doc.querySelectorAll('a')) {
          if (a.textContent?.includes('Download MP4 [')) return a.href;
        }
        return null;
      }, body);

      if (!downloadUrl) throw new Error('Download link not found in response');
      return { downloadUrl };
    } finally {
      await page.close();
      await browser.close();
    }
  }
}
