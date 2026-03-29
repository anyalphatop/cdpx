import { PageRunner } from '../../page-runner.js';

export interface AisearchParams {
  query: string;
}

export interface AisearchResult {
  query: string;
}

export class AisearchRunner extends PageRunner<AisearchParams, AisearchResult> {
  async navigate(_params: AisearchParams): Promise<void> {}

  async ready(_params: AisearchParams): Promise<void> {}

  async interact(_params: AisearchParams): Promise<void> {}

  async settle(_params: AisearchParams): Promise<void> {}

  async extract({ query }: AisearchParams): Promise<AisearchResult> {
    return { query };
  }
}
