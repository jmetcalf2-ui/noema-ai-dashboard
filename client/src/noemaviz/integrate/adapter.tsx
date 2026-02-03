import React, { useMemo } from 'react';
import { NoemaChartCanvas } from './NoemaChartCanvas';
import { DataFrame } from '../core/data_engine';
import { adaptChartConfigToSpec, type HostChartConfig } from './rechartsCompat';

// Re-export HostChartConfig for use in ChartRenderer
export type { HostChartConfig };

interface NoemaAdapterProps {
    config: HostChartConfig;
    className?: string;
}

/**
 * Adapter component that translates Host Config -> NOEMAVIZ Spec.
 * Uses WebGL2 renderer for performance
 */
export const NoemaAdapter: React.FC<NoemaAdapterProps> = ({ config, className }) => {

    // Translate Data -> DataFrame
    const dataFrame = useMemo(() => {
        return DataFrame.fromObjects(config.data);
    }, [config.data]);

    // Translate Config -> IVizSpec
    const spec = useMemo(() => {
        return adaptChartConfigToSpec(config, dataFrame);
    }, [config, dataFrame]);

    return (
        <div className={`w-full h-full ${className}`}>
            <NoemaChartCanvas spec={spec} data={dataFrame} className="w-full h-full" />
        </div>
    );
};
