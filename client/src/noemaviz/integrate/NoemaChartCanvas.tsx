/**
 * NoemaChartCanvas - WebGL2-powered chart component
 * Drop-in replacement for Recharts that mounts inside existing ChartContainer
 */

import React, { useRef, useEffect } from 'react';
import { useNoemaRenderer } from './useNoemaRenderer';
import { DataFrame } from '../core/data_engine';
import { IVizSpec } from '../core/grammar';

export interface NoemaChartCanvasProps {
    spec: IVizSpec;
    data: DataFrame;
    theme?: Record<string, string>;
    className?: string;
}

export const NoemaChartCanvas: React.FC<NoemaChartCanvasProps> = ({
    spec,
    data,
    theme = {},
    className
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const renderer = useNoemaRenderer(canvasRef, theme);

    // Update rendering when spec or data changes
    useEffect(() => {
        if (renderer && spec && data) {
            renderer.update(spec, data);
        }
    }, [renderer, spec, data]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative ${className || ''}`}
            style={{ minHeight: '300px' }}
        >
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
                style={{ touchAction: 'none' }}
            />
        </div>
    );
};
