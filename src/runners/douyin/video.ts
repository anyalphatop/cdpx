import type { Runner } from '../../runner.js';
import { config } from '../../config.js';
import { getContext } from '../../cdp/browser.js';

export interface DouyinVideoDownloadLinkParams {
  url: string;
}

export interface DouyinVideoDownloadLinkResult {
  link: string;
}

export class DouyinVideoDownloadLinkRunner
  implements Runner<DouyinVideoDownloadLinkParams, DouyinVideoDownloadLinkResult> {
  async run(params: DouyinVideoDownloadLinkParams): Promise<DouyinVideoDownloadLinkResult> {
    const context = await getContext();
    const page = await context.newPage();

    try {
      await page.goto('https://savetik.co/en2', { waitUntil: 'load' });

      // 等待输入框出现，确保 Cloudflare cookie 已写入
      await page.waitForSelector('#s_input', { timeout: config.cdp.readyTimeout });

      // 在页面上下文中调用 ajaxSearch 接口，自动携带 cookie
      const requestBody = new URLSearchParams({ q: params.url, lang: 'en', cftoken: '' }).toString();

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

        throw new Error('Download link not found');
      }, requestBody);

      return { link: downloadUrl };
    } finally {
      await page.close();
    }
  }
}
