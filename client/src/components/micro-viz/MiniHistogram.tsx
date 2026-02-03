import { Bar, BarChart, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

interface MiniHistogramProps {
  data: Array<{ bin: string; count: number; binStart?: number; binEnd?: number }>;
  height?: number;
  color?: string;
  meanValue?: number;
  medianValue?: number;
  className?: string;
}

export function MiniHistogram({
  data,
  height = 120,
  color = "#3b82f6",
  meanValue,
  medianValue,
  className = ""
}: MiniHistogramProps) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="histogramGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <Bar dataKey="count" fill="url(#histogramGradient)" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={index} fillOpacity={entry.count / maxCount * 0.5 + 0.5} />
            ))}
          </Bar>
          {meanValue !== undefined && (
            <ReferenceLine x={String(Math.floor(meanValue))} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" />
          )}
          {medianValue !== undefined && (
            <ReferenceLine x={String(Math.floor(medianValue))} stroke="#22c55e" strokeWidth={2} />
          )}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
        <span>{data[0]?.bin}</span>
        <span>{data[data.length - 1]?.bin}</span>
      </div>
    </div>
  );
}
