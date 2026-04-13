import type { Runner } from '../../runner.js';
import { config } from '../../config.js';
import { getContext } from '../../cdp/browser.js';

export interface DouyinVideoDownloadLinkParams {
  url: string;
}

export interface DouyinVideoDownloadLinkResult {
  url: string;
  token: string;
  link: string;
}

// 从任意字符串中提取 https URL，输入本身是 URL 则直接返回
function extractUrl(input: string): string {
  if (input.startsWith('https://')) return input;
  const match = input.match(/https:\/\/\S+/);
  if (!match) throw new Error('No URL found in input');
  return match[0];
}

// 从抖音短链中提取 share token，如 https://v.douyin.com/e57Hz45rJrA/ -> e57Hz45rJrA
function extractToken(url: string): string {
  const match = url.match(/\/([A-Za-z0-9]+)\/?$/);
  if (!match?.[1]) throw new Error('Failed to extract token from URL');
  return match[1];
}

export class DouyinVideoDownloadLinkRunner
  implements Runner<DouyinVideoDownloadLinkParams, DouyinVideoDownloadLinkResult> {
  async run(params: DouyinVideoDownloadLinkParams): Promise<DouyinVideoDownloadLinkResult> {
    const url = extractUrl(params.url);
    const token = extractToken(url);

    const context = await getContext();
    const page = await context.newPage();

    try {
      await page.goto('https://savetik.co/en2', { waitUntil: 'load' });

      // 等待输入框出现，确保 Cloudflare cookie 已写入
      await page.waitForSelector('#s_input', { timeout: config.cdp.readyTimeout });

      // 在页面上下文中调用 ajaxSearch 接口，自动携带 cookie
      const requestBody = new URLSearchParams({ q: url, lang: 'en', cftoken: '' }).toString();

      const link = await page.evaluate(async (body) => {
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

      return { url, token, link };
    } finally {
      await page.close();
    }
  }
}
