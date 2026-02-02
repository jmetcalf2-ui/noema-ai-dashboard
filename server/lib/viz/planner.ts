import type { DatasetProfile, VizPlan, VizRequest, ViewSpec, Transform } from "../../../shared/viz";

export function generateVizPlan(req: VizRequest): VizPlan {
    const { datasetProfile, question, rowsSample } = req;
    const numRows = datasetProfile.rowCount;

    // Complexity Scoring
    let score = 0;
    // V: Variables referenced (heuristic: check question against column names)
    const referencedCols = datasetProfile.columns.filter(c =>
        question.toLowerCase().includes(c.name.toLowerCase())
    );
    const V = referencedCols.length;

    // N: Row count
    score += numRows > 5000 ? 1.0 : numRows > 500 ? 0.5 : 0;

    // C: Dominant categorical cardinality
    const categoricalCols = datasetProfile.columns.filter(c => c.inferredType === "categorical");
    const maxCardinality = Math.max(...categoricalCols.map(c => c.uniqueCount), 0);
    score += maxCardinality > 12 ? 1.0 : maxCardinality > 6 ? 0.5 : 0;

    // T: Time signal
    const hasTime = datasetProfile.datetimeColumns.length > 0;
    const requestedTime = hasTime && (question.includes("time") || question.includes("trend") || question.includes("year"));
    score += (hasTime && requestedTime) ? 0.8 : 0;

    // G: Geo signal
    const hasGeo = datasetProfile.geoColumns.length > 0;
    const requestedGeo = hasGeo && (question.includes("map") || question.includes("location") || question.includes("where"));
    score += (hasGeo && requestedGeo) ? 0.8 : 0;

    // R: Correlation
    const maxCorr = datasetProfile.correlations ?
        Math.max(...datasetProfile.correlations.map(c => Math.abs(c.r))) : 0;
    score += maxCorr >= 0.6 ? 1.0 : maxCorr >= 0.35 ? 0.5 : 0;

    const complexity = score >= 4.0 ? "complex" : score >= 2.0 ? "moderate" : "simple";

    // Baseline Rules
    const views: ViewSpec[] = [];
    const datasets = [{ name: "main", source: "filtered_rows" as const, transforms: [] as Transform[] }];

    // Rule 1: Trend over time
    if (hasTime && (question.includes("trend") || question.includes("over time") || !views.length) && datasetProfile.numericColumns.length > 0) {
        const timeCol = datasetProfile.datetimeColumns[0];
        const valCol = datasetProfile.numericColumns[0]; // simplistic selection

        views.push({
            id: "trend_line",
            kind: "line",
            dataset: "main",
            encodings: { x: timeCol, y: valCol, tooltip: [timeCol, valCol] },
            options: { showTrendline: true, confidenceBand: score >= 2 ? { lower: "p10", upper: "p90" } : undefined }
        });
    }

    // Rule 2: Distribution
    if (datasetProfile.numericColumns.length > 0 && (question.includes("dist") || !views.length)) {
        const valCol = datasetProfile.numericColumns.find(c => question.includes(c)) || datasetProfile.numericColumns[0];
        const isBigSkew = datasetProfile.columns.find(c => c.name === valCol)?.numeric?.skew || 0 > 2;

        views.push({
            id: "dist_hist",
            kind: "histogram",
            dataset: "main",
            encodings: { x: valCol },
            options: { logScale: Boolean(isBigSkew), facetBy: complexity === "complex" && categoricalCols.length > 0 ? categoricalCols[0].name : undefined }
        });
    }

    // Rule 3: Compare Categories
    if (categoricalCols.length > 0 && datasetProfile.numericColumns.length > 0 && (question.includes("compare") || !views.length)) {
        const catCol = categoricalCols[0].name;
        const valCol = datasetProfile.numericColumns[0];

        views.push({
            id: "cat_bar",
            kind: "bar",
            dataset: "main",
            encodings: { x: catCol, y: valCol, color: catCol },
            options: { topK: 10 }
        });
    }

    // Fallback
    if (views.length === 0) {
        views.push({
            id: "fallback_table",
            kind: "table",
            dataset: "main",
            encodings: {}
        });
    }

    return {
        title: "Suggested Visualizations",
        rationale: `Selected based on complexity score of ${score.toFixed(1)} (${complexity}) and detected signals.`,
        complexity,
        datasets,
        views: views.slice(0, complexity === "simple" ? 2 : 4), // limit views
        interactions: []
    };
}
