import { CdpPageRunner } from '../../cdp-page-runner.js';

export interface AisearchParams {
  query: string;
}

export interface AisearchResult {
  query: string;
  answer: string;
}

export class AisearchRunner extends CdpPageRunner<AisearchParams, AisearchResult> {
  async navigate(): Promise<void> {
    const url = `https://s.weibo.com/aisearch?q=${encodeURIComponent(this.params.query)}&Refer=aisearch_aisearch`;
    await this.openTab(url);
  }

  async ready(): Promise<void> {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const visible = await this.cdp.eval(`
        (() => {
          const btn = Array.from(document.querySelectorAll('a.action_btn_wrap'))
            .find(el => el.innerText?.trim().includes('复制'));
          if (!btn) return false;
          return btn.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
        })()
      `);
      if (visible) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('Timed out waiting for AI answer');
  }

  async interact(): Promise<void> {
    await this.cdp.eval(`
      window.__copiedText = null;
      document.addEventListener('copy', (e) => {
        const sel = window.getSelection()?.toString();
        window.__copiedText = sel || e.clipboardData?.getData('text/plain') || null;
      }, true);
      const _origExec = document.execCommand.bind(document);
      document.execCommand = (cmd, ...args) => {
        if (cmd === 'copy') {
          window.__copiedText = window.getSelection()?.toString() || window.__copiedText;
        }
        return _origExec(cmd, ...args);
      };
      if (navigator.clipboard?.writeText) {
        const _origWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = (text) => {
          window.__copiedText = text;
          return _origWrite(text).catch(() => {});
        };
      }
      'ok'
    `);

    await this.cdp.eval(`
      Array.from(document.querySelectorAll('a.action_btn_wrap'))
        .find(el => el.innerText?.trim().includes('复制') && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
        .click()
    `);
  }

  async settle(): Promise<void> {
    await new Promise((r) => setTimeout(r, 600));
  }

  async extract(): Promise<AisearchResult> {
    const answer = (await this.cdp.eval('window.__copiedText')) as string | null;
    return {
      query: this.params.query,
      answer: answer ?? '',
    };
  }
}
