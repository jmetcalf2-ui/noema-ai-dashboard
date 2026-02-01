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

interface DonutChartSegment {
  value: number;
  color: string;
  label: string;
  [key: string]: any;
}

interface DonutChartProps {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  animationDelayPerSegment?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
  className?: string;
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
                      : "none",
                    transform: isActive ? "scale(1.03)" : "scale(1)",
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

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ChartRenderer({ config }: { config: ChartConfigProp }) {
  const [hoveredSegment, setHoveredSegment] = React.useState<DonutChartSegment | null>(null);

  if (!config || !config.data || config.data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-lg">
        No data available
      </div>
    );
  }

  const categoryKey = config.categoryKey || config.xAxisKey || "name";

  const chartConfig: ChartConfig = {
    [config.dataKey]: {
      label: config.dataKey,
      color: CHART_COLORS[0],
    },
  };

  config.data.forEach((item, index) => {
    const key = String(item[categoryKey]);
    if (key) {
      chartConfig[key] = {
        label: key,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    }
  });

  const renderChart = () => {
    switch (config.type) {
      case "bar":
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey={config.dataKey}
                fill={CHART_COLORS[0]}
                radius={8}
              />
            </BarChart>
          </ChartContainer>
        );

      case "line":
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey={config.dataKey}
                type="natural"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{
                  fill: CHART_COLORS[0],
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        );

      case "area":
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey={config.dataKey}
                type="natural"
                fill={CHART_COLORS[0]}
                fillOpacity={0.4}
                stroke={CHART_COLORS[0]}
              />
            </AreaChart>
          </ChartContainer>
        );

      case "pie":
        const pieData: DonutChartSegment[] = config.data.map((item, index) => ({
          value: item[config.dataKey] || 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
          label: String(item[categoryKey]),
          ...item,
        }));

        const total = pieData.reduce((acc, curr) => acc + curr.value, 0);

        return (
          <div className="flex flex-col items-center gap-4">
            <DonutChart
              data={pieData}
              size={220}
              strokeWidth={24}
              highlightOnHover={true}
              onSegmentHover={setHoveredSegment}
              centerContent={
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {hoveredSegment
                      ? hoveredSegment.value.toLocaleString()
                      : total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hoveredSegment ? hoveredSegment.label : "Total"}
                  </div>
                </div>
              }
            />
            <div className="flex flex-wrap justify-center gap-3">
              {pieData.map((segment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-sm"
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-muted-foreground">{segment.label}</span>
                </div>
              ))}
            </div>
          </div>
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey={config.dataKey} fill={CHART_COLORS[0]} radius={8} />
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
      <div className="border rounded-lg p-4 bg-card">{renderChart()}</div>
    </div>
  );
}
