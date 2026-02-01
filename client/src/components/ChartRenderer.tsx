import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ChartConfig = {
  type: 'bar' | 'line' | 'pie';
  title: string;
  description?: string;
  dataKey: string; // Key for the primary data values (Y-axis or Pie slices)
  categoryKey: string; // Key for categories (X-axis)
  data: any[];
  colors?: string[];
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ChartRenderer({ config }: { config: ChartConfig }) {
  if (!config || !config.data || config.data.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center p-8 text-muted-foreground bg-secondary/20 border-dashed">
        No data available to visualize
      </Card>
    );
  }

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={config.data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={config.categoryKey} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--secondary))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <Bar 
                dataKey={config.dataKey} 
                fill={config.colors?.[0] || COLORS[0]} 
                radius={[4, 4, 0, 0]} 
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={config.data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={config.categoryKey} 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                 contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={config.dataKey} 
                stroke={config.colors?.[0] || COLORS[0]} 
                strokeWidth={2}
                dot={{ r: 4, fill: config.colors?.[0] || COLORS[0] }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={config.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey={config.dataKey}
                nameKey={config.categoryKey}
              >
                {config.data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={config.colors?.[index % (config.colors.length || COLORS.length)] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--popover-foreground))',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{config.title}</CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
