import React, { useEffect, useRef, useState } from 'react';
import { DataFrame } from '../core/data_engine';
import { IVizSpec } from '../core/grammar';
import { NoemaRenderer } from './renderer';

interface NoemaCanvasProps {
    spec: IVizSpec;
    data: DataFrame;
    className?: string;
}

export const NoemaCanvas: React.FC<NoemaCanvasProps> = ({ spec, data, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<NoemaRenderer | null>(null);

    // 1. Initialize & Cleanup
    useEffect(() => {
        if (!canvasRef.current) return;

        // init
        const renderer = new NoemaRenderer(canvasRef.current);
        renderer.init();
        rendererRef.current = renderer;

        return () => {
            renderer.destroy();
            rendererRef.current = null;
        };
    }, []); // Run once on mount

    // 2. Handle Resize
    useEffect(() => {
        if (!containerRef.current || !rendererRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                // Update renderer size
                rendererRef.current?.resize(entry.contentRect.width, entry.contentRect.height);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // 3. Handle Data/Spec Updates
    useEffect(() => {
        if (rendererRef.current && spec && data) {
            rendererRef.current.update(spec, data);
        }
    }, [spec, data]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full min-h-[300px] bg-white rounded-lg overflow-hidden ${className}`}
        >
            <canvas
                ref={canvasRef}
                className="block touch-none"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};
