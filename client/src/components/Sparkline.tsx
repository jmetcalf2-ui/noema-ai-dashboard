"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillOpacity?: number;
  showDots?: boolean;
  showArea?: boolean;
  showEndDot?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  strokeWidth = 1.5,
  color = "#3b82f6",
  fillOpacity = 0.1,
  showDots = false,
  showArea = true,
  showEndDot = true,
  className,
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, index) => ({
    x: padding + (index / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((value - min) / range) * chartHeight,
  }));

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  const trend = data[data.length - 1] > data[0] ? "up" : data[data.length - 1] < data[0] ? "down" : "neutral";
  const trendColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : color;

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {showArea && (
        <motion.path
          d={areaD}
          fill={trendColor}
          fillOpacity={fillOpacity}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <motion.path
        d={pathD}
        fill="none"
        stroke={trendColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={2}
          fill={trendColor}
        />
      ))}
      {showEndDot && points.length > 0 && (
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={trendColor}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.2 }}
        />
      )}
    </svg>
  );
}

interface SparkBarProps {
  data: number[];
  width?: number;
  height?: number;
  gap?: number;
  color?: string;
  showTrend?: boolean;
  className?: string;
}

export function SparkBar({
  data,
  width = 120,
  height = 32,
  gap = 2,
  color = "#3b82f6",
  showTrend = true,
  className,
}: SparkBarProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const padding = 2;
  const chartHeight = height - padding * 2;
  const barWidth = (width - padding * 2 - gap * (data.length - 1)) / data.length;

  const trend = data[data.length - 1] > data[0] ? "up" : data[data.length - 1] < data[0] ? "down" : "neutral";
  const trendColor = showTrend 
    ? (trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : color)
    : color;

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {data.map((value, index) => {
        const barHeight = (value / max) * chartHeight;
        const x = padding + index * (barWidth + gap);
        const y = padding + chartHeight - barHeight;
        const isLast = index === data.length - 1;
        
        return (
          <motion.rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={1}
            fill={isLast ? trendColor : `${trendColor}80`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            style={{ originY: 1 }}
          />
        );
      })}
    </svg>
  );
}
