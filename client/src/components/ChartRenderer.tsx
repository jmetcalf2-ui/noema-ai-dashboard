"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  ZAxis,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface DonutChartSegment {
  value: number;
  color: string;
  label: string;
  [key: string]: any;
}

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  animationDelayPerSegment?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data,
      totalValue: propTotalValue,
      size = 180,
      strokeWidth = 24,
      animationDuration = 0.8,
      animationDelayPerSegment = 0.04,
      highlightOnHover = true,
      centerContent,
      onSegmentHover,
      className,
      ...props
    },
    ref
  ) => {
    const [hoveredSegment, setHoveredSegment] =
      React.useState<DonutChartSegment | null>(null);

    const internalTotalValue = React.useMemo(
      () =>
        propTotalValue || data.reduce((sum, segment) => sum + segment.value, 0),
      [data, propTotalValue]
    );

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    React.useEffect(() => {
      onSegmentHover?.(hoveredSegment);
    }, [hoveredSegment, onSegmentHover]);

    const handleMouseLeave = () => {
      setHoveredSegment(null);
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center", className)}
        style={{ width: size, height: size }}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--border) / 0.4)"
            strokeWidth={strokeWidth}
          />
          
          <AnimatePresence>
            {data.map((segment, index) => {
              if (segment.value === 0) return null;

              const percentage =
                internalTotalValue === 0
                  ? 0
                  : (segment.value / internalTotalValue) * 100;
              
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = (cumulativePercentage / 100) * circumference;
              
              const isActive = hoveredSegment?.label === segment.label;
              
              cumulativePercentage += percentage;

              return (
                <motion.circle
                  key={segment.label || index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  strokeLinecap="round"
                  initial={{ opacity: 0, strokeDashoffset: circumference }}
                  animate={{ 
                    opacity: 1, 
                    strokeDashoffset: -strokeDashoffset,
                  }}
                  transition={{
                    opacity: { duration: 0.2, delay: index * animationDelayPerSegment },
                    strokeDashoffset: {
                      duration: animationDuration,
                      delay: index * animationDelayPerSegment,
                      ease: "easeOut",
                    },
                  }}
                  className={cn(
                    "origin-center transition-all duration-150",
                    highlightOnHover && "cursor-pointer"
                  )}
                  style={{
                    opacity: isActive ? 1 : 0.85,
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                  onMouseEnter={() => setHoveredSegment(segment)}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {centerContent && (
          <div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              width: size - strokeWidth * 2.5,
              height: size - strokeWidth * 2.5,
            }}
          >
            {centerContent}
          </div>
        )}
      </div>
    );
  }
);

DonutChart.displayName = "DonutChart";

type ChartConfigProp = {
  type: "bar" | "line" | "pie" | "area" | "horizontal_bar" | "scatter" | "radar" | "composed";
  title: string;
  description?: string;
  dataKey: string;
  secondaryDataKey?: string;
  categoryKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  data: any[];
};

const BLUE_GRADIENT_COLORS = [
  "#3b82f6",
  "#6366f1", 
  "#8b5cf6",
  "#a855f7",
  "#c084fc",
];

const getChartColor = (index: number) => {
  return BLUE_GRADIENT_COLORS[index % BLUE_GRADIENT_COLORS.length];
};

export function ChartRenderer({ config }: { config: ChartConfigProp }) {
  const [hoveredSegment, setHoveredSegment] = React.useState<DonutChartSegment | null>(null);
  const chartId = React.useId().replace(/:/g, "");

  if (!config || !config.data || config.data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-muted-foreground/50 text-sm">
        No data available
      </div>
    );
  }

  const categoryKey = config.categoryKey || config.xAxisKey || "name";

  const chartConfig: ChartConfig = {
    [config.dataKey]: {
      label: config.dataKey,
      color: BLUE_GRADIENT_COLORS[0],
    },
  };

  config.data.forEach((item, index) => {
    const key = String(item[categoryKey]);
    if (key) {
      chartConfig[key] = {
        label: key,
        color: getChartColor(index),
      };
    }
  });

  const renderChart = () => {
    switch (config.type) {
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`barGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={45}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.25)', radius: 4 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey={config.dataKey}
                fill={`url(#barGradient-${chartId})`}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        );

      case "line":
        return (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <LineChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`lineGradient-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={45}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground)/0.2)' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey={config.dataKey}
                type="monotone"
                stroke={`url(#lineGradient-${chartId})`}
                strokeWidth={2.5}
                dot={{
                  fill: "#3b82f6",
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: "#6366f1",
                  stroke: 'white',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ChartContainer>
        );

      case "area":
        return (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={45}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground)/0.2)' }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey={config.dataKey}
                type="monotone"
                fill={`url(#areaGradient-${chartId})`}
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        );

      case "horizontal_bar":
        return (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              accessibilityLayer
              data={config.data}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id={`hbarGradient-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis 
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
              />
              <YAxis
                dataKey={categoryKey}
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={80}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.25)', radius: 4 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey={config.dataKey}
                fill={`url(#hbarGradient-${chartId})`}
                radius={[0, 6, 6, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ChartContainer>
        );

      case "pie":
        const pieData: DonutChartSegment[] = config.data.map((item, index) => ({
          value: item[config.dataKey] || 0,
          color: getChartColor(index),
          label: String(item[categoryKey]),
          ...item,
        }));

        const total = pieData.reduce((acc, curr) => acc + curr.value, 0);

        return (
          <div className="flex flex-col items-center gap-5 py-4">
            <DonutChart
              data={pieData}
              size={200}
              strokeWidth={28}
              highlightOnHover={true}
              onSegmentHover={setHoveredSegment}
              centerContent={
                <div className="text-center">
                  <motion.div 
                    key={hoveredSegment?.value || total}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="text-2xl font-semibold tracking-tight"
                  >
                    {hoveredSegment
                      ? hoveredSegment.value.toLocaleString()
                      : total.toLocaleString()}
                  </motion.div>
                  <motion.div 
                    key={hoveredSegment?.label || "Total"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="text-xs text-muted-foreground mt-0.5"
                  >
                    {hoveredSegment ? hoveredSegment.label : "Total"}
                  </motion.div>
                </div>
              }
            />
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 max-w-sm">
              {pieData.map((segment, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-opacity duration-150",
                    hoveredSegment && hoveredSegment.label !== segment.label && "opacity-35"
                  )}
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-muted-foreground text-xs">{segment.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "scatter":
        const xKey = config.xAxisKey || categoryKey;
        const yKey = config.yAxisKey || config.dataKey;
        return (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ScatterChart
              margin={{ left: 0, right: 20, top: 20, bottom: 10 }}
            >
              <defs>
                <linearGradient id={`scatterGradient-${chartId}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={xKey}
                type="number"
                name={xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
              />
              <YAxis
                dataKey={yKey}
                type="number"
                name={yKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={50}
              />
              <ZAxis range={[60, 200]} />
              <ChartTooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={<ChartTooltipContent />}
              />
              <Scatter
                name={config.title}
                data={config.data}
                fill={`url(#scatterGradient-${chartId})`}
              >
                {config.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getChartColor(index % 5)} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        );

      case "radar":
        const radarDataKey = config.dataKey;
        const radarSecondaryKey = config.secondaryDataKey;
        return (
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={config.data}>
              <PolarGrid className="stroke-border/50" />
              <PolarAngleAxis
                dataKey={categoryKey}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 'auto']}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                name={radarDataKey}
                dataKey={radarDataKey}
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {radarSecondaryKey && (
                <Radar
                  name={radarSecondaryKey}
                  dataKey={radarSecondaryKey}
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              )}
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
              />
            </RadarChart>
          </ChartContainer>
        );

      case "composed":
        const composedPrimaryKey = config.dataKey;
        const composedSecondaryKey = config.secondaryDataKey || config.dataKey;
        return (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`composedBarGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={50}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                yAxisId="left"
                dataKey={composedPrimaryKey}
                fill={`url(#composedBarGradient-${chartId})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey={composedSecondaryKey}
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: "#6366f1", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#8b5cf6", stroke: 'white', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ChartContainer>
        );

      default:
        return (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`defaultGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={45}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.25)', radius: 4 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey={config.dataKey} 
                fill={`url(#defaultGradient-${chartId})`} 
                radius={[6, 6, 0, 0]} 
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        );
    }
  };

  return (
    <motion.div 
      className="space-y-3" 
      data-testid={`chart-${config.type}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="space-y-0.5">
        <h3 className="font-medium text-[15px]">{config.title}</h3>
        {config.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
        )}
      </div>
      <div className="rounded-xl border bg-card p-5">
        {renderChart()}
      </div>
    </motion.div>
  );
}
