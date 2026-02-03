import React, { useMemo } from 'react';
import { NoemaCanvas } from '../render/canvas_view';
import { DataFrame, SemanticColumn, SemanticType } from '../core/data_engine';
import { IVizSpec, createSpec, VizMark } from '../core/grammar';

// This mirrors the ChartConfigProp from ChartRenderer.tsx
export type HostChartConfig = {
    type: "bar" | "line" | "pie" | "area" | "horizontal_bar" | "scatter" | "radar" | "composed";
    title: string;
    dataKey: string;
    categoryKey?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    data: any[];
    [key: string]: any;
};

interface NoemaAdapterProps {
    config: HostChartConfig;
    className?: string;
}

/**
 * Adapter component that translates Host Config -> NOEMAVIZ Spec.
 * acts as a drop-in replacement for internal chart rendering.
 */
export const NoemaAdapter: React.FC<NoemaAdapterProps> = ({ config, className }) => {

    // 1. Translate Data -> DataFrame
    const dataFrame = useMemo(() => {
        return DataFrame.fromObjects(config.data);
    }, [config.data]);

    // 2. Translate Config -> IVizSpec
    const spec = useMemo(() => {
        const markMap: Record<string, VizMark> = {
            'scatter': 'point',
            'line': 'line',
            'bar': 'rect',
            'area': 'area',
            'pie': 'arc'
        };

        const mark = markMap[config.type] || 'point'; // Default to point/scatter
        const vizSpec = createSpec(dataFrame.id, mark);

        vizSpec.layout = { title: config.title };

        // Map Encodings
        const catKey = config.categoryKey || config.xAxisKey || 'name';
        const valKey = config.dataKey;

        if (config.type === 'scatter') {
            const xKey = config.xAxisKey || catKey;
            const yKey = config.yAxisKey || valKey;

            vizSpec.encodings.x = { field: xKey, type: SemanticType.Quantitative, channel: 'x' };
            vizSpec.encodings.y = { field: yKey, type: SemanticType.Quantitative, channel: 'y' };
        } else {
            // Cartesian charts (Bar, Line, Area)
            // Assume Ordinal/Nominal X, Quantitative Y
            vizSpec.encodings.x = { field: catKey, type: SemanticType.Nominal, channel: 'x' };
            vizSpec.encodings.y = { field: valKey, type: SemanticType.Quantitative, channel: 'y' };
        }

        return vizSpec;
    }, [config, dataFrame]);

    return (
        <div className={`w-full h-full ${className}`}>
            <NoemaCanvas spec={spec} data={dataFrame} className="w-full h-full" />
        </div>
    );
};
