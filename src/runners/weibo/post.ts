import { PageRunner } from '../../page-runner.js';

export interface PostParams {
  text?: string;
  images?: string[];
}

export class PostRunner extends PageRunner<PostParams, void> {
  async navigate(): Promise<void> {
    await this.openTab('https://weibo.com');
  }

  async ready(): Promise<void> {}

  async extract(): Promise<void> {}
}
