import { CdpClient } from '../../cdp/client.js';
import type { Runner } from '../../runner.js';

export interface DouyinVideoParams {
  // 抖音分享链接，支持 v.douyin.com 短链或完整链接
  url: string;
}

export interface DouyinVideoResult {
  downloadUrl: string;
}

export class DouyinVideoRunner implements Runner<DouyinVideoParams, DouyinVideoResult> {
  async run(params: DouyinVideoParams): Promise<DouyinVideoResult> {
    // 打开 savetik 页面，利用其浏览器上下文绕过 Cloudflare 验证
    const client = await CdpClient.open('https://savetik.co/en2');
    try {
      // 等待输入框出现，确保 Cloudflare cookie 已写入
      await client.pollFor(`document.querySelectorAll('#s_input').length`, 15000);

      // 在页面上下文中调用 ajaxSearch 接口，自动携带 cookie
      // eval 不支持 async，用全局变量 + pollFor 等待异步结果
      const body = new URLSearchParams({ q: params.url, lang: 'en', cftoken: '' }).toString();
      await client.eval(`
        window.__douyinDownloadUrl = null;
        (async () => {
          const res = await fetch('/api/ajaxSearch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: ${JSON.stringify(body)},
          });
          const json = await res.json();
          if (json.status !== 'ok') return;
          // 解析响应 HTML，找到文本含 "Download MP4 [" 的下载链接
          const doc = new DOMParser().parseFromString(json.data, 'text/html');
          for (const a of doc.querySelectorAll('a')) {
            if (a.textContent.includes('Download MP4 [')) {
              window.__douyinDownloadUrl = a.href;
              return;
            }
          }
        })();
      `);

      // 等待异步操作完成（结果写入 window.__douyinDownloadUrl）
      await client.pollFor(`window.__douyinDownloadUrl ? 1 : 0`, 15000);
      const downloadUrl = await client.eval(`window.__douyinDownloadUrl`) as string | null;

      if (!downloadUrl) throw new Error('Download link not found in response');
      return { downloadUrl };
    } finally {
      await client.close().catch(() => {});
    }
  }
}
