import type { DatasetProfile, ColumnProfile, ColumnType } from "../../../../shared/viz";

export function profileDataset(rows: Record<string, any>[]): DatasetProfile {
    if (rows.length === 0) {
        return {
            rowCount: 0,
            columns: [],
            numericColumns: [],
            categoricalColumns: [],
            datetimeColumns: [],
            geoColumns: [],
            idColumns: [],
            warnings: ["Empty dataset"],
        };
    }

    const keys = Object.keys(rows[0]);
    const rowCount = rows.length;
    const columns: ColumnProfile[] = [];

    const numericColumns: string[] = [];
    const categoricalColumns: string[] = [];
    const datetimeColumns: string[] = [];
    const geoColumns: string[] = [];
    const idColumns: string[] = [];
    const warnings: string[] = [];

    for (const key of keys) {
        const values = rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "");
        const missingCount = rowCount - values.length;
        const missingRate = missingCount / rowCount;
        const uniqueValues = new Set(values.map(v => String(v)));
        const uniqueCount = uniqueValues.size;

        // Type Inference
        let inferredType: ColumnType = "text";

        // Check for ID
        const isIdLike = uniqueCount === values.length && (key.toLowerCase().includes("id") || key.toLowerCase().endsWith("_key"));

        // Check for Date
        const isDate = values.length > 0 && values.every(v => !isNaN(Date.parse(String(v))) && isNaN(Number(v))); // Crude but effective for now

        // Check for Geo
        const geoKeywords = ["city", "state", "zip", "latitude", "longitude", "lat", "lon", "country"];
        const isGeo = geoKeywords.some(k => key.toLowerCase().includes(k));

        // Check for Numeric
        const isNumeric = values.length > 0 && values.every(v => !isNaN(Number(v)));

        if (isIdLike) inferredType = "id";
        else if (isDate) inferredType = "datetime";
        else if (isNumeric) inferredType = "numeric";
        else if (isGeo) inferredType = "geo";
        else if (uniqueCount < rowCount * 0.2 || uniqueCount < 20) inferredType = "categorical"; // Heuristic

        // Numeric Stats
        let numericStats;
        if (inferredType === "numeric") {
            const nums = values.map(v => Number(v)).sort((a, b) => a - b);
            if (nums.length > 0) {
                const min = nums[0];
                const max = nums[nums.length - 1];
                const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
                const median = nums[Math.floor(nums.length / 2)];

                // Std Dev
                const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
                const std = Math.sqrt(variance);

                // Skewness (approx)
                const skew = (3 * (mean - median)) / std || 0;

                // Percentiles
                const p10 = nums[Math.floor(nums.length * 0.1)] || min;
                const p25 = nums[Math.floor(nums.length * 0.25)] || min;
                const p75 = nums[Math.floor(nums.length * 0.75)] || max;
                const p90 = nums[Math.floor(nums.length * 0.90)] || max;

                numericStats = { min, max, mean, median, std, skew, p10, p25, p75, p90 };
            }
        }

        columns.push({
            name: key,
            inferredType,
            missingRate,
            uniqueCount,
            examples: Array.from(uniqueValues).slice(0, 5) as string[],
            numeric: numericStats,
        });

        if (inferredType === "numeric") numericColumns.push(key);
        if (inferredType === "categorical") categoricalColumns.push(key);
        if (inferredType === "datetime") datetimeColumns.push(key);
        if (inferredType === "geo") geoColumns.push(key);
        if (inferredType === "id") idColumns.push(key);

        if (missingRate > 0.5) warnings.push(`High missingness in ${key} (${(missingRate * 100).toFixed(0)}%)`);
    }

    // Basic Correlations (Pearson) for top numeric columns (limit to avoid n^2 perf hit on huge data)
    const correlations: Array<{ a: string; b: string; r: number }> = [];
    if (numericColumns.length > 1 && rowCount > 1) {
        const limitedNumeric = numericColumns.slice(0, 10); // Limit to first 10 for perf
        for (let i = 0; i < limitedNumeric.length; i++) {
            for (let j = i + 1; j < limitedNumeric.length; j++) {
                const keyA = limitedNumeric[i];
                const keyB = limitedNumeric[j];
                const valsA = rows.map(r => Number(r[keyA]) || 0);
                const valsB = rows.map(r => Number(r[keyB]) || 0);

                // Compute correlation
                const meanA = valsA.reduce((a, b) => a + b, 0) / rowCount;
                const meanB = valsB.reduce((a, b) => a + b, 0) / rowCount;

                let num = 0, denA = 0, denB = 0;
                for (let k = 0; k < rowCount; k++) {
                    const diffA = valsA[k] - meanA;
                    const diffB = valsB[k] - meanB;
                    num += diffA * diffB;
                    denA += diffA * diffA;
                    denB += diffB * diffB;
                }
                const r = num / (Math.sqrt(denA) * Math.sqrt(denB)) || 0;

                if (Math.abs(r) > 0.5) {
                    correlations.push({ a: keyA, b: keyB, r });
                }
            }
        }
    }

    return {
        rowCount,
        columns,
        numericColumns,
        categoricalColumns,
        datetimeColumns,
        geoColumns,
        idColumns,
        correlations,
        warnings,
    };
}
