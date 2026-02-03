/**
 * Distribution View with Outlier Detection
 * Log-scaled histogram with quantile annotations
 */

import { DataFrame } from '../../core/data_engine';
import { IVizSpec, createSpec } from '../../core/grammar';
import { SemanticType } from '../../core/data_engine';
import { binData, computeStats } from '../../core/transforms/stats';

export interface DatasetProfile {
    numericColumns: string[];
    categoricalColumns: string[];
    datetimeColumns: string[];
    geoColumns: string[];
}

export function createDistributionView(
    data: DataFrame,
    profile: DatasetProfile
): IVizSpec | null {
    if (profile.numericColumns.length === 0) return null;

    // Use first numeric column
    const targetColumn = profile.numericColumns[0];
    const column = data.getColumn(targetColumn);
    if (!column) return null;

    const values = column.values.filter(v => typeof v === 'number') as number[];
    const stats = computeStats(values);
    const bins = binData(values, 50, 'log');

    // Create transformed data for visualization
    const binData_df = DataFrame.fromObjects(bins.map((b, i) => ({
        binStart: b.binStart,
        binEnd: b.binEnd,
        count: b.count,
        isOutlier: b.isOutlier ? 1 : 0,
        binCenter: (b.binStart + b.binEnd) / 2,
        id: i
    })));

    const spec = createSpec(data.id + '_distribution', 'rect');
    spec.layout = {
        title: `Distribution: ${targetColumn} (log scale)`
    };

    spec.encodings.x = {
        field: 'binCenter',
        type: SemanticType.Quantitative,
        channel: 'x'
    };

    spec.encodings.y = {
        field: 'count',
        type: SemanticType.Quantitative,
        channel: 'y'
    };

    spec.encodings.color = {
        field: 'isOutlier',
        type: SemanticType.Nominal,
        channel: 'color'
    };

    return spec;
}
