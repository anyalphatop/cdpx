export interface Runner<TParams, TResult> {
  run(params: TParams): Promise<TResult>;
}
