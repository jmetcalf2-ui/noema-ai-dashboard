import { Line, LineChart, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";

interface MicroSparklineProps {
  data: Array<{ value: number; date?: string }>;
  height?: number;
  color?: string;
  showArea?: boolean;
  referenceValue?: number;
  className?: string;
}

export function MicroSparkline({
  data,
  height = 60,
  color = "#3b82f6",
  showArea = false,
  referenceValue,
  className = ""
}: MicroSparklineProps) {
  if (!data || data.length === 0) return null;

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {referenceValue !== undefined && (
            <ReferenceLine y={referenceValue} stroke="#94a3b8" strokeDasharray="3 3" />
          )}
          {showArea ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill="url(#sparklineGradient)"
              dot={false}
              isAnimationActive={false}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
