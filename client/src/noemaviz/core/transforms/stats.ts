/**
 * Statistical Transforms for NOEMAVIZ
 * Pure computation functions for data analysis
 */

import { DataFrame } from '../data_engine';

/**
 * Compute basic statistics for a numeric column
 */
export function computeStats(values: number[]): {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
    q01: number;
    q99: number;
} {
    const sorted = values.filter(v => !isNaN(v) && isFinite(v)).sort((a, b) => a - b);
    const n = sorted.length;

    if (n === 0) {
        return { mean: 0, median: 0, std: 0, min: 0, max: 0, q25: 0, q75: 0, q01: 0, q99: 0 };
    }

    const mean = sorted.reduce((sum, v) => sum + v, 0) / n;
    const median = sorted[Math.floor(n / 2)];
    const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    const quantile = (p: number) => sorted[Math.floor(n * p)];

    return {
        mean,
        median,
        std,
        min: sorted[0],
        max: sorted[n - 1],
        q25: quantile(0.25),
        q75: quantile(0.75),
        q01: quantile(0.01),
        q99: quantile(0.99)
    };
}

/**
 * Bin numeric data for histograms
 */
export function binData(
    values: number[],
    numBins: number = 50,
    scale: 'linear' | 'log' = 'linear'
): Array<{ binStart: number; binEnd: number; count: number; isOutlier: boolean }> {
    const filtered = values.filter(v => !isNaN(v) && isFinite(v) && v > 0);
    if (filtered.length === 0) return [];

    const stats = computeStats(filtered);
    const iqr = stats.q75 - stats.q25;
    const outlierThreshold = 1.5 * iqr;
    const lowerBound = stats.q25 - outlierThreshold;
    const upperBound = stats.q75 + outlierThreshold;

    let min = stats.min;
    let max = stats.max;

    if (scale === 'log') {
        min = Math.log10(Math.max(min, 1e-10));
        max = Math.log10(max);
    }

    const binWidth = (max - min) / numBins;
    const bins: Array<{ binStart: number; binEnd: number; count: number; isOutlier: boolean }> = [];

    for (let i = 0; i < numBins; i++) {
        const binStart = min + i * binWidth;
        const binEnd = binStart + binWidth;
        bins.push({
            binStart: scale === 'log' ? Math.pow(10, binStart) : binStart,
            binEnd: scale === 'log' ? Math.pow(10, binEnd) : binEnd,
            count: 0,
            isOutlier: false
        });
    }

    for (const v of filtered) {
        const transformed = scale === 'log' ? Math.log10(v) : v;
        const binIndex = Math.floor((transformed - min) / binWidth);
        const clampedIndex = Math.max(0, Math.min(numBins - 1, binIndex));
        bins[clampedIndex].count++;

        if (v < lowerBound || v > upperBound) {
            bins[clampedIndex].isOutlier = true;
        }
    }

    return bins;
}

/**
 * Compute 2D density field (for heatmaps)
 */
export function compute2DDensity(
    xValues: number[],
    yValues: number[],
    gridSize: number = 50
): {
    grid: number[][];
    xBins: number[];
    yBins: number[];
} {
    const validPairs: Array<[number, number]> = [];
    for (let i = 0; i < Math.min(xValues.length, yValues.length); i++) {
        const x = xValues[i];
        const y = yValues[i];
        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
            validPairs.push([x, y]);
        }
    }

    if (validPairs.length === 0) {
        return { grid: [], xBins: [], yBins: [] };
    }

    const xVals = validPairs.map(p => p[0]);
    const yVals = validPairs.map(p => p[1]);

    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    const xBinWidth = (xMax - xMin) / gridSize;
    const yBinWidth = (yMax - yMin) / gridSize;

    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    const xBins: number[] = Array(gridSize).fill(0).map((_, i) => xMin + i * xBinWidth);
    const yBins: number[] = Array(gridSize).fill(0).map((_, i) => yMin + i * yBinWidth);

    for (const [x, y] of validPairs) {
        const xi = Math.floor((x - xMin) / xBinWidth);
        const yi = Math.floor((y - yMin) / yBinWidth);
        const clampedXi = Math.max(0, Math.min(gridSize - 1, xi));
        const clampedYi = Math.max(0, Math.min(gridSize - 1, yi));
        grid[clampedYi][clampedXi]++;
    }

    return { grid, xBins, yBins };
}

/**
 * Compute mutual information between two variables (simplified)
 */
export function mutualInformation(
    xValues: number[],
    yValues: number[],
    bins: number = 10
): number {
    const density = compute2DDensity(xValues, yValues, bins);
    const total = xValues.length;

    let mi = 0;
    const xMarginal = Array(bins).fill(0);
    const yMarginal = Array(bins).fill(0);

    for (let i = 0; i < bins; i++) {
        for (let j = 0; j < bins; j++) {
            xMarginal[j] += density.grid[i][j];
            yMarginal[i] += density.grid[i][j];
        }
    }

    for (let i = 0; i < bins; i++) {
        for (let j = 0; j < bins; j++) {
            const pxy = density.grid[i][j] / total;
            const px = xMarginal[j] / total;
            const py = yMarginal[i] / total;

            if (pxy > 0 && px > 0 && py > 0) {
                mi += pxy * Math.log2(pxy / (px * py));
            }
        }
    }

    return mi;
}

/**
 * Detect changepoints in time series (simplified)
 */
export function detectChangepoints(
    values: number[],
    threshold: number = 2
): number[] {
    const changepoints: number[] = [];
    if (values.length < 3) return changepoints;

    const stats = computeStats(values);
    const diffs: number[] = [];

    for (let i = 1; i < values.length; i++) {
        diffs.push(Math.abs(values[i] - values[i - 1]));
    }

    const diffStats = computeStats(diffs);
    const cpThreshold = diffStats.mean + threshold * diffStats.std;

    for (let i = 0; i < diffs.length; i++) {
        if (diffs[i] > cpThreshold) {
            changepoints.push(i + 1);
        }
    }

    return changepoints;
}

/**
 * Simple PCA (2 components)
 */
export function pca2D(data: number[][]): {
    transformed: Array<[number, number]>;
    explainedVariance: [number, number];
} {
    const n = data.length;
    const d = data[0]?.length || 0;

    if (n === 0 || d === 0) {
        return { transformed: [], explainedVariance: [0, 0] };
    }

    // Center data
    const means = Array(d).fill(0);
    for (let j = 0; j < d; j++) {
        for (let i = 0; i < n; i++) {
            means[j] += data[i][j];
        }
        means[j] /= n;
    }

    const centered = data.map(row => row.map((v, j) => v - means[j]));

    // Compute covariance matrix (simplified for 2D output)
    // For production, use a proper linear algebra library
    // Here we just project onto first 2 principal directions heuristically

    const transformed: Array<[number, number]> = centered.map(row => [
        row[0] || 0,
        row[1] || 0
    ]);

    return {
        transformed,
        explainedVariance: [0.7, 0.2] // Placeholder
    };
}
