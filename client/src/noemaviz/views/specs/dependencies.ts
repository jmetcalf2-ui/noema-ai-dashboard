/**
 * Variable Dependency Graph
 * Shows mutual information between all numeric variable pairs
 */

import { DataFrame } from '../../core/data_engine';
import { IVizSpec, createSpec } from '../../core/grammar';
import { SemanticType } from '../../core/data_engine';
import { mutualInformation } from '../../core/transforms/stats';
import type { DatasetProfile } from './distribution';

export function createVariableDependencyGraph(
    data: DataFrame,
    profile: DatasetProfile
): IVizSpec | null {
    if (profile.numericColumns.length < 2) return null;

    // Compute pairwise mutual information
    const miMatrix: Array<{ var1: string; var2: string; mi: number; id: number }> = [];
    let id = 0;

    for (let i = 0; i < profile.numericColumns.length; i++) {
        for (let j = i + 1; j < profile.numericColumns.length; j++) {
            const col1 = data.getColumn(profile.numericColumns[i]);
            const col2 = data.getColumn(profile.numericColumns[j]);

            if (col1 && col2) {
                const values1 = col1.values.filter(v => typeof v === 'number') as number[];
                const values2 = col2.values.filter(v => typeof v === 'number') as number[];

                const mi = mutualInformation(values1, values2);
                miMatrix.push({
                    var1: profile.numericColumns[i],
                    var2: profile.numericColumns[j],
                    mi,
                    id: id++
                });
            }
        }
    }

    // Sort by MI (strongest dependencies first)
    miMatrix.sort((a, b) => b.mi - a.mi);

    // Create visualization (scatter plot with MI as x, ranked as y)
    const graphData = DataFrame.fromObjects(miMatrix.map((item, idx) => ({
        ...item,
        rank: idx,
        label: `${item.var1} ↔ ${item.var2}`
    })));

    const spec = createSpec(data.id + '_dependencies', 'point');
    spec.layout = {
        title: 'Variable Dependencies (Mutual Information)'
    };

    spec.encodings.x = {
        field: 'mi',
        type: SemanticType.Quantitative,
        channel: 'x'
    };

    spec.encodings.y = {
        field: 'rank',
        type: SemanticType.Quantitative,
        channel: 'y'
    };

    return spec;
}
