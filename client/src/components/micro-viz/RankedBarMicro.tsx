import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";

interface RankedBarMicroProps {
  data: Array<{ category: string; value: number }>;
  height?: number;
  color?: string;
  horizontal?: boolean;
  showLabels?: boolean;
  className?: string;
}

export function RankedBarMicro({
  data,
  height = 140,
  color = "#3b82f6",
  horizontal = true,
  showLabels = true,
  className = ""
}: RankedBarMicroProps) {
  if (!data || data.length === 0) return null;

  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10);
  const maxValue = Math.max(...sortedData.map(d => d.value));

  if (horizontal) {
    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={sortedData} 
            layout="vertical" 
            margin={{ top: 4, right: 8, bottom: 4, left: showLabels ? 60 : 8 }}
          >
            <defs>
              <linearGradient id="rankedBarGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            {showLabels && (
              <YAxis 
                type="category" 
                dataKey="category" 
                tick={{ fontSize: 10, fill: "#64748b" }} 
                axisLine={false}
                tickLine={false}
                width={55}
              />
            )}
            <XAxis type="number" hide domain={[0, maxValue * 1.1]} />
            <Bar 
              dataKey="value" 
              fill="url(#rankedBarGradient)" 
              radius={[0, 3, 3, 0]}
              isAnimationActive={false}
            >
              {sortedData.map((entry, index) => (
                <Cell key={index} fillOpacity={1 - (index * 0.06)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={{ top: 4, right: 4, bottom: 20, left: 4 }}>
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 9, fill: "#64748b" }} 
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
          />
          <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {sortedData.map((entry, index) => (
              <Cell key={index} fillOpacity={1 - (index * 0.06)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
