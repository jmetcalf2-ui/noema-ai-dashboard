import { DataFrame } from "../core/data_engine";
import { IVizSpec } from "../core/grammar";
import { LinearScale, BandScale, OrdinalPointScale } from "./scales";

export class NoemaRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private width: number = 0;
    private height: number = 0;
    private dpr: number = 1;
    private isDestroyed: boolean = false;

    // State cache
    private currentSpec?: IVizSpec;
    private currentData?: DataFrame;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext("2d", { alpha: false }); // Optimize for no transparency if possible
        if (!ctx) throw new Error("Could not get 2D context");
        this.ctx = ctx;

        this.dpr = window.devicePixelRatio || 1;
        this.resize();
    }

    /**
     * Initialize the renderer.
     * (In this 2D implementation, constructor does most work, but this is the API contract)
     */
    public init() {
        this.resize();
    }

    /**
     * Handle resizing. Should be called by observer.
     */
    public resize(w?: number, h?: number) {
        if (this.isDestroyed) return;

        this.width = w || this.canvas.clientWidth;
        this.height = h || this.canvas.clientHeight;

        // Physical pixels
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;

        // Logical pixels mapping
        this.ctx.resetTransform();
        this.ctx.scale(this.dpr, this.dpr);

        // If we have data, re-render
        if (this.currentSpec && this.currentData) {
            this.renderInternal();
        }
    }

    /**
     * Main render loop.
     */
    public update(spec: IVizSpec, data: DataFrame) {
        if (this.isDestroyed) return;
        this.currentSpec = spec;
        this.currentData = data;
        this.renderInternal();
    }

    /**
     * Private internal render logic.
     */
    private renderInternal() {
        if (!this.currentSpec || !this.currentData) return;
        const { spec, data } = { spec: this.currentSpec, data: this.currentData };
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;

        // Clear
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Margins
        const margin = { top: 40, right: 20, bottom: 60, left: 60 };

        // 1. Get Columns
        const xEnc = spec.encodings.x;
        const yEnc = spec.encodings.y;
        if (!xEnc || !yEnc) return;

        const xCol = data.getColumn(xEnc.field);
        const yCol = data.getColumn(yEnc.field);
        if (!xCol || !yCol) return;

        const xIdx = xCol.values;
        const yIdx = yCol.values;

        // 2. Detect data types and compute domains
        const xIsNumeric = typeof xIdx[0] === 'number';
        const yIsNumeric = typeof yIdx[0] === 'number';

        let xScale: LinearScale | BandScale | OrdinalPointScale;
        let yScale: LinearScale;
        const validIndices: number[] = [];

        // Y-axis (always numeric for now)
        let yMin = Infinity, yMax = -Infinity;
        for (let i = 0; i < yIdx.length; i++) {
            const vy = yIdx[i];
            if (typeof vy === 'number' && !isNaN(vy)) {
                if (vy < yMin) yMin = vy;
                if (vy > yMax) yMax = vy;
                validIndices.push(i);
            }
        }

        if (yMin === Infinity) { yMin = 0; yMax = 100; }
        const yPad = (yMax - yMin) * 0.1;
        yScale = new LinearScale([Math.min(0, yMin - yPad), yMax + yPad], [height - margin.bottom, margin.top]);

        // X-axis (numeric or categorical)
        if (xIsNumeric) {
            // Numeric X
            let xMin = Infinity, xMax = -Infinity;
            const numericValidIndices: number[] = [];

            for (let i = 0; i < xIdx.length; i++) {
                const vx = xIdx[i];
                if (typeof vx === 'number' && !isNaN(vx) && validIndices.includes(i)) {
                    if (vx < xMin) xMin = vx;
                    if (vx > xMax) xMax = vx;
                    numericValidIndices.push(i);
                }
            }

            validIndices.length = 0;
            validIndices.push(...numericValidIndices);

            if (xMin === Infinity) { xMin = 0; xMax = 100; }
            const xPad = (xMax - xMin) * 0.05;
            xScale = new LinearScale([xMin - xPad, xMax + xPad], [margin.left, width - margin.right]);
        } else {
            // Categorical X
            const categoricalValidIndices = validIndices.filter(i => xIdx[i] != null && xIdx[i] !== '');
            validIndices.length = 0;
            validIndices.push(...categoricalValidIndices);

            const uniqueCategories = Array.from(new Set(xIdx.filter(v => v != null && v !== '').map(String)));

            if (spec.mark === 'rect') {
                xScale = new BandScale(uniqueCategories, [margin.left, width - margin.right], 0.2);
            } else {
                xScale = new OrdinalPointScale(uniqueCategories, [margin.left, width - margin.right]);
            }
        }

        // 4. Draw Axes
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.font = "11px Inter, sans-serif";
        ctx.fillStyle = "#6b7280";

        // X Axis
        ctx.beginPath();
        ctx.moveTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        ctx.stroke();

        // Y Axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.stroke();

        // Y-axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(yMin.toFixed(0), margin.left - 10, height - margin.bottom);
        ctx.fillText(yMax.toFixed(0), margin.left - 10, margin.top);

        // X-axis labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        if (xScale instanceof BandScale || xScale instanceof OrdinalPointScale) {
            const categories = Array.from(new Set(xIdx.filter(v => v != null && v !== '').map(String)));
            categories.forEach((cat, idx) => {
                const x = xScale.map(cat);
                ctx.save();
                ctx.translate(x, height - margin.bottom + 5);
                ctx.rotate(-Math.PI / 6); // 30-degree tilt
                ctx.fillText(cat.length > 12 ? cat.substring(0, 12) + '...' : cat, 0, 0);
                ctx.restore();
            });
        } else if (xScale instanceof LinearScale) {
            const xDomain = (xScale as any)._domain;
            ctx.fillText(xDomain[0].toFixed(1), margin.left, height - margin.bottom + 5);
            ctx.fillText(xDomain[1].toFixed(1), width - margin.right, height - margin.bottom + 5);
        }

        // Title
        if (spec.layout?.title) {
            ctx.fillStyle = "#111827";
            ctx.font = "bold 14px Inter, sans-serif";
            ctx.textAlign = 'left';
            ctx.fillText(spec.layout.title, margin.left, 20);
        }

        // 5. Draw Marks
        ctx.fillStyle = "#3b82f6";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.85;

        if (spec.mark === 'point') {
            for (const i of validIndices) {
                const xVal = xIdx[i];
                const yVal = yIdx[i] as number;

                const cx = (xScale instanceof LinearScale)
                    ? xScale.map(xVal as number)
                    : xScale.map(String(xVal));
                const cy = yScale.map(yVal);

                ctx.beginPath();
                ctx.arc(cx, cy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        else if (spec.mark === 'line') {
            if (xScale instanceof LinearScale) {
                const sortedIndices = [...validIndices].sort((a, b) => (xIdx[a] as number) - (xIdx[b] as number));

                if (sortedIndices.length > 0) {
                    ctx.beginPath();
                    const startX = xScale.map(xIdx[sortedIndices[0]] as number);
                    const startY = yScale.map(yIdx[sortedIndices[0]] as number);
                    ctx.moveTo(startX, startY);

                    for (let i = 1; i < sortedIndices.length; i++) {
                        const idx = sortedIndices[i];
                        const cx = xScale.map(xIdx[idx] as number);
                        const cy = yScale.map(yIdx[idx] as number);
                        ctx.lineTo(cx, cy);
                    }
                    ctx.stroke();

                    // Points on top
                    ctx.fillStyle = "white";
                    ctx.lineWidth = 2;
                    for (const i of sortedIndices) {
                        const cx = xScale.map(xIdx[i] as number);
                        const cy = yScale.map(yIdx[i] as number);
                        ctx.beginPath();
                        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            } else {
                // Ordinal line chart
                const categories = Array.from(new Set(xIdx.filter(v => v != null && v !== '').map(String)));

                if (validIndices.length > 0) {
                    ctx.beginPath();
                    const firstCat = String(xIdx[validIndices[0]]);
                    const startX = xScale.map(firstCat);
                    const startY = yScale.map(yIdx[validIndices[0]] as number);
                    ctx.moveTo(startX, startY);

                    for (let i = 1; i < validIndices.length; i++) {
                        const idx = validIndices[i];
                        const cx = xScale.map(String(xIdx[idx]));
                        const cy = yScale.map(yIdx[idx] as number);
                        ctx.lineTo(cx, cy);
                    }
                    ctx.stroke();
                }
            }
        }
        else if (spec.mark === 'rect') {
            if (xScale instanceof BandScale) {
                const bandwidth = xScale.bandwidth();

                for (const i of validIndices) {
                    const xVal = String(xIdx[i]);
                    const yVal = yIdx[i] as number;

                    const cx = xScale.map(xVal);
                    const cy = yScale.map(yVal);
                    const yZero = yScale.map(0);

                    const h = yZero - cy;

                    ctx.fillRect(cx, cy, bandwidth, h);
                }
            }
        }
    }

    public destroy() {
        this.isDestroyed = true;
        // Release WebGL context if we were using it
    }
}
