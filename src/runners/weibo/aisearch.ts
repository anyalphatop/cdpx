import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface AisearchParams {
  query: string;
}

export interface AisearchResult {
  query: string;
  content: string;
}

export class AisearchRunner extends PageRunner<AisearchParams, AisearchResult> {
  private content!: string;
  async navigate(): Promise<void> {
    const url = `https://s.weibo.com/aisearch?q=${encodeURIComponent(this.params.query)}&Refer=aisearch_aisearch`;
    await this.openTab(url);
  }

  async ready(): Promise<void> {
    const deadline = Date.now() + config.cdp.readyTimeout;
    while (Date.now() < deadline) {
      const visible = await this.client.eval(`
        (() => {
          const btn = Array.from(document.querySelectorAll('a.action_btn_wrap'))
            .find(el => el.innerText?.trim().includes('复制'));
          if (!btn) return false;
          return btn.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
        })()
      `);
      if (visible) return;
      await new Promise(r => setTimeout(r, config.cdp.pollInterval));
    }
    throw new Error('Timeout: 复制 button did not appear');
  }

  async extract(): Promise<AisearchResult> {
    const content = await this.client.captureClipboard(`
      Array.from(document.querySelectorAll('a.action_btn_wrap'))
        .find(el => el.innerText?.trim().includes('复制'))
        .click()
    `);
    return { query: this.params.query, content };
  }
}
