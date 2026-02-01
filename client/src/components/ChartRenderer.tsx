"use client"

import { 
  Bar, 
  BarChart,
  CartesianGrid, 
  XAxis, 
  YAxis,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Label,
  LabelList
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

type ChartConfigProp = {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  description?: string;
  dataKey: string;
  categoryKey?: string;
  xAxisKey?: string;
  data: any[];
};

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
      color: "hsl(var(--chart-1))",
    },
  };

  config.data.forEach((item, index) => {
    const key = String(item[categoryKey]);
    if (key) {
      chartConfig[key] = {
        label: key,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    }
  });

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <ChartContainer config={chartConfig}>
            <BarChart 
              accessibilityLayer 
              data={config.data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey={config.dataKey} 
                fill="var(--color-desktop)" 
                radius={8}
              >
                {config.data.map((entry, index) => (
                  <LabelList
                    key={index}
                    dataKey={config.dataKey}
                    position="top"
                    className="fill-foreground"
                    fontSize={12}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        );

      case 'line':
        return (
          <ChartContainer config={chartConfig}>
            <LineChart 
              accessibilityLayer 
              data={config.data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line 
                dataKey={config.dataKey} 
                type="natural"
                stroke="var(--color-desktop)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-desktop)",
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        );

      case 'area':
        return (
          <ChartContainer config={chartConfig}>
            <AreaChart 
              accessibilityLayer 
              data={config.data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey={config.dataKey}
                type="natural"
                fill="var(--color-desktop)"
                fillOpacity={0.4}
                stroke="var(--color-desktop)"
              />
            </AreaChart>
          </ChartContainer>
        );

      case 'pie':
        const total = config.data.reduce((acc, curr) => acc + (curr[config.dataKey] || 0), 0);
        
        return (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={config.data}
                dataKey={config.dataKey}
                nameKey={categoryKey}
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {total.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Total
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey={categoryKey} />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        );

      default:
        return (
          <ChartContainer config={chartConfig}>
            <BarChart 
              accessibilityLayer 
              data={config.data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis 
                dataKey={categoryKey} 
                tickLine={false} 
                axisLine={false}
                tickMargin={10}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey={config.dataKey} 
                fill="var(--color-desktop)" 
                radius={8}
              />
            </BarChart>
          </ChartContainer>
        );
    }
  };

  return (
    <div className="space-y-3" data-testid={`chart-${config.type}`}>
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
