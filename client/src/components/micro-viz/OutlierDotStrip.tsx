import { useMemo } from "react";

interface OutlierDotStripProps {
  data: Array<{ value: number; isOutlier?: boolean }>;
  height?: number;
  normalRange?: [number, number];
  className?: string;
}

export function OutlierDotStrip({
  data,
  height = 80,
  normalRange,
  className = ""
}: OutlierDotStripProps) {
  const processed = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value).filter(v => v != null && !isNaN(v));
    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return {
      min,
      max,
      range,
      points: data
        .filter(d => d.value != null && !isNaN(d.value))
        .slice(0, 200) // Limit for performance
        .map(d => ({
          x: ((d.value - min) / range) * 100,
          isOutlier: d.isOutlier ?? false,
          value: d.value
        })),
      normalStart: normalRange ? ((normalRange[0] - min) / range) * 100 : undefined,
      normalEnd: normalRange ? ((normalRange[1] - min) / range) * 100 : undefined,
    };
  }, [data, normalRange]);

  if (!processed) return null;

  return (
    <div className={`w-full relative ${className}`} style={{ height }}>
      {/* Normal range background */}
      {processed.normalStart !== undefined && processed.normalEnd !== undefined && (
        <div
          className="absolute bg-emerald-100 dark:bg-emerald-900/30 h-8 top-1/2 -translate-y-1/2 rounded-sm"
          style={{
            left: `${Math.max(0, processed.normalStart)}%`,
            width: `${Math.min(100, processed.normalEnd) - Math.max(0, processed.normalStart)}%`
          }}
        />
      )}
      
      {/* Axis line */}
      <div className="absolute w-full h-px bg-border top-1/2 -translate-y-1/2" />
      
      {/* Data points */}
      <div className="absolute w-full top-1/2 -translate-y-1/2">
        {processed.points.map((point, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
              point.isOutlier 
                ? "bg-red-500 ring-2 ring-red-200" 
                : "bg-blue-400/70"
            }`}
            style={{ left: `${point.x}%` }}
            title={`${point.value.toFixed(2)}${point.isOutlier ? " (outlier)" : ""}`}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-muted-foreground">
        <span>{processed.min.toFixed(1)}</span>
        <span>{processed.max.toFixed(1)}</span>
      </div>
    </div>
  );
}
