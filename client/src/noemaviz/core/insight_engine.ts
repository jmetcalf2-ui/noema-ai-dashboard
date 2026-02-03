import { DataFrame, SemanticType } from "./data_engine";
import { IVizSpec, createSpec } from "./grammar";

// ============================================================================
// 1. INSIGHT DEFINITIONS
// ============================================================================

export type InsightType = "correlation" | "outlier" | "trend" | "distribution" | "summary";

export interface IInsight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    score: number; // Importance score (0-1)
    confidence: number; // Statistical confidence (0-1)

    // The evidence that backs this insight
    evidence: {
        stat: string;
        value: number;
        p_value?: number;
    };

    // The recommended visualization to see this insight
    spec: IVizSpec;
}

// ============================================================================
// 2. STATISTICAL HELPERS
// ============================================================================

function mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length) return 0;
    const n = x.length;
    if (n === 0) return 0;

    const mx = mean(x);
    const my = mean(y);

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
        const dx = x[i] - mx;
        const dy = y[i] - my;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
    }

    if (denX === 0 || denY === 0) return 0;
    return num / Math.sqrt(denX * denY);
}

// ============================================================================
// 3. INSIGHT MINER
// ============================================================================

export class InsightMiner {
    /**
     * Scans a DataFrame for interesting patterns.
     * Currently implements: Pairwise Correlation Scanning
     */
    public static mine(df: DataFrame): IInsight[] {
        const insights: IInsight[] = [];

        // Get all quantitative columns
        const quantCols = df.getColumnNames().filter(name =>
            df.getColumn(name)?.type === SemanticType.Quantitative
        );

        // 1. Correlation Scan
        for (let i = 0; i < quantCols.length; i++) {
            for (let j = i + 1; j < quantCols.length; j++) {
                const colA = quantCols[i];
                const colB = quantCols[j];

                const valsA = df.getColumn(colA)?.values as number[];
                const valsB = df.getColumn(colB)?.values as number[];

                // Filter to valid pairs
                const pairs: [number, number][] = [];
                for (let k = 0; k < valsA.length; k++) {
                    if (typeof valsA[k] === 'number' && typeof valsB[k] === 'number') {
                        pairs.push([valsA[k], valsB[k]]);
                    }
                }

                if (pairs.length < 5) continue; // Not enough data

                const r = pearsonCorrelation(pairs.map(p => p[0]), pairs.map(p => p[1]));
                const rAbs = Math.abs(r);

                // If correlation is significant
                if (rAbs > 0.7) {
                    const spec = createSpec(df.id, "point");
                    spec.encodings.x = { field: colA, type: SemanticType.Quantitative, channel: "x" };
                    spec.encodings.y = { field: colB, type: SemanticType.Quantitative, channel: "y" };
                    spec.description = `Scatter plot showing strong relationship between ${colA} and ${colB}`;
                    spec.layout = { title: `${colA} vs ${colB}` };

                    insights.push({
                        id: crypto.randomUUID(),
                        type: "correlation",
                        title: `Strong Correlation: ${colA} & ${colB}`,
                        description: `There is a strict linear relationship (r=${r.toFixed(2)}) between ${colA} and ${colB}.`,
                        score: rAbs, // Simple scoring measure
                        confidence: pairs.length > 30 ? 0.9 : 0.5, // Naive confidence
                        evidence: { stat: "Pearson r", value: r },
                        spec
                    });
                }
            }
        }

        return insights.sort((a, b) => b.score - a.score);
    }
}
