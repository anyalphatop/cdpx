import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface ReadParams {
  url: string;
  idleWindow?: number;
  settle?: number;
  excludePatterns?: (string | RegExp)[];
}

export interface ReadResult {
  title: string | null;
  content: string | null;
  textContent: string | null;
  length: number | null;
  excerpt: string | null;
  byline: string | null;
  dir: string | null;
  siteName: string | null;
  lang: string | null;
  publishedTime: string | null;
}

export class ReadRunner extends PageRunner<ReadParams, ReadResult> {
  async navigate(): Promise<void> {
    await this.openBlankTab();
    await this.client.navigateTo(this.params.url);
  }

  async ready(): Promise<void> {
    const idleWindow = this.params.idleWindow ?? config.cdp.networkIdleWindow;
    await this.client.waitForNetworkIdle(idleWindow, this.params.excludePatterns);
  }

  async settle(): Promise<void> {
    const delay = this.params.settle ?? 0;
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
  }

  async extract(): Promise<ReadResult> {
    const html = await this.client.eval('document.documentElement.outerHTML') as string;
    const dom = new JSDOM(html, { url: this.params.url });
    const article = new Readability(dom.window.document).parse();
    return {
      title: article?.title ?? null,
      content: article?.content ?? null,
      textContent: article?.textContent ?? null,
      length: article?.length ?? null,
      excerpt: article?.excerpt ?? null,
      byline: article?.byline ?? null,
      dir: article?.dir ?? null,
      siteName: article?.siteName ?? null,
      lang: article?.lang ?? null,
      publishedTime: article?.publishedTime ?? null,
    };
  }
}
