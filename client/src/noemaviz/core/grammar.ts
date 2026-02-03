import { SemanticType } from "./data_engine";

// ============================================================================
// 1. PRIMITIVES
// ============================================================================

export type VizMark = "point" | "line" | "rect" | "area" | "text" | "arc";

export type Channel = "x" | "y" | "color" | "size" | "opacity" | "shape" | "text";

export type ScaleType = "linear" | "log" | "time" | "ordinal" | "band";

export interface VizEncoding {
    field: string;
    type: SemanticType;
    channel: Channel;
    scale?: {
        type: ScaleType;
        domain?: [number, number] | string[];
        range?: [number, number] | string[];
    };
    axis?: {
        title?: string;
        grid?: boolean;
        format?: string;
    };
    legend?: {
        title?: string;
    };
}

// ============================================================================
// 2. TRANSFORMATIONS
// ============================================================================

export type VizTransform =
    | { type: "filter"; field: string; op: ">" | "<" | "==" | "!=" | "in"; value: any }
    | { type: "aggregate"; groupby: string[]; fields: string[]; ops: ("sum" | "mean" | "count")[] }
    | { type: "bin"; field: string; bins: number };

// ============================================================================
// 3. SPECIFICATION (THE GRAMMAR)
// ============================================================================

export interface IVizSpec {
    id: string; // Unique ID for the view (for linkage)
    description?: string; // Natural language description (for a11y & reasoning)

    data: {
        source: string; // ID of the DataFrame
        transforms?: VizTransform[];
    };

    mark: VizMark;

    encodings: Partial<Record<Channel, VizEncoding>>;

    // Layout hints (not CSS, but analytical layout)
    layout?: {
        width?: number; // Logical units
        height?: number;
        title?: string;
    };
}

/**
 * Helper to create a blank spec
 */
export function createSpec(dataId: string, mark: VizMark): IVizSpec {
    return {
        id: crypto.randomUUID(),
        data: { source: dataId },
        mark,
        encodings: {},
    };
}
