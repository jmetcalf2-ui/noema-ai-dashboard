/**
 * Time Anomaly Detection View
 * Shows changepoints and trend in time series data
 */

import { DataFrame } from '../../core/data_engine';
import { IVizSpec, createSpec } from '../../core/grammar';
import { SemanticType } from '../../core/data_engine';
import { detectChangepoints } from '../../core/transforms/stats';
import type { DatasetProfile } from './distribution';

export function createTimeAnomalyView(
    data: DataFrame,
    profile: DatasetProfile
): IVizSpec | null {
    if (profile.datetimeColumns.length === 0 || profile.numericColumns.length === 0) {
        return null;
    }

    const timeCol = data.getColumn(profile.datetimeColumns[0]);
    const valueCol = data.getColumn(profile.numericColumns[0]);

    if (!timeCol || !valueCol) return null;

    const values = valueCol.values.filter(v => typeof v === 'number') as number[];
    const changepoints = detectChangepoints(values, 2);

    // Create time series with changepoint annotations
    const timeSeriesData = [];
    for (let i = 0; i < Math.min(timeCol.values.length, valueCol.values.length); i++) {
        const isChangepoint = changepoints.includes(i);
        timeSeriesData.push({
            time: timeCol.values[i],
            value: valueCol.values[i],
            isAnomaly: isChangepoint ? 1 : 0,
            index: i
        });
    }

    const tsDataFrame = DataFrame.fromObjects(timeSeriesData);

    const spec = createSpec(data.id + '_time_anomaly', 'line');
    spec.layout = {
        title: `Time Series: ${profile.numericColumns[0]} (${changepoints.length} anomalies)`
    };

    spec.encodings.x = {
        field: 'index', // Use index as proxy for time
        type: SemanticType.Quantitative,
        channel: 'x'
    };

    spec.encodings.y = {
        field: 'value',
        type: SemanticType.Quantitative,
        channel: 'y'
    };

    return spec;
}
