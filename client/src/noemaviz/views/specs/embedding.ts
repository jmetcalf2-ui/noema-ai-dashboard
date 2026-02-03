/**
 * PCA Embedding View
 * 2D projection of high-dimensional data
 */

import { DataFrame } from '../../core/data_engine';
import { IVizSpec, createSpec } from '../../core/grammar';
import { SemanticType } from '../../core/data_engine';
import { pca2D } from '../../core/transforms/stats';
import type { DatasetProfile } from './distribution';

export function createEmbeddingView(
    data: DataFrame,
    profile: DatasetProfile
): IVizSpec | null {
    if (profile.numericColumns.length < 2) return null;

    // Extract numeric columns as matrix
    const matrix: number[][] = [];
    const numRows = data.getColumn(profile.numericColumns[0])?.values.length || 0;

    for (let i = 0; i < numRows; i++) {
        const row: number[] = [];
        for (const colName of profile.numericColumns) {
            const col = data.getColumn(colName);
            const value = col?.values[i];
            row.push(typeof value === 'number' ? value : 0);
        }
        matrix.push(row);
    }

    const pca = pca2D(matrix);

    // Create embedding dataframe
    const embeddingData = pca.transformed.map((point, idx) => ({
        pc1: point[0],
        pc2: point[1],
        id: idx
    }));

    const embeddingDF = DataFrame.fromObjects(embeddingData);

    const spec = createSpec(data.id + '_pca_embedding', 'point');
    spec.layout = {
        title: `PCA Embedding (${profile.numericColumns.length} dimensions → 2D)`
    };

    spec.encodings.x = {
        field: 'pc1',
        type: SemanticType.Quantitative,
        channel: 'x'
    };

    spec.encodings.y = {
        field: 'pc2',
        type: SemanticType.Quantitative,
        channel: 'y'
    };

    return spec;
}
