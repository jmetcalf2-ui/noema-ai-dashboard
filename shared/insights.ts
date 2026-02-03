import type { DatasetProfile, ColumnProfile } from "./viz";

export type InsightFamily =
  | "distribution"
  | "outlier"
  | "missingness"
  | "correlation"
  | "category_driver"
  | "time_dynamics"
  | "geo_pattern"
  | "segmentation"
  | "data_quality"
  | "uncertainty";

export type ChartKind =
  | "sparkline"
  | "mini_histogram"
  | "box_plot_strip"
  | "ranked_bar"
  | "missingness_strip"
  | "outlier_dot_strip"
  | "uncertainty_band"
  | "residual_strip"
  | "scatter_mini"
  | "correlation_cell"
  | "none";

export interface InsightSpec {
  id: string;
  family: InsightFamily;
  title: string;
  narrative: string;
  whyItMatters: string;
  fieldsUsed: string[];
  importance: "critical" | "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  chartSpec?: {
    kind: ChartKind;
    height?: number;
    data: any[];
    encoding?: {
      x?: string;
      y?: string;
      color?: string;
    };
    annotations?: Array<{ type: "marker" | "range" | "label"; value: any; label?: string }>;
  };
  metadata?: {
    primaryColumn?: string;
    secondaryColumn?: string;
    statistic?: number;
    threshold?: number;
  };
}

export interface InsightCandidate extends InsightSpec {
  score: number;
  rawScore: number;
}

export interface DatasetComplexity {
  level: "simple" | "moderate" | "complex";
  score: number;
  factors: {
    rowCount: number;
    columnCount: number;
    numericColumnCount: number;
    categoricalColumnCount: number;
    maxCardinality: number;
    hasTimeSeries: boolean;
    hasGeo: boolean;
    correlationCount: number;
    missingnessScore: number;
  };
}

export interface InsightBudget {
  min: number;
  max: number;
  target: number;
}

export function computeDatasetComplexity(profile: DatasetProfile): DatasetComplexity {
  const factors = {
    rowCount: profile.rowCount,
    columnCount: profile.columns.length,
    numericColumnCount: profile.numericColumns.length,
    categoricalColumnCount: profile.categoricalColumns.length,
    maxCardinality: Math.max(...profile.columns.map(c => c.uniqueCount), 0),
    hasTimeSeries: profile.datetimeColumns.length > 0,
    hasGeo: profile.geoColumns.length > 0,
    correlationCount: profile.correlations?.length || 0,
    missingnessScore: profile.columns.reduce((sum, c) => sum + c.missingRate, 0) / profile.columns.length,
  };

  let score = 0;
  
  // Row count contribution (0-2)
  if (factors.rowCount > 10000) score += 2;
  else if (factors.rowCount > 1000) score += 1;
  else if (factors.rowCount > 100) score += 0.5;

  // Column count contribution (0-2)
  if (factors.columnCount > 20) score += 2;
  else if (factors.columnCount > 10) score += 1;
  else if (factors.columnCount > 5) score += 0.5;

  // Numeric columns (0-1.5)
  if (factors.numericColumnCount > 10) score += 1.5;
  else if (factors.numericColumnCount > 5) score += 1;
  else if (factors.numericColumnCount > 2) score += 0.5;

  // Categorical cardinality (0-1)
  if (factors.maxCardinality > 50) score += 1;
  else if (factors.maxCardinality > 20) score += 0.5;

  // Time series bonus (0-1)
  if (factors.hasTimeSeries) score += 1;

  // Geo bonus (0-0.5)
  if (factors.hasGeo) score += 0.5;

  // Correlation richness (0-1.5)
  if (factors.correlationCount > 10) score += 1.5;
  else if (factors.correlationCount > 5) score += 1;
  else if (factors.correlationCount > 0) score += 0.5;

  // Missingness complexity (0-0.5)
  if (factors.missingnessScore > 0.1) score += 0.5;

  const level: "simple" | "moderate" | "complex" = 
    score >= 6 ? "complex" : score >= 3 ? "moderate" : "simple";

  return { level, score, factors };
}

export function computeInsightBudget(complexity: DatasetComplexity): InsightBudget {
  switch (complexity.level) {
    case "simple":
      return { min: 5, max: 7, target: 6 };
    case "moderate":
      return { min: 8, max: 12, target: 10 };
    case "complex":
      return { min: 12, max: 20, target: 16 };
  }
}

export function selectDiverseInsights(
  candidates: InsightCandidate[],
  budget: InsightBudget
): InsightSpec[] {
  if (candidates.length === 0) return [];

  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  const selected: InsightSpec[] = [];
  const familyCounts: Record<InsightFamily, number> = {} as any;
  const recentFamilies: InsightFamily[] = [];
  const usedPrimaryColumns = new Set<string>();

  for (const candidate of sorted) {
    if (selected.length >= budget.max) break;

    // Diversity check 1: No two adjacent insights from same family
    if (recentFamilies.length > 0 && recentFamilies[recentFamilies.length - 1] === candidate.family) {
      continue;
    }

    // Diversity check 2: Limit same family occurrences
    const familyCount = familyCounts[candidate.family] || 0;
    const maxPerFamily = Math.ceil(budget.target / 4); // At most 1/4 of budget per family
    if (familyCount >= maxPerFamily) {
      continue;
    }

    // Diversity check 3: Avoid repeating same primary column too often
    const primaryCol = candidate.metadata?.primaryColumn;
    if (primaryCol && usedPrimaryColumns.has(primaryCol) && familyCount > 0) {
      // Allow one insight per column per family, skip if we already have this combo
      const sameColAndFamily = selected.some(
        s => s.metadata?.primaryColumn === primaryCol && s.family === candidate.family
      );
      if (sameColAndFamily) continue;
    }

    // Add insight
    const { score, rawScore, ...spec } = candidate;
    selected.push(spec);
    familyCounts[candidate.family] = familyCount + 1;
    recentFamilies.push(candidate.family);
    if (recentFamilies.length > 3) recentFamilies.shift();
    if (primaryCol) usedPrimaryColumns.add(primaryCol);
  }

  // If we haven't met minimum, add more relaxing diversity rules
  if (selected.length < budget.min) {
    for (const candidate of sorted) {
      if (selected.length >= budget.min) break;
      if (selected.some(s => s.id === candidate.id)) continue;

      const { score, rawScore, ...spec } = candidate;
      selected.push(spec);
    }
  }

  return selected;
}
