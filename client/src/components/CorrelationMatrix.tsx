"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface CorrelationMatrixProps {
  data: Record<string, Record<string, number>>;
  labels?: string[];
  colorScale?: "blue" | "diverging";
  showValues?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CorrelationMatrix({
  data,
  labels,
  colorScale = "diverging",
  showValues = true,
  size = "md",
  className,
}: CorrelationMatrixProps) {
  const keys = labels || Object.keys(data);
  
  const cellSizes = {
    sm: "w-8 h-8 text-[9px]",
    md: "w-12 h-12 text-[10px]",
    lg: "w-16 h-16 text-xs",
  };

  const labelSizes = {
    sm: "text-[9px] w-16",
    md: "text-[10px] w-20",
    lg: "text-xs w-24",
  };

  const getColor = (value: number) => {
    if (colorScale === "blue") {
      const intensity = Math.abs(value);
      return `rgba(59, 130, 246, ${intensity * 0.8 + 0.1})`;
    }
    
    if (value > 0) {
      const intensity = value;
      return `rgba(59, 130, 246, ${intensity * 0.8 + 0.1})`;
    } else if (value < 0) {
      const intensity = Math.abs(value);
      return `rgba(239, 68, 68, ${intensity * 0.8 + 0.1})`;
    }
    return "rgba(148, 163, 184, 0.2)";
  };

  const getTextColor = (value: number) => {
    const intensity = Math.abs(value);
    return intensity > 0.5 ? "text-white" : "text-foreground";
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="inline-flex flex-col">
        <div className="flex">
          <div className={cn(labelSizes[size])} />
          {keys.map((key, i) => (
            <div
              key={key}
              className={cn(
                cellSizes[size],
                "flex items-end justify-center pb-1 font-medium text-muted-foreground truncate"
              )}
              style={{ transform: "rotate(-45deg)", transformOrigin: "bottom center" }}
            >
              <span className="truncate max-w-full">{key.slice(0, 8)}</span>
            </div>
          ))}
        </div>
        
        {keys.map((rowKey, rowIndex) => (
          <div key={rowKey} className="flex">
            <div
              className={cn(
                labelSizes[size],
                "flex items-center justify-end pr-2 font-medium text-muted-foreground truncate"
              )}
            >
              <span className="truncate">{rowKey.slice(0, 10)}</span>
            </div>
            {keys.map((colKey, colIndex) => {
              const value = data[rowKey]?.[colKey] ?? 0;
              return (
                <motion.div
                  key={colKey}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (rowIndex * keys.length + colIndex) * 0.01 }}
                  className={cn(
                    cellSizes[size],
                    "flex items-center justify-center font-medium rounded-sm m-0.5 transition-transform hover:scale-105 cursor-default",
                    getTextColor(value)
                  )}
                  style={{ backgroundColor: getColor(value) }}
                  title={`${rowKey} vs ${colKey}: ${value.toFixed(2)}`}
                >
                  {showValues && (
                    <span>{value.toFixed(value === 1 || value === -1 ? 0 : 1)}</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-4 mt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/70" />
          <span>Negative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-300/30" />
          <span>None</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500/70" />
          <span>Positive</span>
        </div>
      </div>
    </div>
  );
}

interface HeatmapProps {
  data: { x: string; y: string; value: number }[];
  xLabels?: string[];
  yLabels?: string[];
  colorScale?: "blue" | "green" | "purple";
  showValues?: boolean;
  className?: string;
}

export function Heatmap({
  data,
  xLabels,
  yLabels,
  colorScale = "blue",
  showValues = true,
  className,
}: HeatmapProps) {
  const xKeys = xLabels || Array.from(new Set(data.map(d => d.x)));
  const yKeys = yLabels || Array.from(new Set(data.map(d => d.y)));
  
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const colorScales = {
    blue: ["rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0.9)"],
    green: ["rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.9)"],
    purple: ["rgba(139, 92, 246, 0.1)", "rgba(139, 92, 246, 0.9)"],
  };

  const getColor = (value: number) => {
    const normalized = (value - minValue) / range;
    const [startColor, endColor] = colorScales[colorScale];
    return `color-mix(in srgb, ${endColor} ${normalized * 100}%, ${startColor})`;
  };

  const getValue = (x: string, y: string) => {
    const cell = data.find(d => d.x === x && d.y === y);
    return cell?.value ?? 0;
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="inline-flex flex-col">
        <div className="flex">
          <div className="w-20" />
          {xKeys.map((key) => (
            <div
              key={key}
              className="w-12 h-8 flex items-end justify-center pb-1 text-[10px] font-medium text-muted-foreground"
            >
              <span className="truncate max-w-full transform -rotate-45 origin-bottom-center">
                {key.slice(0, 6)}
              </span>
            </div>
          ))}
        </div>
        
        {yKeys.map((yKey, yIndex) => (
          <div key={yKey} className="flex">
            <div className="w-20 flex items-center justify-end pr-2 text-[10px] font-medium text-muted-foreground truncate">
              {yKey.slice(0, 10)}
            </div>
            {xKeys.map((xKey, xIndex) => {
              const value = getValue(xKey, yKey);
              const normalized = (value - minValue) / range;
              return (
                <motion.div
                  key={xKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (yIndex * xKeys.length + xIndex) * 0.02 }}
                  className={cn(
                    "w-12 h-10 flex items-center justify-center text-[10px] font-medium rounded-sm m-0.5",
                    normalized > 0.5 ? "text-white" : "text-foreground"
                  )}
                  style={{ backgroundColor: getColor(value) }}
                  title={`${xKey}, ${yKey}: ${value}`}
                >
                  {showValues && value.toLocaleString()}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
