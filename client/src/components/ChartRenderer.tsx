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
      size = 200,
      strokeWidth = 20,
      animationDuration = 1,
      animationDelayPerSegment = 0.05,
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
            stroke="hsl(var(--border) / 0.5)"
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
                    opacity: { duration: 0.3, delay: index * animationDelayPerSegment },
                    strokeDashoffset: {
                      duration: animationDuration,
                      delay: index * animationDelayPerSegment,
                      ease: "easeOut",
                    },
                  }}
                  className={cn(
                    "origin-center transition-transform duration-200",
                    highlightOnHover && "cursor-pointer"
                  )}
                  style={{
                    filter: isActive
                      ? `drop-shadow(0px 0px 6px ${segment.color}) brightness(1.1)`
                      : 'none',
                    transform: isActive ? 'scale(1.03)' : 'scale(1)',
                    transition: "filter 0.2s ease-out, transform 0.2s ease-out",
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
  type: "bar" | "line" | "pie" | "area";
  title: string;
  description?: string;
  dataKey: string;
  categoryKey?: string;
  xAxisKey?: string;
  data: any[];
};

const GRADIENT_COLORS = [
  { start: "#6366f1", end: "#8b5cf6" },
  { start: "#06b6d4", end: "#3b82f6" },
  { start: "#10b981", end: "#14b8a6" },
  { start: "#f59e0b", end: "#ef4444" },
  { start: "#ec4899", end: "#8b5cf6" },
];

const getGradientColor = (index: number) => {
  const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  return gradient.start;
};

export function ChartRenderer({ config }: { config: ChartConfigProp }) {
  const [hoveredSegment, setHoveredSegment] = React.useState<DonutChartSegment | null>(null);
  const chartId = React.useId().replace(/:/g, "");

  if (!config || !config.data || config.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground/60 text-sm">
        No data available
      </div>
    );
  }

  const categoryKey = config.categoryKey || config.xAxisKey || "name";

  const chartConfig: ChartConfig = {
    [config.dataKey]: {
      label: config.dataKey,
      color: GRADIENT_COLORS[0].start,
    },
  };

  config.data.forEach((item, index) => {
    const key = String(item[categoryKey]);
    if (key) {
      chartConfig[key] = {
        label: key,
        color: getGradientColor(index),
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
              margin={{ left: 0, right: 16, top: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`barGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GRADIENT_COLORS[0].start} stopOpacity={1} />
                  <stop offset="100%" stopColor={GRADIENT_COLORS[0].end} stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                tickMargin={12}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={40}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey={config.dataKey}
                fill={`url(#barGradient-${chartId})`}
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
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
              margin={{ left: 0, right: 16, top: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`lineGradient-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={GRADIENT_COLORS[1].start} />
                  <stop offset="100%" stopColor={GRADIENT_COLORS[1].end} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={40}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground)/0.3)' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey={config.dataKey}
                type="monotone"
                stroke={`url(#lineGradient-${chartId})`}
                strokeWidth={3}
                dot={{
                  fill: GRADIENT_COLORS[1].start,
                  strokeWidth: 0,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: GRADIENT_COLORS[1].end,
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
              margin={{ left: 0, right: 16, top: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`areaGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GRADIENT_COLORS[2].start} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={GRADIENT_COLORS[2].end} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id={`areaStroke-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={GRADIENT_COLORS[2].start} />
                  <stop offset="100%" stopColor={GRADIENT_COLORS[2].end} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => String(value).slice(0, 12)}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={40}
              />
              <ChartTooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground)/0.3)' }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey={config.dataKey}
                type="monotone"
                fill={`url(#areaGradient-${chartId})`}
                stroke={`url(#areaStroke-${chartId})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        );

      case "pie":
        const pieData: DonutChartSegment[] = config.data.map((item, index) => ({
          value: item[config.dataKey] || 0,
          color: getGradientColor(index),
          label: String(item[categoryKey]),
          ...item,
        }));

        const total = pieData.reduce((acc, curr) => acc + curr.value, 0);

        return (
          <div className="flex flex-col items-center gap-6 py-4">
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
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold tracking-tight"
                  >
                    {hoveredSegment
                      ? hoveredSegment.value.toLocaleString()
                      : total.toLocaleString()}
                  </motion.div>
                  <motion.div 
                    key={hoveredSegment?.label || "Total"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground mt-0.5"
                  >
                    {hoveredSegment ? hoveredSegment.label : "Total"}
                  </motion.div>
                </div>
              }
            />
            <div className="flex flex-wrap justify-center gap-4 max-w-xs">
              {pieData.map((segment, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-opacity",
                    hoveredSegment && hoveredSegment.label !== segment.label && "opacity-40"
                  )}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                    style={{ 
                      backgroundColor: segment.color,
                      boxShadow: `0 0 8px ${segment.color}40`
                    }}
                  />
                  <span className="text-muted-foreground text-xs">{segment.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              accessibilityLayer
              data={config.data}
              margin={{ left: 0, right: 16, top: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`defaultGradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GRADIENT_COLORS[0].start} stopOpacity={1} />
                  <stop offset="100%" stopColor={GRADIENT_COLORS[0].end} stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={40}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey={config.dataKey} 
                fill={`url(#defaultGradient-${chartId})`} 
                radius={[6, 6, 0, 0]} 
                maxBarSize={50}
              />
            </BarChart>
          </ChartContainer>
        );
    }
  };

  return (
    <motion.div 
      className="space-y-4" 
      data-testid={`chart-${config.type}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="space-y-1">
        <h3 className="font-semibold text-base tracking-tight">{config.title}</h3>
        {config.description && (
          <p className="text-sm text-muted-foreground/80 leading-relaxed">{config.description}</p>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-gradient-to-b from-card to-card/80 p-5 shadow-sm backdrop-blur-sm">
        {renderChart()}
      </div>
    </motion.div>
  );
}
