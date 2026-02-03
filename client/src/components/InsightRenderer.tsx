import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  AlertTriangle,
  Database,
  BarChart3,
  Activity,
  Target,
  Map,
  Layers,
  HelpCircle,
  type LucideIcon
} from "lucide-react";
import type { InsightSpec, InsightFamily, ChartKind } from "../../../shared/insights";
import {
  MicroSparkline,
  MiniHistogram,
  RankedBarMicro,
  OutlierDotStrip,
  MissingnessStrip,
  ScatterMini,
  UncertaintyBand,
  CorrelationCell
} from "./micro-viz";

interface InsightRendererProps {
  insight: InsightSpec;
  index: number;
  defaultExpanded?: boolean;
}

const familyConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  distribution: { icon: BarChart3, label: "Distribution", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" },
  outlier: { icon: AlertTriangle, label: "Outlier", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  missingness: { icon: Database, label: "Missingness", color: "text-slate-600 bg-slate-100 dark:bg-slate-800/50" },
  correlation: { icon: TrendingUp, label: "Relationship", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
  category_driver: { icon: Layers, label: "Category Driver", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50" },
  time_dynamics: { icon: Activity, label: "Time Trend", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
  geo_pattern: { icon: Map, label: "Geographic", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50" },
  segmentation: { icon: Target, label: "Segment", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50" },
  data_quality: { icon: Database, label: "Data Quality", color: "text-gray-600 bg-gray-100 dark:bg-gray-800/50" },
  uncertainty: { icon: HelpCircle, label: "Uncertainty", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/50" },
  // Fallback mappings for old-format categories
  "Key Findings": { icon: Zap, label: "Key Finding", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
  "Trends": { icon: TrendingUp, label: "Trend", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
  "Anomalies": { icon: AlertTriangle, label: "Anomaly", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  "Data Quality Notes": { icon: Database, label: "Data Quality", color: "text-gray-600 bg-gray-100 dark:bg-gray-800/50" },
};

// Default config for unknown families
const defaultFamilyConfig = { icon: Zap, label: "Insight", color: "text-slate-600 bg-slate-100 dark:bg-slate-800/50" };

const importanceStyles = {
  critical: "border-l-4 border-l-red-500",
  high: "border-l-4 border-l-indigo-500",
  medium: "border-l-2 border-l-slate-300",
  low: ""
};

export function InsightRenderer({ insight, index, defaultExpanded = true }: InsightRendererProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = familyConfig[insight.family] || defaultFamilyConfig;
  const Icon = config.icon;

  return (
    <motion.div
      id={`insight-${insight.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={cn("overflow-hidden transition-colors", importanceStyles[insight.importance])}>
        {/* Header - always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
          data-testid={`button-insight-toggle-${insight.id}`}
        >
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", config.color)}>
            <Icon className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {config.label}
              </span>
              {insight.importance === "critical" && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                  Critical
                </Badge>
              )}
              {insight.importance === "high" && (
                <Badge className="text-[9px] px-1.5 py-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  High Impact
                </Badge>
              )}
              {insight.confidence === "low" && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  Low Confidence
                </Badge>
              )}
            </div>
            <h3 className="text-[14px] font-medium text-foreground leading-snug">
              {insight.title}
            </h3>
          </div>

          <div className="shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-0 space-y-4">
                {/* Narrative */}
                <p className="text-[13px] text-muted-foreground leading-relaxed pl-11">
                  {insight.narrative}
                </p>

                {/* Chart */}
                {insight.chartSpec && insight.chartSpec.kind !== "none" && (
                  <div className="pl-11">
                    <MicroChart spec={insight.chartSpec} />
                  </div>
                )}

                {/* Why it matters */}
                <div className="pl-11 pt-2 border-t border-border/50">
                  <p className="text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground">Why this matters:</span>{" "}
                    {insight.whyItMatters}
                  </p>
                </div>

                {/* Fields used */}
                {insight.fieldsUsed.length > 0 && (
                  <div className="pl-11 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">Fields:</span>
                    {insight.fieldsUsed.map((field, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                        {field}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

interface MicroChartProps {
  spec: NonNullable<InsightSpec["chartSpec"]>;
}

function MicroChart({ spec }: MicroChartProps) {
  const { kind, data, height = 120, annotations, encoding } = spec;

  switch (kind) {
    case "sparkline":
      return <MicroSparkline data={data} height={height} showArea />;
    
    case "mini_histogram":
      const meanAnnotation = annotations?.find(a => a.label === "mean");
      const medianAnnotation = annotations?.find(a => a.label === "median");
      return (
        <MiniHistogram 
          data={data} 
          height={height}
          meanValue={meanAnnotation?.value}
          medianValue={medianAnnotation?.value}
        />
      );
    
    case "ranked_bar":
      return <RankedBarMicro data={data} height={height} horizontal />;
    
    case "outlier_dot_strip":
      const rangeAnnotation = annotations?.find(a => a.type === "range");
      return (
        <OutlierDotStrip 
          data={data} 
          height={height}
          normalRange={rangeAnnotation?.value}
        />
      );
    
    case "missingness_strip":
      return <MissingnessStrip data={data} height={height} />;
    
    case "scatter_mini":
      return (
        <ScatterMini 
          data={data} 
          height={height}
          xLabel={encoding?.x}
          yLabel={encoding?.y}
        />
      );
    
    case "uncertainty_band":
      return <UncertaintyBand data={data} height={height} />;
    
    case "correlation_cell":
      if (data.length > 0) {
        const { a, b, r } = data[0];
        return <CorrelationCell a={a} b={b} r={r} />;
      }
      return null;
    
    case "box_plot_strip":
      // Use OutlierDotStrip as a simplified box plot representation
      return <OutlierDotStrip data={data} height={height} />;
    
    case "residual_strip":
      return <OutlierDotStrip data={data} height={height} />;
    
    default:
      return null;
  }
}

// Collapsed insight for progressive disclosure
interface CollapsedInsightProps {
  insight: InsightSpec;
  onExpand: () => void;
}

export function CollapsedInsight({ insight, onExpand }: CollapsedInsightProps) {
  const config = familyConfig[insight.family] || defaultFamilyConfig;
  const Icon = config.icon;

  return (
    <button
      onClick={onExpand}
      className="w-full p-3 flex items-center gap-3 text-left rounded-lg border border-border/50 hover:bg-muted/30 hover:border-border transition-colors group"
      data-testid={`button-expand-insight-${insight.id}`}
    >
      <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0", config.color)}>
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors truncate flex-1">
        {insight.title}
      </span>
      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
