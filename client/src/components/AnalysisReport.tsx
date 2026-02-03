import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Rows3,
  Columns3,
  AlertCircle,
  Hash,
  Calendar,
  MapPin,
  Type,
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp,
  AlertTriangle,
  Database,
  BarChart3,
  Activity,
  Target,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { InsightSpec, InsightFamily, DatasetComplexity } from "../../../shared/insights";
import { InsightRenderer, CollapsedInsight } from "./InsightRenderer";

interface AnalysisReportProps {
  title: string;
  summary: string;
  insights: InsightSpec[];
  complexity: DatasetComplexity;
  fingerprint: DatasetFingerprint;
  className?: string;
}

export interface DatasetFingerprint {
  rowCount: number;
  columnCount: number;
  numericCount: number;
  categoricalCount: number;
  datetimeCount: number;
  geoCount: number;
  idCount: number;
  textCount: number;
  averageMissingness: number;
  highMissingnessColumns: string[];
  constantColumns: string[];
  warnings: string[];
}

const familyIcons: Record<string, any> = {
  distribution: BarChart3,
  outlier: AlertTriangle,
  missingness: Database,
  correlation: TrendingUp,
  category_driver: Layers,
  time_dynamics: Activity,
  geo_pattern: Target,
  segmentation: Target,
  data_quality: Database,
  uncertainty: HelpCircle,
  // Fallback mappings for old-format categories
  "Key Findings": Zap,
  "Trends": TrendingUp,
  "Anomalies": AlertTriangle,
  "Data Quality Notes": Database,
};

// Default icon for unknown families
const DefaultFamilyIcon = Zap;

export function AnalysisReport({
  title,
  summary,
  insights,
  complexity,
  fingerprint,
  className = ""
}: AnalysisReportProps) {
  const [expandedBeyondDefault, setExpandedBeyondDefault] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);

  // Group insights by family for TOC
  const insightsByFamily = useMemo(() => {
    const groups: Record<string, InsightSpec[]> = {};
    for (const insight of insights) {
      const family = insight.family || "distribution";
      if (!groups[family]) groups[family] = [];
      groups[family].push(insight);
    }
    return groups;
  }, [insights]);

  // Default expanded count (first 8)
  const defaultExpandedCount = 8;
  const defaultExpanded = insights.slice(0, defaultExpandedCount);
  const collapsedByDefault = insights.slice(defaultExpandedCount);

  // Scroll spy for active insight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("insight-", "");
            setActiveInsightId(id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    insights.forEach(insight => {
      const el = document.getElementById(`insight-${insight.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [insights]);

  const scrollToInsight = (id: string) => {
    const el = document.getElementById(`insight-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-8 max-w-4xl">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-foreground" data-testid="text-report-title">
              {title}
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-3xl">
              {summary}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                {fingerprint.rowCount.toLocaleString()} rows
              </Badge>
              <Badge variant="outline" className="text-xs">
                {fingerprint.columnCount} columns
              </Badge>
              <Badge 
                variant={complexity.level === "complex" ? "destructive" : "secondary"} 
                className="text-xs capitalize"
              >
                {complexity.level} dataset
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {insights.length} insights
              </Badge>
            </div>
          </motion.header>

          {/* Dataset Fingerprint */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            id="fingerprint"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Dataset Fingerprint
            </h2>
            <Card className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <FingerprintStat 
                  icon={<Rows3 className="w-4 h-4" />}
                  label="Rows"
                  value={fingerprint.rowCount.toLocaleString()}
                />
                <FingerprintStat 
                  icon={<Columns3 className="w-4 h-4" />}
                  label="Columns"
                  value={String(fingerprint.columnCount)}
                />
                <FingerprintStat 
                  icon={<Hash className="w-4 h-4" />}
                  label="Numeric"
                  value={String(fingerprint.numericCount)}
                />
                <FingerprintStat 
                  icon={<Type className="w-4 h-4" />}
                  label="Categorical"
                  value={String(fingerprint.categoricalCount)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <FingerprintStat 
                  icon={<Calendar className="w-4 h-4" />}
                  label="Datetime"
                  value={String(fingerprint.datetimeCount)}
                />
                <FingerprintStat 
                  icon={<MapPin className="w-4 h-4" />}
                  label="Geographic"
                  value={String(fingerprint.geoCount)}
                />
                <FingerprintStat 
                  icon={<AlertCircle className="w-4 h-4" />}
                  label="Avg Missing"
                  value={`${(fingerprint.averageMissingness * 100).toFixed(1)}%`}
                  highlight={fingerprint.averageMissingness > 0.1}
                />
                <FingerprintStat 
                  icon={<Zap className="w-4 h-4" />}
                  label="Complexity"
                  value={`${complexity.score.toFixed(1)}`}
                />
              </div>

              {/* Warnings */}
              {fingerprint.warnings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Data Quality Flags
                  </h4>
                  <ul className="space-y-1">
                    {fingerprint.warnings.slice(0, 5).map((warning, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </motion.section>

          {/* Insights Section */}
          <section id="insights">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Analysis Insights
              <Badge variant="secondary" className="ml-2 text-xs">
                {insights.length} total
              </Badge>
            </h2>

            {/* Default expanded insights */}
            <div className="space-y-4">
              {defaultExpanded.map((insight, idx) => (
                <InsightRenderer
                  key={insight.id}
                  insight={insight}
                  index={idx}
                  defaultExpanded={true}
                />
              ))}
            </div>

            {/* Progressive disclosure for remaining insights */}
            {collapsedByDefault.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedBeyondDefault(!expandedBeyondDefault)}
                    className="text-xs gap-2"
                    data-testid="button-show-more-insights"
                  >
                    {expandedBeyondDefault ? (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Hide {collapsedByDefault.length} more insights
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        Show {collapsedByDefault.length} more insights
                      </>
                    )}
                  </Button>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {expandedBeyondDefault && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    {collapsedByDefault.map((insight, idx) => (
                      <InsightRenderer
                        key={insight.id}
                        insight={insight}
                        index={defaultExpandedCount + idx}
                        defaultExpanded={false}
                      />
                    ))}
                  </motion.div>
                )}

                {!expandedBeyondDefault && (
                  <div className="space-y-2">
                    {collapsedByDefault.slice(0, 5).map((insight) => (
                      <CollapsedInsight
                        key={insight.id}
                        insight={insight}
                        onExpand={() => {
                          setExpandedBeyondDefault(true);
                          setTimeout(() => scrollToInsight(insight.id), 100);
                        }}
                      />
                    ))}
                    {collapsedByDefault.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        + {collapsedByDefault.length - 5} more insights
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Sticky TOC Sidebar */}
        <div 
          ref={tocRef}
          className="hidden lg:block w-56 shrink-0"
        >
          <div className="sticky top-4 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Contents
            </h3>
            
            <nav className="space-y-1">
              <TocLink 
                href="#fingerprint" 
                label="Dataset Fingerprint"
                active={false}
              />
              <TocLink 
                href="#insights" 
                label={`Insights (${insights.length})`}
                active={false}
              />
            </nav>

            <div className="pt-2 border-t border-border/50">
              <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                By Category
              </h4>
              <nav className="space-y-0.5">
                {Object.keys(insightsByFamily).map(family => {
                  const Icon = familyIcons[family] || DefaultFamilyIcon;
                  const count = insightsByFamily[family].length;
                  const firstId = insightsByFamily[family][0]?.id;
                  const isActive = insightsByFamily[family].some((i: InsightSpec) => i.id === activeInsightId);
                  
                  return (
                    <button
                      key={family}
                      onClick={() => firstId && scrollToInsight(firstId)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="capitalize truncate">{family.replace("_", " ")}</span>
                      <span className="ml-auto text-[10px] opacity-60">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FingerprintStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function FingerprintStat({ icon, label, value, highlight = false }: FingerprintStatProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center",
        highlight ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" : "bg-secondary text-muted-foreground"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium tabular-nums", highlight && "text-amber-600 dark:text-amber-400")}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface TocLinkProps {
  href: string;
  label: string;
  active: boolean;
}

function TocLink({ href, label, active }: TocLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "block px-2 py-1 rounded text-xs transition-colors",
        active 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {label}
    </a>
  );
}
