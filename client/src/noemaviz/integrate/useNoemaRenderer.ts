/**
 * React hook for NOEMA WebGL2 Renderer lifecycle management
 */

import { RefObject, useEffect, useState } from 'react';
import { NoemaWebGLRenderer } from '../render/webgl_renderer';

export function useNoemaRenderer(
    canvasRef: RefObject<HTMLCanvasElement>,
    theme: Record<string, string> = {}
) {
    const [renderer, setRenderer] = useState<NoemaWebGLRenderer | null>(null);

    // Initialize renderer
    useEffect(() => {
        if (!canvasRef.current) return;

        const r = new NoemaWebGLRenderer(canvasRef.current);
        r.init();
        setRenderer(r);

        return () => {
            r.destroy();
        };
    }, [canvasRef]);

    // Handle resize
    useEffect(() => {
        if (!canvasRef.current || !renderer) return;

        const canvas = canvasRef.current;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                renderer.resize(width, height);
            }
        });

        resizeObserver.observe(canvas);

        // Initial size
        renderer.resize(canvas.clientWidth, canvas.clientHeight);

        return () => {
            resizeObserver.disconnect();
        };
    }, [renderer, canvasRef]);

    return renderer;
}
