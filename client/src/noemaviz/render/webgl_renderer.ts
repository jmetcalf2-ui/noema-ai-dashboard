/**
 * Main WebGL2 NOEMAVIZ Renderer
 * Orchestrates all mark renderers and handles coordinate transformations
 */

import { WebGL2Context } from './gl';
import { GPUPicker } from './picking';
import { PointRenderer } from './marks/points';
import { RectRenderer } from './marks/rects';
import { DataFrame } from '../core/data_engine';
import { IVizSpec } from '../core/grammar';
import { LinearScale, BandScale, OrdinalPointScale } from './scales';

export class NoemaWebGLRenderer {
    private glContext: WebGL2Context;
    private gl: WebGL2RenderingContext;
    private picker: GPUPicker;
    private pointRenderer: PointRenderer;
    private rectRenderer: RectRenderer;

    private width: number = 0;
    private height: number = 0;
    private dpr: number = 1;

    private isDestroyed: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.glContext = new WebGL2Context(canvas, { alpha: false, antialias: true });
        this.gl = this.glContext.gl;
        this.dpr = window.devicePixelRatio || 1;

        // Initialize subsystems
        this.picker = new GPUPicker(this.glContext);
        this.pointRenderer = new PointRenderer(this.glContext);
        this.rectRenderer = new RectRenderer(this.glContext);
    }

    public init() {
        // Initialization handled in constructor
    }

    public resize(w: number, h: number) {
        if (this.isDestroyed) return;

        this.width = w;
        this.height = h;

        this.glContext.resize(w, h, this.dpr);
        this.picker.resize(
            Math.floor(w * this.dpr),
            Math.floor(h * this.dpr)
        );
    }

    public update(spec: IVizSpec, data: DataFrame) {
        if (this.isDestroyed) return;

        // Clear
        this.glContext.clear(1, 1, 1, 1);

        // Get encodings
        const xEnc = spec.encodings.x;
        const yEnc = spec.encodings.y;
        if (!xEnc || !yEnc) return;

        // Build transformation matrix
        const matrix = this.computeMatrix(spec, data);

        // Render based on mark type
        if (spec.mark === 'point') {
            this.pointRenderer.setData(data, {
                xField: xEnc.field,
                yField: yEnc.field,
                defaultSize: 6
            });
            this.pointRenderer.render(matrix, 6 * this.dpr);
        } else if (spec.mark === 'rect') {
            // Prepare rects from data
            const rects = this.prepareRects(spec, data);
            this.rectRenderer.setData(data, {
                xField: xEnc.field,
                yField: yEnc.field
            }, rects);
            this.rectRenderer.render(matrix);
        }
    }

    private computeMatrix(spec: IVizSpec, data: DataFrame): Float32Array {
        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const width = this.width * this.dpr;
        const height = this.height * this.dpr;

        const xEnc = spec.encodings.x!;
        const yEnc = spec.encodings.y!;

        const xCol = data.getColumn(xEnc.field);
        const yCol = data.getColumn(yEnc.field);

        if (!xCol || !yCol) {
            return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        }

        // Compute data domains
        const xValues = xCol.values;
        const yValues = yCol.values;

        // Y scale (always numeric)
        let yMin = Infinity, yMax = -Infinity;
        for (let i = 0; i < yValues.length; i++) {
            const v = yValues[i] as number;
            if (typeof v === 'number' && !isNaN(v)) {
                if (v < yMin) yMin = v;
                if (v > yMax) yMax = v;
            }
        }

        if (yMin === Infinity) { yMin = 0; yMax = 100; }
        const yPad = (yMax - yMin) * 0.1;
        const yScale = new LinearScale(
            [Math.min(0, yMin - yPad), yMax + yPad],
            [height - margin.bottom, margin.top]
        );

        // X scale (numeric or categorical)
        const xIsNumeric = typeof xValues[0] === 'number';
        let xScale: LinearScale | BandScale | OrdinalPointScale;

        if (xIsNumeric) {
            let xMin = Infinity, xMax = -Infinity;
            for (let i = 0; i < xValues.length; i++) {
                const v = xValues[i] as number;
                if (typeof v === 'number' && !isNaN(v)) {
                    if (v < xMin) xMin = v;
                    if (v > xMax) xMax = v;
                }
            }
            if (xMin === Infinity) { xMin = 0; xMax = 100; }
            const xPad = (xMax - xMin) * 0.05;
            xScale = new LinearScale([xMin - xPad, xMax + xPad], [margin.left, width - margin.right]);
        } else {
            const uniqueCategories = Array.from(new Set(xValues.filter(v => v != null && v !== '').map(String)));
            if (spec.mark === 'rect') {
                xScale = new BandScale(uniqueCategories, [margin.left, width - margin.right], 0.2);
            } else {
                xScale = new OrdinalPointScale(uniqueCategories, [margin.left, width - margin.right]);
            }
        }

        // Build projection matrix (data → NDC)
        // WebGL uses NDC: [-1, 1] for both x and y
        // We need to map screen pixels → NDC

        const scaleX = 2 / width;
        const scaleY = -2 / height; // Flip Y (WebGL Y-up, canvas Y-down)
        const translateX = -1;
        const translateY = 1;

        // Matrix in column-major order
        return new Float32Array([
            scaleX, 0, 0,
            0, scaleY, 0,
            translateX, translateY, 1
        ]);
    }

    private prepareRects(spec: IVizSpec, data: DataFrame): Array<{ x: number; y: number; w: number; h: number }> {
        const margin = { top: 40, right: 20, bottom: 60, left: 60 };
        const width = this.width * this.dpr;
        const height = this.height * this.dpr;

        const xEnc = spec.encodings.x!;
        const yEnc = spec.encodings.y!;

        const xCol = data.getColumn(xEnc.field);
        const yCol = data.getColumn(yEnc.field);

        if (!xCol || !yCol) return [];

        const rects: Array<{ x: number; y: number; w: number; h: number }> = [];

        // Build scales (same as computeMatrix)
        const yValues = yCol.values;
        let yMin = Infinity, yMax = -Infinity;
        for (let i = 0; i < yValues.length; i++) {
            const v = yValues[i] as number;
            if (typeof v === 'number' && !isNaN(v)) {
                if (v < yMin) yMin = v;
                if (v > yMax) yMax = v;
            }
        }
        if (yMin === Infinity) { yMin = 0; yMax = 100; }
        const yPad = (yMax - yMin) * 0.1;
        const yScale = new LinearScale(
            [Math.min(0, yMin - yPad), yMax + yPad],
            [height - margin.bottom, margin.top]
        );

        const xValues = xCol.values;
        const uniqueCategories = Array.from(new Set(xValues.filter(v => v != null && v !== '').map(String)));
        const xScale = new BandScale(uniqueCategories, [margin.left, width - margin.right], 0.2);
        const bandwidth = xScale.bandwidth();

        for (let i = 0; i < yValues.length; i++) {
            const xVal = String(xValues[i]);
            const yVal = yValues[i] as number;

            if (typeof yVal !== 'number' || isNaN(yVal)) continue;

            const x = xScale.map(xVal);
            const y = yScale.map(yVal);
            const yZero = yScale.map(0);
            const h = yZero - y;

            rects.push({ x, y, w: bandwidth, h });
        }

        return rects;
    }

    public pick(x: number, y: number): number {
        return this.picker.pick(Math.floor(x * this.dpr), Math.floor(y * this.dpr));
    }

    public destroy() {
        this.isDestroyed = true;
        this.pointRenderer.destroy();
        this.rectRenderer.destroy();
        this.picker.destroy();
        this.glContext.destroy();
    }
}
