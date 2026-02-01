import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

type ChartConfig = {
  type: 'bar' | 'line' | 'pie' | 'area' | 'radial';
  title: string;
  description?: string;
  dataKey: string;
  categoryKey: string;
  data: any[];
  colors?: string[];
};

const CHART_COLORS = [
  { main: '#6366f1', gradient: '#818cf8' },
  { main: '#10b981', gradient: '#34d399' },
  { main: '#f59e0b', gradient: '#fbbf24' },
  { main: '#ef4444', gradient: '#f87171' },
  { main: '#8b5cf6', gradient: '#a78bfa' },
  { main: '#ec4899', gradient: '#f472b6' },
  { main: '#06b6d4', gradient: '#22d3ee' },
  { main: '#84cc16', gradient: '#a3e635' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-xs text-muted-foreground">
          {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </p>
      </div>
    );
  }
  return null;
};

export function ChartRenderer({ config }: { config: ChartConfig }) {
  if (!config || !config.data || config.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
        No data available
      </div>
    );
  }

  const gradientId = `gradient-${config.title.replace(/\s/g, '-')}`;

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={config.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[0].gradient} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART_COLORS[0].main} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey={config.categoryKey} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }} />
              <Bar 
                dataKey={config.dataKey} 
                fill={`url(#${gradientId})`}
                radius={[6, 6, 0, 0]} 
                maxBarSize={48}
                animationDuration={800}
                animationBegin={0}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={config.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[1].main} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS[1].main} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey={config.categoryKey} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={config.dataKey} 
                stroke={CHART_COLORS[1].main}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={config.data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey={config.dataKey}
                nameKey={config.categoryKey}
                animationDuration={800}
                animationBegin={0}
              >
                {config.data.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length].main}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={40} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-foreground ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={config.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[0].gradient} stopOpacity={1} />
                  <stop offset="100%" stopColor={CHART_COLORS[0].main} stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey={config.categoryKey} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false} 
                axisLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={config.dataKey} 
                fill={`url(#${gradientId})`}
                radius={[6, 6, 0, 0]} 
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-base">{config.title}</h3>
        {config.description && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}
      </div>
      <div className="border rounded-lg p-4 bg-card">
        {renderChart()}
      </div>
    </div>
  );
}
