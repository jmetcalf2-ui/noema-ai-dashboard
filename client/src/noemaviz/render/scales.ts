export class LinearScale {
    private _domain: [number, number];
    private _range: [number, number];

    constructor(domain: [number, number], range: [number, number]) {
        this._domain = domain;
        this._range = range;
    }

    public map(x: number): number {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;

        // Avoid divide by zero
        if (d1 === d0) return (r0 + r1) / 2;

        const t = (x - d0) / (d1 - d0);
        return r0 + t * (r1 - r0);
    }

    public invert(y: number): number {
        const [d0, d1] = this._domain;
        const [r0, r1] = this._range;

        if (r1 === r0) return d0;

        const t = (y - r0) / (r1 - r0);
        return d0 + t * (d1 - d0);
    }
}

export class BandScale {
    private _domain: string[];
    private _range: [number, number];
    private _padding: number;

    constructor(domain: string[], range: [number, number], padding: number = 0.1) {
        this._domain = domain;
        this._range = range;
        this._padding = padding;
    }

    public bandwidth(): number {
        const [r0, r1] = this._range;
        const width = Math.abs(r1 - r0);
        const count = this._domain.length;
        if (count === 0) return 0;

        const step = width / count;
        return step * (1 - this._padding);
    }

    public map(x: string): number {
        const index = this._domain.indexOf(x);
        if (index === -1) return this._range[0]; // Fallback

        const [r0, r1] = this._range;
        const totalWidth = Math.abs(r1 - r0);
        const step = totalWidth / this._domain.length;

        // Calculate position based on range direction
        // If r0 < r1 (Left to Right): start + index * step + paddingOffset
        const paddingOffset = (step * this._padding) / 2;

        if (r0 < r1) {
            return r0 + (index * step) + paddingOffset;
        } else {
            // Right to Left (uncommon for X, but possible)
            return r0 - (index * step) - paddingOffset - this.bandwidth();
        }
    }
}

export class OrdinalPointScale {
    private _domain: string[];
    private _range: [number, number];

    constructor(domain: string[], range: [number, number]) {
        this._domain = domain;
        this._range = range;
    }

    public map(x: string): number {
        const index = this._domain.indexOf(x);
        if (index === -1) return (this._range[0] + this._range[1]) / 2;

        const [r0, r1] = this._range;
        const step = (r1 - r0) / Math.max(1, this._domain.length - 1);

        if (this._domain.length === 1) return (r0 + r1) / 2;

        return r0 + index * step;
    }
}
