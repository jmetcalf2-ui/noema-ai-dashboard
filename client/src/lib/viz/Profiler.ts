import type { DatasetProfile, ColumnProfile, ColumnType, SemanticType } from "../../../../shared/viz";

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

        let inferredType: ColumnType = "text";
        let semanticType: SemanticType | undefined;
        let isDiscrete = false;

        const isIdLike = uniqueCount === values.length && (key.toLowerCase().includes("id") || key.toLowerCase().endsWith("_key"));
        const isDate = values.length > 0 && values.every(v => !isNaN(Date.parse(String(v))) && isNaN(Number(v)));
        const geoKeywords = ["city", "state", "zip", "latitude", "longitude", "lat", "lon", "country", "region"];
        const isGeo = geoKeywords.some(k => key.toLowerCase().includes(k));
        const isNumeric = values.length > 0 && values.every(v => !isNaN(Number(v)));

        if (isIdLike) inferredType = "id";
        else if (isDate) inferredType = "datetime";
        else if (isNumeric) inferredType = "numeric";
        else if (isGeo) inferredType = "geo";
        else if (uniqueCount < rowCount * 0.2 || uniqueCount < 20) {
            inferredType = "categorical";
            isDiscrete = true;
        }

        const lowerKey = key.toLowerCase();

        if (inferredType === "numeric") {
            if (["price", "cost", "revenue", "sales", "val", "amount", "notional"].some(k => lowerKey.includes(k))) {
                semanticType = "currency";
            } else if (["rate", "pct", "percent", "share", "ratio", "margin", "yield"].some(k => lowerKey.includes(k))) {
                semanticType = "percent";
            } else if (["_lower", "_upper", "_min", "_max", "_lo", "_hi", "_ci", "_err"].some(k => lowerKey.endsWith(k))) {
                semanticType = "uncertainty_bound";
            } else {
                semanticType = "ratio";
            }
        } else if (inferredType === "categorical") {
            semanticType = "nominal";
        }

        let numericStats;
        let outliers: number[] = [];
        let zeroCount = 0;

        if (inferredType === "numeric") {
            const nums = values.map(v => Number(v));
            const sortedNums = [...nums].sort((a, b) => a - b);

            zeroCount = nums.filter(n => n === 0).length;

            if (uniqueCount < 20) isDiscrete = true;

            if (sortedNums.length > 0) {
                const min = sortedNums[0];
                const max = sortedNums[sortedNums.length - 1];
                const sum = nums.reduce((a, b) => a + b, 0);
                const mean = sum / nums.length;
                const median = sortedNums[Math.floor(sortedNums.length / 2)];

                const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length;
                const std = Math.sqrt(variance);

                const m3 = nums.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / nums.length;
                const skew = isNaN(m3) ? 0 : m3;

                const p10 = sortedNums[Math.floor(sortedNums.length * 0.1)];
                const p25 = sortedNums[Math.floor(sortedNums.length * 0.25)];
                const p75 = sortedNums[Math.floor(sortedNums.length * 0.75)];
                const p90 = sortedNums[Math.floor(sortedNums.length * 0.9)];

                const iqr = p75 - p25;
                const lowerBound = p25 - 1.5 * iqr;
                const upperBound = p75 + 1.5 * iqr;
                outliers = nums.filter(n => n < lowerBound || n > upperBound);

                numericStats = { min, max, mean, median, std, skew, p10, p25, p75, p90, zeros: zeroCount };
            }
        }

        const examples = Array.from(uniqueValues).slice(0, 5);

        columns.push({
            name: key,
            inferredType,
            semanticType,
            missingRate,
            uniqueCount,
            examples,
            numeric: numericStats,
            outlierCount: outliers.length,
            isDiscrete,
        });

        if (inferredType === "numeric") numericColumns.push(key);
        if (inferredType === "categorical") categoricalColumns.push(key);
        if (inferredType === "datetime") datetimeColumns.push(key);
        if (inferredType === "geo") geoColumns.push(key);
        if (inferredType === "id") idColumns.push(key);

        if (missingRate > 0.5) warnings.push(`High missingness in ${key} (${(missingRate * 100).toFixed(0)}%)`);
        if (outliers.length > 0) warnings.push(`${key} has ${outliers.length} detected outliers.`);
        if (zeroCount / rowCount > 0.5) warnings.push(`${key} is sparse (${(zeroCount / rowCount * 100).toFixed(0)}% zeros).`);
    }

    const correlations: Array<{ a: string; b: string; r: number }> = [];
    if (numericColumns.length > 1 && rowCount > 1) {
        const limitedNumeric = numericColumns.slice(0, 10);
        for (let i = 0; i < limitedNumeric.length; i++) {
            for (let j = i + 1; j < limitedNumeric.length; j++) {
                const keyA = limitedNumeric[i];
                const keyB = limitedNumeric[j];
                const valsA = rows.map(r => Number(r[keyA]) || 0);
                const valsB = rows.map(r => Number(r[keyB]) || 0);

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

                if (Math.abs(r) > 0.3) {
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
