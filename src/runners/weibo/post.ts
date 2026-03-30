import { PageRunner } from '../../page-runner.js';

export interface PostParams {
  text?: string;
  images?: string[];
  topics?: string[];
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

    // Clear any existing text
    await this.client.eval(`(function() {
      const ta = document.querySelector('textarea');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, '');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);

    // Remove any existing images by clicking their delete buttons one by one
    let deleted = true;
    while (deleted) {
      deleted = await this.client.eval(`(function() {
        const btn = document.querySelector('[class*=picbed] [title="删除"]');
        if (!btn) return false;
        btn.click();
        return true;
      })()`) as boolean;
      if (deleted) await new Promise(r => setTimeout(r, 300));
    }
  }

  async interact(): Promise<void> {
    const { text, images, topics } = this.params;

    const fullText = [
      text ?? '',
      topics && topics.length > 0 ? topics.map(t => `#${t}#`).join(' ') : '',
    ].filter(Boolean).join('\n');

    if (fullText) {
      await this.client.eval(`
        (function() {
          const ta = document.querySelector('textarea');
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          setter.call(ta, ${JSON.stringify(fullText)});
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        })()
      `);
    }

    if (images && images.length > 0) {
      await this.client.setFileInputFiles('input[type=file]', images);
      await this.waitForImagesUploaded();
    }
  }

  async settle(): Promise<void> {
    await this.client.eval(`
      (function() {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(el => el.textContent.trim() === '发送');
        if (!btn) throw new Error('发送按钮未找到');
        if (btn.disabled) throw new Error('发送按钮不可用');
        btn.click();
      })()
    `);
    await this.waitForPostSuccess();
  }

  async extract(): Promise<void> {}

  private async waitForImagesUploaded(): Promise<void> {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 500));
      const ready = await this.client.eval(`(function() {
        const picbed = document.querySelector('[class*=picbed]');
        if (!picbed) return false;
        const imgs = Array.from(picbed.querySelectorAll('img'));
        return imgs.length > 0 && imgs.every(img => img.src.includes('sinaimg.cn') && img.naturalWidth > 0);
      })()`);
      if (ready) return;
    }
    throw new Error('图片上传超时');
  }

  private async waitForPostSuccess(): Promise<void> {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 300));
      const text = await this.client.eval(`(function() {
        const el = document.querySelector('[role=alert]');
        return el ? el.textContent.trim() : '';
      })()`);
      if (String(text) === '发布成功') return;
    }
    throw new Error('发布超时，未检测到成功提示');
  }
}
