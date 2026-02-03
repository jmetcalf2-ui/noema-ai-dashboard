/**
 * View Factory
 * Automatically generates appropriate views based on data profile
 */

import { DataFrame } from '../core/data_engine';
import { IVizSpec } from '../core/grammar';
import { createDistributionView, type DatasetProfile } from './specs/distribution';
import { createVariableDependencyGraph } from './specs/dependencies';
import { createTimeAnomalyView } from './specs/timeAnomaly';
import { createGeographicHeatmap } from './specs/geographic';
import { createEmbeddingView } from './specs/embedding';
import { createCohortComparisonView } from './specs/cohort';

/**
 * Profile dataset to determine what types of columns exist
 */
export function profileDataset(data: DataFrame): DatasetProfile {
    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    const datetimeColumns: string[] = [];
    const geoColumns: string[] = [];

    for (const column of data.columns) {
        const values = column.values;
        const sampleValue = values.find(v => v != null);

        if (typeof sampleValue === 'number') {
            numericColumns.push(column.name);

            // Check if geo-like (lat/lon heuristic)
            if (column.name.toLowerCase().includes('lat') ||
                column.name.toLowerCase().includes('lon') ||
                column.name.toLowerCase().includes('latitude') ||
                column.name.toLowerCase().includes('longitude')) {
                geoColumns.push(column.name);
            }
        } else if (sampleValue instanceof Date ||
            (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue)))) {
            datetimeColumns.push(column.name);
        } else {
            categoricalColumns.push(column.name);
        }
    }

    return {
        numericColumns,
        categoricalColumns,
        datetimeColumns,
        geoColumns
    };
}

/**
 * Generate all appropriate views for a dataset
 */
export function generateViews(data: DataFrame): IVizSpec[] {
    const views: IVizSpec[] = [];
    const profile = profileDataset(data);

    console.log('Dataset Profile:', profile);

    // 1. Distribution View (if numeric columns exist)
    const distView = createDistributionView(data, profile);
    if (distView) views.push(distView);

    // 2. Variable Dependency Graph (if 2+ numeric columns)
    const depView = createVariableDependencyGraph(data, profile);
    if (depView) views.push(depView);

    // 3. Time Anomaly View (if datetime + numeric columns)
    const timeView = createTimeAnomalyView(data, profile);
    if (timeView) views.push(timeView);

    // 4. Geographic Heatmap (if lat/lon columns)
    const geoView = createGeographicHeatmap(data, profile);
    if (geoView) views.push(geoView);

    // 5. PCA Embedding (if 2+ numeric columns)
    const embeddingView = createEmbeddingView(data, profile);
    if (embeddingView) views.push(embeddingView);

    // 6. Cohort Comparison (if numeric columns, no default selection)
    const cohortView = createCohortComparisonView(data, profile);
    if (cohortView) views.push(cohortView);

    console.log(`Generated ${views.length} advanced views`);

    return views;
}

/**
 * Export for use in other components
 */
export { type DatasetProfile };
