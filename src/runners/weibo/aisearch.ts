import { PageRunner } from '../../page-runner.js';

export interface AisearchParams {
  query: string;
}

export interface AisearchResult {
  query: string;
}

export class AisearchRunner extends PageRunner<AisearchParams, AisearchResult> {
  async navigate(): Promise<void> {}

  async ready(): Promise<void> {}

  async interact(): Promise<void> {}

  async settle(): Promise<void> {}

  async extract(): Promise<AisearchResult> {
    return { query: this.params.query };
  }
}
