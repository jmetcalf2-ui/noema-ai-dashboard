import type { DatasetProfile, ColumnProfile } from "./viz";
import type { InsightCandidate, InsightFamily, ChartKind } from "./insights";

let insightIdCounter = 0;
function nextId(): string {
  return `insight_${++insightIdCounter}`;
}

function resetIdCounter() {
  insightIdCounter = 0;
}

export function generateInsightCandidates(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  resetIdCounter();
  const candidates: InsightCandidate[] = [];

  // Generate candidates from each insight family
  candidates.push(...generateDistributionInsights(profile, data));
  candidates.push(...generateOutlierInsights(profile, data));
  candidates.push(...generateMissingnessInsights(profile, data));
  candidates.push(...generateCorrelationInsights(profile, data));
  candidates.push(...generateCategoryDriverInsights(profile, data));
  candidates.push(...generateTimeDynamicsInsights(profile, data));
  candidates.push(...generateDataQualityInsights(profile, data));
  candidates.push(...generateUncertaintyInsights(profile, data));

  return candidates;
}

function generateDistributionInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  for (const col of profile.columns.filter(c => c.inferredType === "numeric" && c.numeric)) {
    const stats = col.numeric!;
    
    // Skewness insight
    if (Math.abs(stats.skew) > 1.5) {
      const direction = stats.skew > 0 ? "right" : "left";
      insights.push({
        id: nextId(),
        family: "distribution",
        title: `${col.name} has ${direction}-skewed distribution`,
        narrative: `The distribution of ${col.name} is significantly skewed to the ${direction} (skewness: ${stats.skew.toFixed(2)}). The median (${stats.median.toFixed(2)}) is ${stats.skew > 0 ? "lower" : "higher"} than the mean (${stats.mean.toFixed(2)}), indicating ${stats.skew > 0 ? "a long tail of high values" : "a concentration of high values with some low outliers"}.`,
        whyItMatters: stats.skew > 0 
          ? "Right-skewed data often indicates a few extreme high values. Consider log transformation for analysis or focus on median instead of mean."
          : "Left-skewed data suggests most values cluster near the high end with some low outliers pulling the mean down.",
        fieldsUsed: [col.name],
        importance: Math.abs(stats.skew) > 3 ? "high" : "medium",
        confidence: "high",
        chartSpec: {
          kind: "mini_histogram",
          height: 140,
          data: computeHistogramData(data, col.name, 15),
          encoding: { x: "bin", y: "count" },
          annotations: [
            { type: "marker", value: stats.mean, label: "mean" },
            { type: "marker", value: stats.median, label: "median" }
          ]
        },
        metadata: { primaryColumn: col.name, statistic: stats.skew },
        score: 0,
        rawScore: Math.abs(stats.skew) * 2 + (col.missingRate < 0.1 ? 1 : 0)
      });
    }

    // High spread insight
    const cv = stats.std / Math.abs(stats.mean);
    if (cv > 1 && stats.mean !== 0) {
      insights.push({
        id: nextId(),
        family: "distribution",
        title: `${col.name} shows high variability`,
        narrative: `${col.name} has a coefficient of variation of ${(cv * 100).toFixed(0)}%, meaning the standard deviation is ${cv.toFixed(2)}x the mean. Values range from ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)}.`,
        whyItMatters: "High variability suggests diverse subgroups in your data. Consider segmenting the analysis to understand what drives these differences.",
        fieldsUsed: [col.name],
        importance: cv > 2 ? "high" : "medium",
        confidence: "high",
        chartSpec: {
          kind: "box_plot_strip",
          height: 80,
          data: data.map(r => ({ value: r[col.name] })).filter(d => d.value != null),
          annotations: [
            { type: "range", value: [stats.p25, stats.p75], label: "IQR" }
          ]
        },
        metadata: { primaryColumn: col.name, statistic: cv },
        score: 0,
        rawScore: cv * 1.5
      });
    }

    // Zero-heavy distribution
    if (stats.zeros && stats.zeros / profile.rowCount > 0.3) {
      const zeroRate = stats.zeros / profile.rowCount;
      insights.push({
        id: nextId(),
        family: "distribution",
        title: `${col.name} is zero-heavy (${(zeroRate * 100).toFixed(0)}% zeros)`,
        narrative: `${stats.zeros} out of ${profile.rowCount} values in ${col.name} are exactly zero (${(zeroRate * 100).toFixed(1)}%). This may indicate inactive records, missing data coded as zero, or a genuine boundary effect.`,
        whyItMatters: "Zero-inflated distributions require special statistical treatment. Consider whether zeros represent true absence or missing data.",
        fieldsUsed: [col.name],
        importance: zeroRate > 0.5 ? "high" : "medium",
        confidence: "high",
        chartSpec: {
          kind: "mini_histogram",
          height: 120,
          data: computeHistogramData(data, col.name, 10),
          annotations: [{ type: "marker", value: 0, label: "zero" }]
        },
        metadata: { primaryColumn: col.name, statistic: zeroRate },
        score: 0,
        rawScore: zeroRate * 3
      });
    }
  }

  return insights;
}

function generateOutlierInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  for (const col of profile.columns.filter(c => c.outlierCount && c.outlierCount > 0)) {
    const outlierRate = col.outlierCount! / profile.rowCount;
    const stats = col.numeric!;
    
    if (outlierRate > 0.01) { // More than 1% outliers is noteworthy
      const iqr = stats.p75 - stats.p25;
      const lowerBound = stats.p25 - 1.5 * iqr;
      const upperBound = stats.p75 + 1.5 * iqr;

      // Find actual outlier values
      const outlierValues = data
        .map(r => r[col.name])
        .filter(v => v != null && (v < lowerBound || v > upperBound))
        .slice(0, 10);

      insights.push({
        id: nextId(),
        family: "outlier",
        title: `${col.outlierCount} outliers detected in ${col.name}`,
        narrative: `${col.name} contains ${col.outlierCount} values (${(outlierRate * 100).toFixed(1)}%) outside the expected range [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]. Outlier examples: ${outlierValues.slice(0, 5).join(", ")}.`,
        whyItMatters: "Outliers can significantly skew averages and trends. Investigate whether they represent data errors, exceptional cases worth separate analysis, or legitimate extreme values.",
        fieldsUsed: [col.name],
        importance: outlierRate > 0.05 ? "high" : outlierRate > 0.02 ? "medium" : "low",
        confidence: "high",
        chartSpec: {
          kind: "outlier_dot_strip",
          height: 100,
          data: data.map(r => ({ value: r[col.name], isOutlier: r[col.name] < lowerBound || r[col.name] > upperBound })).filter(d => d.value != null),
          annotations: [
            { type: "range", value: [lowerBound, upperBound], label: "normal range" }
          ]
        },
        metadata: { primaryColumn: col.name, statistic: outlierRate },
        score: 0,
        rawScore: outlierRate * 20 + (col.outlierCount! > 10 ? 2 : 0)
      });
    }
  }

  return insights;
}

function generateMissingnessInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  // High missingness columns
  const highMissing = profile.columns.filter(c => c.missingRate > 0.1);
  
  if (highMissing.length > 0) {
    // Overall missingness pattern
    insights.push({
      id: nextId(),
      family: "missingness",
      title: `${highMissing.length} columns have significant missing data`,
      narrative: `The following columns have >10% missing values: ${highMissing.map(c => `${c.name} (${(c.missingRate * 100).toFixed(0)}%)`).join(", ")}.`,
      whyItMatters: "Missing data can bias analysis results. Consider whether missingness is random or systematic—the latter requires careful treatment.",
      fieldsUsed: highMissing.map(c => c.name),
      importance: highMissing.some(c => c.missingRate > 0.5) ? "high" : "medium",
      confidence: "high",
      chartSpec: {
        kind: "missingness_strip",
        height: 80,
        data: highMissing.map(c => ({ column: c.name, missingRate: c.missingRate }))
      },
      metadata: {},
      score: 0,
      rawScore: highMissing.length * 1.5 + Math.max(...highMissing.map(c => c.missingRate)) * 5
    });
  }

  // Individual severe missingness
  for (const col of profile.columns.filter(c => c.missingRate > 0.3)) {
    insights.push({
      id: nextId(),
      family: "missingness",
      title: `${col.name} is ${(col.missingRate * 100).toFixed(0)}% missing`,
      narrative: `The ${col.name} column has ${(col.missingRate * 100).toFixed(0)}% missing values (${Math.round(col.missingRate * profile.rowCount)} of ${profile.rowCount} rows). This significantly limits its usefulness for analysis.`,
      whyItMatters: col.missingRate > 0.7 
        ? "With over 70% missing, this column may not be reliable for analysis. Consider excluding or investigating why data is absent."
        : "High missingness requires imputation or exclusion strategies before analysis.",
      fieldsUsed: [col.name],
      importance: col.missingRate > 0.5 ? "high" : "medium",
      confidence: "high",
      chartSpec: { kind: "none", data: [] },
      metadata: { primaryColumn: col.name, statistic: col.missingRate },
      score: 0,
      rawScore: col.missingRate * 4
    });
  }

  return insights;
}

function generateCorrelationInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  if (!profile.correlations || profile.correlations.length === 0) return insights;

  // Strong correlations
  const strongCorr = profile.correlations.filter(c => Math.abs(c.r) >= 0.7);
  const moderateCorr = profile.correlations.filter(c => Math.abs(c.r) >= 0.5 && Math.abs(c.r) < 0.7);

  for (const corr of strongCorr) {
    const direction = corr.r > 0 ? "positive" : "negative";
    insights.push({
      id: nextId(),
      family: "correlation",
      title: `Strong ${direction} correlation: ${corr.a} ↔ ${corr.b}`,
      narrative: `${corr.a} and ${corr.b} show a strong ${direction} correlation (r = ${corr.r.toFixed(3)}). This means ${corr.r > 0 ? "as one increases, the other tends to increase" : "as one increases, the other tends to decrease"}.`,
      whyItMatters: "Strong correlations may indicate a causal relationship, a common underlying factor, or potential multicollinearity in models. Investigate the business logic connecting these variables.",
      fieldsUsed: [corr.a, corr.b],
      importance: Math.abs(corr.r) > 0.85 ? "critical" : "high",
      confidence: "high",
      chartSpec: {
        kind: "scatter_mini",
        height: 160,
        data: data.slice(0, 200).map(r => ({ x: r[corr.a], y: r[corr.b] })).filter(d => d.x != null && d.y != null),
        encoding: { x: corr.a, y: corr.b }
      },
      metadata: { primaryColumn: corr.a, secondaryColumn: corr.b, statistic: corr.r },
      score: 0,
      rawScore: Math.abs(corr.r) * 5
    });
  }

  for (const corr of moderateCorr.slice(0, 3)) {
    const direction = corr.r > 0 ? "positive" : "negative";
    insights.push({
      id: nextId(),
      family: "correlation",
      title: `Moderate ${direction} relationship: ${corr.a} & ${corr.b}`,
      narrative: `${corr.a} and ${corr.b} have a moderate ${direction} correlation (r = ${corr.r.toFixed(3)}). The relationship is noticeable but not deterministic.`,
      whyItMatters: "Moderate correlations are worth investigating but may have confounding factors or nonlinear components not captured by linear correlation.",
      fieldsUsed: [corr.a, corr.b],
      importance: "medium",
      confidence: "high",
      chartSpec: {
        kind: "correlation_cell",
        height: 60,
        data: [{ a: corr.a, b: corr.b, r: corr.r }]
      },
      metadata: { primaryColumn: corr.a, secondaryColumn: corr.b, statistic: corr.r },
      score: 0,
      rawScore: Math.abs(corr.r) * 3
    });
  }

  return insights;
}

function generateCategoryDriverInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  if (profile.categoricalColumns.length === 0 || profile.numericColumns.length === 0) return insights;

  for (const catCol of profile.categoricalColumns.slice(0, 3)) {
    const catProfile = profile.columns.find(c => c.name === catCol);
    if (!catProfile || catProfile.uniqueCount > 20) continue; // Skip high cardinality

    for (const numCol of profile.numericColumns.slice(0, 2)) {
      // Compute group statistics
      const groups: Record<string, number[]> = {};
      for (const row of data) {
        const cat = String(row[catCol] ?? "");
        const val = row[numCol];
        if (cat && val != null && !isNaN(val)) {
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(val);
        }
      }

      const groupStats = Object.entries(groups)
        .map(([category, values]) => ({
          category,
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length
        }))
        .filter(g => g.count >= 5) // Minimum sample size
        .sort((a, b) => b.mean - a.mean);

      if (groupStats.length >= 2) {
        const top = groupStats[0];
        const bottom = groupStats[groupStats.length - 1];
        const ratio = top.mean / (bottom.mean || 1);

        if (ratio > 1.5 || ratio < 0.67) {
          insights.push({
            id: nextId(),
            family: "category_driver",
            title: `${catCol} drives variation in ${numCol}`,
            narrative: `Different ${catCol} categories show significantly different ${numCol} values. "${top.category}" averages ${top.mean.toFixed(2)} (n=${top.count}), while "${bottom.category}" averages ${bottom.mean.toFixed(2)} (n=${bottom.count})—a ${((ratio - 1) * 100).toFixed(0)}% difference.`,
            whyItMatters: "Category-based differences suggest segmentation opportunities or factors that influence outcomes. Use this for targeted strategies.",
            fieldsUsed: [catCol, numCol],
            importance: ratio > 2 ? "high" : "medium",
            confidence: groupStats[0].count > 30 ? "high" : "medium",
            chartSpec: {
              kind: "ranked_bar",
              height: 140,
              data: groupStats.slice(0, 10).map(g => ({ category: g.category, value: g.mean })),
              encoding: { x: "category", y: "value" }
            },
            metadata: { primaryColumn: catCol, secondaryColumn: numCol, statistic: ratio },
            score: 0,
            rawScore: Math.log(ratio) * 3 + (groupStats[0].count > 50 ? 1 : 0)
          });
        }
      }
    }
  }

  return insights;
}

function generateTimeDynamicsInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  if (profile.datetimeColumns.length === 0 || profile.numericColumns.length === 0) return insights;

  const timeCol = profile.datetimeColumns[0];
  
  for (const numCol of profile.numericColumns.slice(0, 2)) {
    // Sort by time
    const timeData = data
      .filter(r => r[timeCol] && r[numCol] != null)
      .map(r => ({ date: new Date(r[timeCol]), value: r[numCol] }))
      .filter(d => !isNaN(d.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (timeData.length < 10) continue;

    // Compute trend
    const n = timeData.length;
    const firstHalf = timeData.slice(0, Math.floor(n / 2));
    const secondHalf = timeData.slice(Math.floor(n / 2));
    
    const firstMean = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length;
    const change = (secondMean - firstMean) / (firstMean || 1);

    if (Math.abs(change) > 0.1) {
      const direction = change > 0 ? "increasing" : "decreasing";
      insights.push({
        id: nextId(),
        family: "time_dynamics",
        title: `${numCol} is ${direction} over time`,
        narrative: `${numCol} shows a ${direction} trend: the average in the second half of the period (${secondMean.toFixed(2)}) is ${Math.abs(change * 100).toFixed(0)}% ${change > 0 ? "higher" : "lower"} than the first half (${firstMean.toFixed(2)}).`,
        whyItMatters: change > 0 
          ? "An increasing trend may indicate growth, inflation, or improving conditions. Understand what's driving this change."
          : "A decreasing trend may signal decline or efficiency gains. Investigate the cause.",
        fieldsUsed: [timeCol, numCol],
        importance: Math.abs(change) > 0.3 ? "high" : "medium",
        confidence: n > 50 ? "high" : "medium",
        chartSpec: {
          kind: "sparkline",
          height: 80,
          data: timeData.map(d => ({ date: d.date.toISOString(), value: d.value }))
        },
        metadata: { primaryColumn: numCol, statistic: change },
        score: 0,
        rawScore: Math.abs(change) * 4 + (n > 100 ? 1 : 0)
      });
    }

    // Volatility check
    const values = timeData.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);
    const cv = std / Math.abs(mean);

    if (cv > 0.5) {
      insights.push({
        id: nextId(),
        family: "time_dynamics",
        title: `${numCol} shows high volatility over time`,
        narrative: `${numCol} fluctuates significantly over time with a coefficient of variation of ${(cv * 100).toFixed(0)}%. This indicates inconsistent behavior or periodic spikes/drops.`,
        whyItMatters: "High volatility makes forecasting difficult and may indicate seasonal effects, external shocks, or data quality issues at certain times.",
        fieldsUsed: [timeCol, numCol],
        importance: cv > 1 ? "high" : "medium",
        confidence: "high",
        chartSpec: {
          kind: "sparkline",
          height: 80,
          data: timeData.map(d => ({ date: d.date.toISOString(), value: d.value })),
          annotations: [{ type: "range", value: [mean - std, mean + std], label: "±1σ" }]
        },
        metadata: { primaryColumn: numCol, statistic: cv },
        score: 0,
        rawScore: cv * 2
      });
    }
  }

  return insights;
}

function generateDataQualityInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  // Check for constant columns
  const constantCols = profile.columns.filter(c => c.uniqueCount === 1);
  if (constantCols.length > 0) {
    insights.push({
      id: nextId(),
      family: "data_quality",
      title: `${constantCols.length} column(s) have constant values`,
      narrative: `The following columns contain only a single unique value: ${constantCols.map(c => c.name).join(", ")}. These provide no analytical value.`,
      whyItMatters: "Constant columns add noise to the dataset and should be removed before modeling or analysis.",
      fieldsUsed: constantCols.map(c => c.name),
      importance: constantCols.length > 2 ? "medium" : "low",
      confidence: "high",
      chartSpec: { kind: "none", data: [] },
      metadata: {},
      score: 0,
      rawScore: constantCols.length
    });
  }

  // Check for near-ID columns (unique per row but not marked as ID)
  const nearIdCols = profile.columns.filter(
    c => c.uniqueCount === profile.rowCount && c.inferredType !== "id"
  );
  if (nearIdCols.length > 0) {
    insights.push({
      id: nextId(),
      family: "data_quality",
      title: `${nearIdCols.length} column(s) may be identifiers`,
      narrative: `These columns have unique values for every row: ${nearIdCols.map(c => c.name).join(", ")}. They likely represent identifiers or keys.`,
      whyItMatters: "Identifier columns shouldn't be used in aggregations or modeling. Confirm their role and exclude from quantitative analysis.",
      fieldsUsed: nearIdCols.map(c => c.name),
      importance: "low",
      confidence: "medium",
      chartSpec: { kind: "none", data: [] },
      metadata: {},
      score: 0,
      rawScore: nearIdCols.length * 0.5
    });
  }

  // Duplicate row detection
  const rowStrings = data.map(r => JSON.stringify(r));
  const uniqueRows = new Set(rowStrings).size;
  const duplicateCount = data.length - uniqueRows;
  if (duplicateCount > 0 && duplicateCount / data.length > 0.01) {
    insights.push({
      id: nextId(),
      family: "data_quality",
      title: `${duplicateCount} duplicate rows detected`,
      narrative: `The dataset contains ${duplicateCount} exact duplicate rows (${(duplicateCount / data.length * 100).toFixed(1)}% of data). This may indicate data loading issues or intentional duplication.`,
      whyItMatters: "Duplicate rows can skew counts, sums, and averages. Verify whether duplicates are intentional before analysis.",
      fieldsUsed: [],
      importance: duplicateCount / data.length > 0.1 ? "high" : "medium",
      confidence: "high",
      chartSpec: { kind: "none", data: [] },
      metadata: { statistic: duplicateCount },
      score: 0,
      rawScore: (duplicateCount / data.length) * 10
    });
  }

  return insights;
}

function generateUncertaintyInsights(profile: DatasetProfile, data: Record<string, any>[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  // Find columns that look like uncertainty bounds
  const boundCols = profile.columns.filter(c => c.semanticType === "uncertainty_bound");
  
  if (boundCols.length >= 2) {
    // Try to find matching pairs (e.g., price_lower, price_upper)
    const pairs: Array<{ base: string; lower: string; upper: string }> = [];
    
    for (const col of boundCols) {
      const lower = col.name.toLowerCase();
      if (lower.includes("lower") || lower.includes("_lo") || lower.includes("_min") || lower.includes("p10")) {
        const base = col.name.replace(/_?(lower|lo|min|p10)$/i, "");
        const upperMatch = boundCols.find(c => 
          c.name.toLowerCase().includes("upper") || 
          c.name.toLowerCase().includes("_hi") || 
          c.name.toLowerCase().includes("_max") ||
          c.name.toLowerCase().includes("p90")
        );
        if (upperMatch) {
          pairs.push({ base, lower: col.name, upper: upperMatch.name });
        }
      }
    }

    for (const pair of pairs.slice(0, 2)) {
      // Compute average uncertainty band width
      const widths = data
        .filter(r => r[pair.upper] != null && r[pair.lower] != null)
        .map(r => r[pair.upper] - r[pair.lower]);
      
      if (widths.length > 0) {
        const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
        const values = data.filter(r => r[pair.lower] != null).map(r => (r[pair.upper] + r[pair.lower]) / 2);
        const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
        const relativeUncertainty = avgWidth / Math.abs(avgValue);

        insights.push({
          id: nextId(),
          family: "uncertainty",
          title: `Uncertainty analysis: ${pair.base || "metric"}`,
          narrative: `The confidence interval for ${pair.base || "the metric"} has an average width of ${avgWidth.toFixed(2)} (${(relativeUncertainty * 100).toFixed(0)}% relative uncertainty). ${relativeUncertainty > 0.5 ? "This high uncertainty suggests predictions are tentative." : "Uncertainty is relatively contained."}`,
          whyItMatters: "Understanding prediction uncertainty helps set appropriate confidence levels in decision-making.",
          fieldsUsed: [pair.lower, pair.upper],
          importance: relativeUncertainty > 0.5 ? "high" : "medium",
          confidence: "high",
          chartSpec: {
            kind: "uncertainty_band",
            height: 140,
            data: data.slice(0, 100).map((r, i) => ({
              index: i,
              lower: r[pair.lower],
              upper: r[pair.upper],
              mid: (r[pair.lower] + r[pair.upper]) / 2
            })).filter(d => d.lower != null && d.upper != null)
          },
          metadata: { primaryColumn: pair.lower, secondaryColumn: pair.upper, statistic: relativeUncertainty },
          score: 0,
          rawScore: relativeUncertainty * 3 + 2
        });
      }
    }
  }

  return insights;
}

// Helper: compute histogram bins
function computeHistogramData(data: Record<string, any>[], column: string, bins: number): Array<{ bin: string; count: number; binStart: number; binEnd: number }> {
  const values = data.map(r => r[column]).filter(v => v != null && !isNaN(v)) as number[];
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / bins || 1;

  const counts: number[] = new Array(bins).fill(0);
  for (const v of values) {
    const binIdx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[binIdx]++;
  }

  return counts.map((count, i) => ({
    bin: `${(min + i * binWidth).toFixed(1)}`,
    binStart: min + i * binWidth,
    binEnd: min + (i + 1) * binWidth,
    count
  }));
}
