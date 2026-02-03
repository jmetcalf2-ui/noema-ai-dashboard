export type ColumnType = "numeric" | "categorical" | "datetime" | "geo" | "text" | "id";

export type SemanticType =
    | "nominal" | "ordinal" | "interval" | "ratio"
    | "currency" | "percent" | "uncertainty_bound";

export interface ColumnProfile {
    name: string;
    inferredType: ColumnType;
    semanticType?: SemanticType;
    missingRate: number;
    uniqueCount: number;
    examples: string[];
    numeric?: {
        min: number;
        max: number;
        mean: number;
        median: number;
        std: number;
        skew: number;
        p10: number;
        p25: number;
        p75: number;
        p90: number;
        zeros?: number;
    };
    outlierCount?: number;
    isDiscrete?: boolean;
}

export interface DatasetProfile {
    rowCount: number;
    columns: ColumnProfile[];
    numericColumns: string[];
    categoricalColumns: string[];
    datetimeColumns: string[];
    geoColumns: string[];
    idColumns: string[];
    correlations?: Array<{ a: string; b: string; r: number }>;
    warnings: string[];
}

export interface VizPlan {
    title: string;
    rationale: string;
    complexity: "simple" | "moderate" | "complex";
    datasets: Array<{
        name: string;
        source: "filtered_rows";
        transforms: Transform[];
    }>;
    views: ViewSpec[];
    interactions: InteractionSpec[];
    caveats?: string[];
}

export type Transform =
    | { type: "filter"; expr: string }
    | { type: "groupby"; keys: string[]; metrics: MetricSpec[] }
    | { type: "bin"; field: string; bins?: number }
    | { type: "sort"; by: string; order: "asc" | "desc" }
    | { type: "limit"; n: number }
    | { type: "derive"; as: string; expr: string };

export type MetricSpec =
    | { op: "count"; as: string }
    | { op: "sum" | "avg" | "min" | "max"; field: string; as: string }
    | { op: "p50" | "p90" | "p95"; field: string; as: string };

export interface ViewSpec {
    id: string;
    kind:
    | "table"
    | "bar"
    | "stacked_bar"
    | "line"
    | "area"
    | "scatter"
    | "bubble"
    | "histogram"
    | "box"
    | "heatmap"
    | "map_points"
    | "map_choropleth"
    | "network"
    | "sankey"
    | "parallel_coords";
    dataset: string;
    encodings: {
        x?: string;
        y?: string;
        color?: string;
        size?: string;
        category?: string;
        series?: string;
        label?: string;
        tooltip?: string[];
    };
    options?: {
        logScale?: boolean;
        showTrendline?: boolean;
        confidenceBand?: { lower: string; upper: string; opacity?: number };
        errorBars?: { field: string; type: "std" | "stderr" | "ci95" };
        topK?: number;
        facetBy?: string;
        semanticColor?: boolean;
    };
    annotations?: Array<{ type: "text" | "line" | "range"; value: any; note: string }>;
}

export type InteractionSpec =
    | { type: "brush_link"; sourceViewId: string; targetViewIds: string[]; fields: string[] }
    | { type: "filter_control"; field: string; ui: "dropdown" | "slider" | "range"; targetViewIds: string[] }
    | { type: "search_highlight"; fields: string[]; targetViewIds: string[] };

export interface VizRequest {
    mode: "client_research" | "editorial_analysis";
    question: string;
    filters?: Record<string, any>;
    selectedColumns?: string[];
    rowsSample: Record<string, any>[];
    datasetProfile: DatasetProfile;
}

export interface VizResponse {
    plan: VizPlan;
}
