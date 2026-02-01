import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  LineChart,
  Line
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from '@/components/ui/chart';

type ChartConfigProp = {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  description?: string;
  dataKey: string;
  categoryKey?: string;
  xAxisKey?: string;
  data: any[];
  colors?: string[];
};

const CHART_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(160, 60%, 45%)',
  'hsl(43, 96%, 56%)',
  'hsl(0, 84%, 60%)',
  'hsl(262, 83%, 58%)',
  'hsl(330, 81%, 60%)',
  'hsl(187, 85%, 43%)',
  'hsl(142, 71%, 45%)',
];

export function ChartRenderer({ config }: { config: ChartConfigProp }) {
  if (!config || !config.data || config.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
        No data available
      </div>
    );
  }

  const categoryKey = config.categoryKey || config.xAxisKey || 'name';

  const chartConfig: ChartConfig = {
    [config.dataKey]: {
      label: config.dataKey,
      color: CHART_COLORS[0],
    },
  };

  config.data.forEach((item, index) => {
    const key = item[categoryKey];
    if (key) {
      chartConfig[key] = {
        label: key,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    }
  });

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={config.data} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
                width={50}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey={config.dataKey} 
                fill={CHART_COLORS[0]}
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ChartContainer>
        );

      case 'line':
        return (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={config.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
                width={50}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone"
                dataKey={config.dataKey} 
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_COLORS[0] }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        );

      case 'area':
        return (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={config.data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id={`fill-${config.title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
                width={50}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone"
                dataKey={config.dataKey} 
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                fill={`url(#fill-${config.title})`}
              />
            </AreaChart>
          </ChartContainer>
        );

      case 'pie':
        return (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <PieChart>
              <Pie
                data={config.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey={config.dataKey}
                nameKey={categoryKey}
              >
                {config.data.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey={categoryKey} />} />
              <ChartLegend content={<ChartLegendContent nameKey={categoryKey} />} />
            </PieChart>
          </ChartContainer>
        );

      default:
        return (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={config.data} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                fontSize={11}
                width={50}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey={config.dataKey} 
                fill={CHART_COLORS[0]}
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ChartContainer>
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
