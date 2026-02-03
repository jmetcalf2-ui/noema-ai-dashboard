/**
 * Cohort Comparison View
 * Compare distributions between selected subset and rest
 */

import { DataFrame } from '../../core/data_engine';
import { IVizSpec, createSpec } from '../../core/grammar';
import { SemanticType } from '../../core/data_engine';
import { computeStats, binData } from '../../core/transforms/stats';
import type { DatasetProfile } from './distribution';

export function createCohortComparisonView(
    data: DataFrame,
    profile: DatasetProfile,
    selectedIds?: Set<number>
): IVizSpec | null {
    if (profile.numericColumns.length === 0) return null;

    const targetColumn = profile.numericColumns[0];
    const column = data.getColumn(targetColumn);
    if (!column) return null;

    const allValues = column.values.filter(v => typeof v === 'number') as number[];

    // If no selection, just show overall distribution
    if (!selectedIds || selectedIds.size === 0) {
        const bins = binData(allValues, 30, 'linear');
        const binDF = DataFrame.fromObjects(bins.map((b, i) => ({
            binCenter: (b.binStart + b.binEnd) / 2,
            count: b.count,
            cohort: 'All',
            id: i
        })));

        const spec = createSpec(data.id + '_cohort', 'rect');
        spec.layout = { title: `Distribution: ${targetColumn}` };
        spec.encodings.x = { field: 'binCenter', type: SemanticType.Quantitative, channel: 'x' };
        spec.encodings.y = { field: 'count', type: SemanticType.Quantitative, channel: 'y' };

        return spec;
    }

    // Split into selected and unselected
    const selectedValues: number[] = [];
    const unselectedValues: number[] = [];

    for (let i = 0; i < allValues.length; i++) {
        if (selectedIds.has(i)) {
            selectedValues.push(allValues[i]);
        } else {
            unselectedValues.push(allValues[i]);
        }
    }

    const selectedStats = computeStats(selectedValues);
    const unselectedStats = computeStats(unselectedValues);

    // Create comparison data
    const comparisonData = [
        { cohort: 'Selected', mean: selectedStats.mean, median: selectedStats.median, count: selectedValues.length, id: 0 },
        { cohort: 'Unselected', mean: unselectedStats.mean, median: unselectedStats.median, count: unselectedValues.length, id: 1 }
    ];

    const comparisonDF = DataFrame.fromObjects(comparisonData);

    const spec = createSpec(data.id + '_cohort_comparison', 'rect');
    spec.layout = {
        title: `Cohort Comparison: ${targetColumn}`
    };

    spec.encodings.x = {
        field: 'cohort',
        type: SemanticType.Nominal,
        channel: 'x'
    };

    spec.encodings.y = {
        field: 'mean',
        type: SemanticType.Quantitative,
        channel: 'y'
    };

    return spec;
}
