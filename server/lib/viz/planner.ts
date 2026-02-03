import type { DatasetProfile, VizPlan, VizRequest, ViewSpec, Transform } from "../../../shared/viz";

export function generateVizPlan(req: VizRequest): VizPlan {
    const { datasetProfile, question, rowsSample } = req;
    const numRows = datasetProfile.rowCount;

    let score = 0;
    const referencedCols = datasetProfile.columns.filter(c =>
        question.toLowerCase().includes(c.name.toLowerCase())
    );
    const V = referencedCols.length;

    score += numRows > 5000 ? 1.0 : numRows > 500 ? 0.5 : 0;

    const categoricalCols = datasetProfile.columns.filter(c => c.inferredType === "categorical");
    const maxCardinality = Math.max(...categoricalCols.map(c => c.uniqueCount), 0);
    score += maxCardinality > 12 ? 1.0 : maxCardinality > 6 ? 0.5 : 0;

    const hasTime = datasetProfile.datetimeColumns.length > 0;
    const requestedTime = hasTime && (question.includes("time") || question.includes("trend") || question.includes("year"));
    score += (hasTime && requestedTime) ? 0.8 : 0;

    const hasGeo = datasetProfile.geoColumns.length > 0;
    const requestedGeo = hasGeo && (question.includes("map") || question.includes("location") || question.includes("where"));
    score += (hasGeo && requestedGeo) ? 0.8 : 0;

    const maxCorr = datasetProfile.correlations ?
        Math.max(...datasetProfile.correlations.map(c => Math.abs(c.r))) : 0;
    score += maxCorr >= 0.6 ? 1.0 : maxCorr >= 0.35 ? 0.5 : 0;

    const complexity = score >= 4.0 ? "complex" : score >= 2.0 ? "moderate" : "simple";

    const views: ViewSpec[] = [];
    const datasets = [{ name: "main", source: "filtered_rows" as const, transforms: [] as Transform[] }];
    const profile = datasetProfile;

    const primaryNumeric = profile.numericColumns[0];
    if (primaryNumeric) {
        const stats = profile.columns.find(c => c.name === primaryNumeric)?.numeric;
        const isSkewed = stats && Math.abs(stats.skew) > 2;
        const isLogCandidate = isSkewed && stats.min !== undefined && stats.min > 0;

        views.push({
            id: "dist_1",
            kind: "histogram",
            dataset: "main",
            encodings: {
                x: primaryNumeric,
            },
            options: {
                logScale: isLogCandidate,
                facetBy: profile.categoricalColumns.length > 0 ? profile.categoricalColumns[0] : undefined
            },
            annotations: [
                { type: "text", value: stats?.mean, note: "Avg" }
            ]
        });
    }

    if (profile.correlations && profile.correlations.length > 0) {
        const topCorr = profile.correlations.find(c => Math.abs(c.r) >= 0.3);
        if (topCorr) {
            views.push({
                id: "rel_1",
                kind: "scatter",
                dataset: "main",
                encodings: {
                    x: topCorr.a,
                    y: topCorr.b,
                    tooltip: [topCorr.a, topCorr.b, ...profile.categoricalColumns.slice(0, 1)]
                },
                options: {
                    showTrendline: true
                }
            });
        }
    }

    if (profile.datetimeColumns.length > 0 && primaryNumeric) {
        const timeCol = profile.datetimeColumns[0];

        const lowerBound = profile.columns.find(c => c.semanticType === "uncertainty_bound" && c.name.toLowerCase().includes("lower"))?.name;
        const upperBound = profile.columns.find(c => c.semanticType === "uncertainty_bound" && c.name.toLowerCase().includes("upper"))?.name;

        views.push({
            id: "trend_1",
            kind: "line",
            dataset: "main",
            encodings: {
                x: timeCol,
                y: primaryNumeric,
                series: profile.categoricalColumns.length > 0 && profile.categoricalColumns[0] !== "id" ? profile.categoricalColumns[0] : undefined
            },
            options: {
                confidenceBand: lowerBound && upperBound ? { lower: lowerBound, upper: upperBound } : undefined
            }
        });
    }

    views.push({
        id: "detail_1",
        kind: "table",
        dataset: "main",
        encodings: {}
    });

    return {
        title: "Suggested Visualizations",
        rationale: `Selected based on complexity score of ${score.toFixed(1)} (${complexity}) and detected signals.`,
        complexity,
        datasets,
        views: views.slice(0, complexity === "simple" ? 2 : 4),
        interactions: []
    };
}
