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
  type: "bar" | "line" | "pie" | "area" | "horizontal_bar";
  title: string;
  description?: string;
  dataKey: string;
  categoryKey?: string;
  xAxisKey?: string;
  data: any[];
};

const MONOCHROME_COLORS = [
  "#1a1a1a",
  "#404040",
  "#666666",
  "#8c8c8c",
  "#b3b3b3",
];

const getMonochromeColor = (index: number) => {
  return MONOCHROME_COLORS[index % MONOCHROME_COLORS.length];
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
      color: MONOCHROME_COLORS[0],
    },
  };

  config.data.forEach((item, index) => {
    const key = String(item[categoryKey]);
    if (key) {
      chartConfig[key] = {
        label: key,
        color: getMonochromeColor(index),
      };
    }
  });

  const renderChart = () => {
    switch (config.type) {
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`barGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#262626" stopOpacity={1} />
                  <stop offset="100%" stopColor="#404040" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={36}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.25)', radius: 3 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey={config.dataKey}
                fill={`url(#barGradient-${chartId})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ChartContainer>
        );

      case "line":
        return (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <LineChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={36}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground)/0.2)' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey={config.dataKey}
                type="monotone"
                stroke="#262626"
                strokeWidth={2}
                dot={{
                  fill: "#262626",
                  strokeWidth: 0,
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                  fill: "#1a1a1a",
                  stroke: 'white',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ChartContainer>
        );

      case "area":
        return (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#404040" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#666666" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 400 }}
                width={36}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground)/0.2)' }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey={config.dataKey}
                type="monotone"
                fill={`url(#areaGradient-${chartId})`}
                stroke="#404040"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ChartContainer>
        );

      case "horizontal_bar":
        return (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              accessibilityLayer
              data={config.data}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 8, bottom: 8 }}
            >
              <defs>
                <linearGradient id={`hbarGradient-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#333333" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4a4a4a" stopOpacity={1} />
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
                width={72}
                tickFormatter={(value) => String(value).slice(0, 10)}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.25)', radius: 3 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey={config.dataKey}
                fill={`url(#hbarGradient-${chartId})`}
                radius={[0, 4, 4, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ChartContainer>
        );

      case "pie":
        const pieData: DonutChartSegment[] = config.data.map((item, index) => ({
          value: item[config.dataKey] || 0,
          color: getMonochromeColor(index),
          label: String(item[categoryKey]),
          ...item,
        }));

        const total = pieData.reduce((acc, curr) => acc + curr.value, 0);

        return (
          <div className="flex flex-col items-center gap-5 py-3">
            <DonutChart
              data={pieData}
              size={180}
              strokeWidth={24}
              highlightOnHover={true}
              onSegmentHover={setHoveredSegment}
              centerContent={
                <div className="text-center">
                  <motion.div 
                    key={hoveredSegment?.value || total}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="text-2xl font-medium tracking-tight"
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
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 max-w-xs">
              {pieData.map((segment, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-opacity duration-150",
                    hoveredSegment && hoveredSegment.label !== segment.label && "opacity-35"
                  )}
                >
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-muted-foreground text-xs">{segment.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 12, top: 16, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`defaultGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#262626" stopOpacity={1} />
                  <stop offset="100%" stopColor="#404040" stopOpacity={0.9} />
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
                width={36}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.25)', radius: 3 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey={config.dataKey} 
                fill={`url(#defaultGradient-${chartId})`} 
                radius={[4, 4, 0, 0]} 
                maxBarSize={44}
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
        <h3 className="font-medium text-sm">{config.title}</h3>
        {config.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
        )}
      </div>
      <div className="rounded-lg border bg-card p-4">
        {renderChart()}
      </div>
    </motion.div>
  );
}
