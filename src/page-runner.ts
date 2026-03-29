import type { Runner } from './runner.js';

export abstract class PageRunner<TParams, TResult> implements Runner<TParams, TResult> {
  protected params!: TParams;

  async run(params: TParams): Promise<TResult> {
    this.params = params;
    await this.navigate();
    await this.ready();
    await this.interact();
    await this.settle();
    return this.extract();
  }

  abstract navigate(): Promise<void>;
  abstract ready(): Promise<void>;
  abstract extract(): Promise<TResult>;

  interact(): Promise<void> {
    return Promise.resolve();
  }

  settle(): Promise<void> {
    return Promise.resolve();
  }
}
