import type { Runner } from './runner.js';

export abstract class PageRunner<TParams, TResult> implements Runner<TParams, TResult> {
  async run(params: TParams): Promise<TResult> {
    await this.navigate(params);
    await this.ready(params);
    await this.interact(params);
    await this.settle(params);
    return this.extract(params);
  }

  abstract navigate(params: TParams): Promise<void>;
  abstract ready(params: TParams): Promise<void>;
  abstract extract(params: TParams): Promise<TResult>;

  interact(_params: TParams): Promise<void> {
    return Promise.resolve();
  }

  settle(_params: TParams): Promise<void> {
    return Promise.resolve();
  }
}
