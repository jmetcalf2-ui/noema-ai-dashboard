// Core type definitions for NOEMAVIZ
export interface Point {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface SelectionState {
    ids: Set<number>;
    mode: 'points' | 'lasso' | 'rect';
    bounds?: Rect;
}

export interface Transform {
    scaleX: number;
    scaleY: number;
    translateX: number;
    translateY: number;
}

export interface RenderConfig {
    devicePixelRatio: number;
    width: number;
    height: number;
    theme: Record<string, string>; // CSS variables from ChartContainer
}

// Re-export from existing files for convenience
export type { DataFrame, SemanticColumn, SemanticType } from './data_engine';
export type { IVizSpec, VizMark, VizEncoding } from './grammar';
