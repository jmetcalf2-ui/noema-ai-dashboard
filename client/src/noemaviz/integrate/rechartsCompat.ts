/**
 * Recharts Compatibility Layer
 * Translates host ChartConfig to NOEMAVIZ ViewSpec
 */

import { DataFrame } from '../core/data_engine';
import { IVizSpec, createSpec, VizMark } from '../core/grammar';
import { SemanticType } from '../core/data_engine';

export interface HostChartConfig {
    type: "bar" | "line" | "pie" | "area" | "horizontal_bar" | "scatter" | "radar" | "composed";
    title: string;
    dataKey: string;
    categoryKey?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    data: any[];
    [key: string]: any;
}

/**
 * Convert host ChartConfig to NOEMAVIZ ViewSpec
 */
export function adaptChartConfigToSpec(config: HostChartConfig, dataFrame: DataFrame): IVizSpec {
    const markMap: Record<string, VizMark> = {
        'scatter': 'point',
        'line': 'line',
        'bar': 'rect',
        'area': 'area',
        'pie': 'arc'
    };

    const mark = markMap[config.type] || 'point';
    const vizSpec = createSpec(dataFrame.id, mark);

    vizSpec.layout = { title: config.title };

    // Map encodings
    const catKey = config.categoryKey || config.xAxisKey || 'name';
    const valKey = config.dataKey;

    if (config.type === 'scatter') {
        const xKey = config.xAxisKey || catKey;
        const yKey = config.yAxisKey || valKey;

        vizSpec.encodings.x = { field: xKey, type: SemanticType.Quantitative, channel: 'x' };
        vizSpec.encodings.y = { field: yKey, type: SemanticType.Quantitative, channel: 'y' };
    } else {
        // Cartesian charts (Bar, Line, Area)
        vizSpec.encodings.x = { field: catKey, type: SemanticType.Nominal, channel: 'x' };
        vizSpec.encodings.y = { field: valKey, type: SemanticType.Quantitative, channel: 'y' };
    }

    return vizSpec;
}

/**
 * Build Recharts-compatible tooltip payload for existing components
 */
export function createTooltipPayload(hoveredPoint: { x: number; y: number; id: number }, data: DataFrame): any {
    // This allows existing ChartTooltipContent to work unchanged
    return {
        active: true,
        payload: [
            {
                name: 'Value',
                value: hoveredPoint.y,
                dataKey: 'value'
            }
        ],
        label: `Point ${hoveredPoint.id}`
    };
}
