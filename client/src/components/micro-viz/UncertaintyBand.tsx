import { Area, AreaChart, Line, ComposedChart, ResponsiveContainer } from "recharts";

interface UncertaintyBandProps {
  data: Array<{ index: number; lower: number; upper: number; mid?: number }>;
  height?: number;
  color?: string;
  className?: string;
}

export function UncertaintyBand({
  data,
  height = 120,
  color = "#3b82f6",
  className = ""
}: UncertaintyBandProps) {
  if (!data || data.length === 0) return null;

  const validData = data.filter(d => d.lower != null && d.upper != null);
  if (validData.length === 0) return null;

  // Prepare data with range for area chart
  const chartData = validData.map(d => ({
    ...d,
    range: [d.lower, d.upper],
    midValue: d.mid ?? (d.lower + d.upper) / 2
  }));

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#uncertaintyGradient)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#ffffff"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="midValue"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="upper"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="lower"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 text-[10px] text-muted-foreground mt-1">
        <span className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-current" /> mid
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-current opacity-50 border-dashed" style={{ borderBottom: "1px dashed" }} /> bounds
        </span>
      </div>
    </div>
  );
}
