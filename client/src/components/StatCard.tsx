"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Sparkline, SparkBar } from "./Sparkline";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: number[];
  trendType?: "line" | "bar";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel = "vs last period",
  trend,
  trendType = "line",
  icon,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                {icon}
              </div>
            )}
            <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
              {label}
            </span>
          </div>
          
          <motion.div 
            className="text-2xl font-semibold tabular-nums tracking-tight"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
          </motion.div>
          
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[12px] font-medium px-1.5 py-0.5 rounded",
                  isPositive && "text-emerald-600 bg-emerald-500/10",
                  isNegative && "text-red-600 bg-red-500/10",
                  isNeutral && "text-muted-foreground bg-muted"
                )}
              >
                {isPositive && <ArrowUp className="w-3 h-3" />}
                {isNegative && <ArrowDown className="w-3 h-3" />}
                {isNeutral && <Minus className="w-3 h-3" />}
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        
        {trend && trend.length > 0 && (
          <div className="shrink-0">
            {trendType === "line" ? (
              <Sparkline data={trend} width={80} height={32} />
            ) : (
              <SparkBar data={trend} width={80} height={32} />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface ProgressStatProps {
  label: string;
  value: number;
  max?: number;
  format?: "percent" | "number";
  color?: "blue" | "green" | "purple" | "amber";
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function ProgressStat({
  label,
  value,
  max = 100,
  format = "percent",
  color = "blue",
  size = "md",
  showValue = true,
  className,
}: ProgressStatProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    purple: "bg-violet-500",
    amber: "bg-amber-500",
  };

  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const displayValue = format === "percent" 
    ? `${percentage.toFixed(0)}%` 
    : `${value.toLocaleString()} / ${max.toLocaleString()}`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        {showValue && (
          <span className="text-[12px] font-medium tabular-nums">{displayValue}</span>
        )}
      </div>
      <div className={cn("w-full bg-secondary rounded-full overflow-hidden", heights[size])}>
        <motion.div
          className={cn("h-full rounded-full", colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface GaugeProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: "blue" | "green" | "purple" | "amber";
  className?: string;
}

export function Gauge({
  value,
  max = 100,
  label,
  size = 120,
  strokeWidth = 10,
  color = "blue",
  className,
}: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  const offset = halfCircumference - (percentage / 100) * halfCircumference;

  const colors = {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    amber: "#f59e0b",
  };

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        className="overflow-visible"
      >
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={halfCircumference}
          initial={{ strokeDashoffset: halfCircumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="text-xl font-semibold tabular-nums">{Math.round(percentage)}%</div>
        {label && <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>}
      </div>
    </div>
  );
}
