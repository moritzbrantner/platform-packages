/* tslint:disable */
/* eslint-disable */

export class NumericSeriesIndex {
    free(): void;
    [Symbol.dispose](): void;
    getBinnedSeries(query: any): any;
    getChartSeries(query: any): any;
    getHeatmap(query: any): any;
    getHistogram(query: any): any;
    getSeriesBounds(): any;
    constructor(points: any);
}

export function packageSurface(): any;

export function runOperation(request: any): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_numericseriesindex_free: (a: number, b: number) => void;
    readonly numericseriesindex_getBinnedSeries: (a: number, b: any) => [number, number, number];
    readonly numericseriesindex_getChartSeries: (a: number, b: any) => [number, number, number];
    readonly numericseriesindex_getHeatmap: (a: number, b: any) => [number, number, number];
    readonly numericseriesindex_getHistogram: (a: number, b: any) => [number, number, number];
    readonly numericseriesindex_getSeriesBounds: (a: number) => [number, number, number];
    readonly numericseriesindex_new: (a: any) => [number, number, number];
    readonly packageSurface: () => [number, number, number];
    readonly runOperation: (a: any) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
