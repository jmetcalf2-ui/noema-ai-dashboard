import { DataFrame } from "../core/data_engine";
import { IVizSpec } from "../core/grammar";
import { LinearScale } from "./scales"; // Local import

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
        const margin = { top: 40, right: 20, bottom: 40, left: 50 };

        // 1. Get Columns
        const xEnc = spec.encodings.x;
        const yEnc = spec.encodings.y;
        if (!xEnc || !yEnc) return;

        const xCol = data.getColumn(xEnc.field);
        const yCol = data.getColumn(yEnc.field);
        if (!xCol || !yCol) return;

        const xIdx = xCol.values;
        const yIdx = yCol.values;

        // 2. Compute Domains (Naive)
        // TODO: move to a DataView prepared class
        let xMin = Infinity, xMax = -Infinity;
        let yMin = Infinity, yMax = -Infinity;
        const validIndices: number[] = [];

        for (let i = 0; i < xIdx.length; i++) {
            const vx = xIdx[i] as number;
            const vy = yIdx[i] as number;
            if (typeof vx === 'number' && typeof vy === 'number') {
                if (vx < xMin) xMin = vx;
                if (vx > xMax) xMax = vx;
                if (vy < yMin) yMin = vy;
                if (vy > yMax) yMax = vy;
                validIndices.push(i);
            }
        }

        if (xMin === Infinity) { xMin = 0; xMax = 100; }
        if (yMin === Infinity) { yMin = 0; yMax = 100; }

        const xPad = (xMax - xMin) * 0.05;
        const yPad = (yMax - yMin) * 0.05;

        // 3. Create Scales
        const xScale = new LinearScale([xMin - xPad, xMax + xPad], [margin.left, width - margin.right]);
        const yScale = new LinearScale([yMin - yPad, yMax + yPad], [height - margin.bottom, margin.top]);

        // 4. Draw Axes
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.font = "10px Inter, sans-serif";
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

        // Labels
        ctx.fillText(xMin.toFixed(1), margin.left, height - margin.bottom + 15);
        ctx.fillText(xMax.toFixed(1), width - margin.right - 20, height - margin.bottom + 15);
        ctx.fillText(yMin.toFixed(1), 5, height - margin.bottom);
        ctx.fillText(yMax.toFixed(1), 5, margin.top);

        // Title
        if (spec.layout?.title) {
            ctx.fillStyle = "#111827";
            ctx.font = "bold 14px Inter, sans-serif";
            ctx.fillText(spec.layout.title, margin.left, margin.top - 20);
        }

        // 5. Draw Marks
        ctx.fillStyle = "#3b82f6";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;

        if (spec.mark === 'point') {
            for (const i of validIndices) {
                const cx = xScale.map(xIdx[i] as number);
                const cy = yScale.map(yIdx[i] as number);

                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        else if (spec.mark === 'line') {
            // Simple line render (assumes sorted by X for now, or just connects points)
            // Ideally should sort by X
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
            }

            // Render points on top? Optional.
            ctx.fillStyle = "white";
            ctx.strokeStyle = "#3b82f6";
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
        else if (spec.mark === 'rect') {
            // Bar chart
            const bandwidth = (width - margin.left - margin.right) / validIndices.length * 0.8;
            const maxBarWidth = 40;
            const barWidth = Math.min(bandwidth, maxBarWidth);

            // For categorical X, we might need an ordinal scale. 
            // Current LinearScale maps numbers. If X is string -> ordinal mapping needed.
            // For strictly quantitative X (histogram-like), linear is fine.
            // ADAPTER NOTE: adapter maps Nominal X. Renderer currently naive.
            // Fix: If X is string/nominal, simple band logic here or rely on scale.

            for (const i of validIndices) {
                let cx = xScale.map(xIdx[i] as number);
                // If scale is ordinal (not impl yet), we'd get band center.

                const cy = yScale.map(yIdx[i] as number);
                const yZero = yScale.map(0); // Baseline

                const h = yZero - cy;

                ctx.fillRect(cx - barWidth / 2, cy, barWidth, h);
            }
        }
    }

    public destroy() {
        this.isDestroyed = true;
        // Release WebGL context if we were using it
    }
}
