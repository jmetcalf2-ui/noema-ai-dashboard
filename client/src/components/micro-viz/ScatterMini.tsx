import { Scatter, ScatterChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from "recharts";

interface ScatterMiniProps {
  data: Array<{ x: number; y: number }>;
  height?: number;
  color?: string;
  showTrendline?: boolean;
  xLabel?: string;
  yLabel?: string;
  className?: string;
}

export function ScatterMini({
  data,
  height = 160,
  color = "#3b82f6",
  showTrendline = true,
  xLabel,
  yLabel,
  className = ""
}: ScatterMiniProps) {
  if (!data || data.length === 0) return null;

  const validData = data.filter(d => d.x != null && d.y != null && !isNaN(d.x) && !isNaN(d.y));
  if (validData.length === 0) return null;

  // Compute simple linear regression for trendline
  const n = validData.length;
  const sumX = validData.reduce((a, b) => a + b.x, 0);
  const sumY = validData.reduce((a, b) => a + b.y, 0);
  const sumXY = validData.reduce((a, b) => a + b.x * b.y, 0);
  const sumX2 = validData.reduce((a, b) => a + b.x * b.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const minX = Math.min(...validData.map(d => d.x));
  const maxX = Math.max(...validData.map(d => d.x));

  const trendlineData = showTrendline ? [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept }
  ] : [];

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, bottom: 20, left: 30 }}>
          <XAxis 
            type="number" 
            dataKey="x" 
            name={xLabel}
            tick={{ fontSize: 9, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name={yLabel}
            tick={{ fontSize: 9, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <Scatter 
            data={validData} 
            fill={color} 
            fillOpacity={0.6}
            isAnimationActive={false}
          />
          {showTrendline && trendlineData.length === 2 && (
            <ReferenceLine
              segment={[
                { x: trendlineData[0].x, y: trendlineData[0].y },
                { x: trendlineData[1].x, y: trendlineData[1].y }
              ]}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
      {(xLabel || yLabel) && (
        <div className="flex justify-between text-[9px] text-muted-foreground px-8 -mt-2">
          <span>{xLabel}</span>
          <span>{yLabel}</span>
        </div>
      )}
    </div>
  );
}
