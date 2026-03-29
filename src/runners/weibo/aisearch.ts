import type { Runner } from '../../runner.js';

export interface AisearchParams {
  query: string;
}

export interface AisearchResult {
  query: string;
}

export class AisearchRunner implements Runner<AisearchParams, AisearchResult> {
  async run({ query }: AisearchParams): Promise<AisearchResult> {
    return { query };
  }
}
