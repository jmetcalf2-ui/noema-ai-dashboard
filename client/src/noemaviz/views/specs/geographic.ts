/**
 * Geographic Heatmap View
 * Adaptive bin size density map for lat/lon data
 */

import { DataFrame } from '../../core/data_engine';
import { IVizSpec, createSpec } from '../../core/grammar';
import { SemanticType } from '../../core/data_engine';
import { compute2DDensity } from '../../core/transforms/stats';
import type { DatasetProfile } from './distribution';

export function createGeographicHeatmap(
    data: DataFrame,
    profile: DatasetProfile
): IVizSpec | null {
    if (profile.geoColumns.length < 2) return null;

    const latCol = data.getColumn(profile.geoColumns[0]);
    const lonCol = data.getColumn(profile.geoColumns[1]);

    if (!latCol || !lonCol) return null;

    const latValues = latCol.values.filter(v => typeof v === 'number') as number[];
    const lonValues = lonCol.values.filter(v => typeof v === 'number') as number[];

    const density = compute2DDensity(lonValues, latValues, 30);

    // Flatten grid for visualization
    const heatmapData = [];
    for (let i = 0; i < density.grid.length; i++) {
        for (let j = 0; j < density.grid[i].length; j++) {
            if (density.grid[i][j] > 0) {
                heatmapData.push({
                    lon: density.xBins[j],
                    lat: density.yBins[i],
                    density: density.grid[i][j],
                    id: i * density.grid[i].length + j
                });
            }
        }
    }

    const heatmapDF = DataFrame.fromObjects(heatmapData);

    const spec = createSpec(data.id + '_geo_heatmap', 'point');
    spec.layout = {
        title: 'Geographic Density Heatmap'
    };

    spec.encodings.x = {
        field: 'lon',
        type: SemanticType.Quantitative,
        channel: 'x'
    };

    spec.encodings.y = {
        field: 'lat',
        type: SemanticType.Quantitative,
        channel: 'y'
    };

    spec.encodings.color = {
        field: 'density',
        type: SemanticType.Quantitative,
        channel: 'color'
    };

    return spec;
}
