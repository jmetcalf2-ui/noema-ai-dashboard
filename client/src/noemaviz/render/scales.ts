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
