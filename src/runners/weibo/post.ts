import { PageRunner } from '../../page-runner.js';

export interface PostParams {
  text?: string;
  images?: string[];
}

export class PostRunner extends PageRunner<PostParams, void> {
  async navigate(): Promise<void> {
    await this.openTab('https://weibo.com');
    await this.client.waitForNetworkIdle(1000);
  }

  async ready(): Promise<void> {
    // Click textarea to expand the compose toolbar
    await this.client.eval(`document.querySelector('textarea').click()`);
    await new Promise(r => setTimeout(r, 500));
  }

  async interact(): Promise<void> {
    const { text, images } = this.params;

    if (text) {
      await this.client.eval(`
        (function() {
          const ta = document.querySelector('textarea');
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          nativeInputValueSetter.call(ta, ${JSON.stringify(text)});
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        })()
      `);
    }

    if (images && images.length > 0) {
      await this.client.setFileInputFiles('input[type=file]', images);
      // Wait for images to upload
      await this.client.waitForNetworkIdle(1000);
    }
  }

  async settle(): Promise<void> {
    // Click send button
    await this.client.eval(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(el => el.textContent.trim() === '发送');
        if (!btn) throw new Error('发送按钮未找到');
        if (btn.disabled) throw new Error('发送按钮不可用');
        btn.click();
      })()
    `);
    // Wait for post request to complete
    await this.client.waitForNetworkIdle(1000);
  }

  async extract(): Promise<void> {}
}
