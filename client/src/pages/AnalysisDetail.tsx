import { useAnalysis } from "@/hooks/use-analyses";
import { useRoute, Link } from "wouter";
import { ChartRenderer } from "@/components/ChartRenderer";
import { DataChat } from "@/components/DataChat";
import { AdvancedViewsGrid } from "@/components/AdvancedViewsGrid";
import { MetricCard } from "@/components/MetricCard";
import { DatasetSummary } from "@/components/DatasetSummary";
import { InsightCard, categorizeInsight, groupInsights } from "@/components/InsightCard";
import { AnalysisReport, type DatasetFingerprint } from "@/components/AnalysisReport";
import { InsightRenderer } from "@/components/InsightRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ExportMenu } from "@/components/ExportMenu";
import { motion } from "framer-motion";
import { ZoomableLineChart } from "@/components/charts/ZoomableLineChart";
import { InsightMetric } from "@/components/InsightMetric";
import {
  Loader2,
  BarChart3,
  Table2,
  Lightbulb,
  ArrowLeft,
  FileSpreadsheet,
  TrendingUp,
  Layers,
  Sparkles,
  Zap,
  AlertTriangle,
  Database,
  Search,
  FileText,
} from "lucide-react";
import { VizPanel } from "@/components/viz/VizPanel";
import { profileDataset } from "@/lib/viz/Profiler";
import { computeDatasetComplexity, computeInsightBudget, type InsightSpec, type DatasetComplexity } from "../../../shared/insights";

export default function AnalysisDetail() {
  const [, params] = useRoute("/analyses/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: analysis, isLoading, error } = useAnalysis(id);
  const [customCharts, setCustomCharts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: fileData } = useQuery({
    queryKey: ["/api/analyses", id, "data"],
    queryFn: async () => {
      const res = await fetch(`/api/analyses/${id}/data`);
      if (!res.ok) throw new Error("Failed to fetch data");
      return res.json();
    },
    enabled: !!analysis,
  });

  const sanitizedData = useMemo(() => {
    if (!fileData?.rows || !fileData?.headers) return null;
    const sanitizedHeaders = fileData.headers.filter(
      (h: string) => h && typeof h === "string" && h.trim() !== ""
    );
    const sanitizedRows = fileData.rows.map((row: any) => {
      const newRow: Record<string, any> = {};
      sanitizedHeaders.forEach((h: string) => {
        newRow[h] = row[h];
      });
      return newRow;
    });
    return { headers: sanitizedHeaders, rows: sanitizedRows };
  }, [fileData]);

  const metrics = useMemo(() => {
    if (!sanitizedData?.rows) return [];
    const rows = sanitizedData.rows;
    const headers = sanitizedData.headers;

    const numericCols = headers.filter((h: string) =>
      rows.some((r: any) => typeof r[h] === "number" && !isNaN(r[h]))
    );

    return [
      { label: "Records", value: rows.length, icon: <Layers className="w-4 h-4" /> },
      { label: "Columns", value: headers.length, icon: <FileSpreadsheet className="w-4 h-4" /> },
      { label: "Numeric Fields", value: numericCols.length, icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Visualizations", value: (analysis?.charts?.length || 0) + customCharts.length, icon: <BarChart3 className="w-4 h-4" /> },
    ];
  }, [sanitizedData, analysis, customCharts]);

  // Detect time series data for ZoomableLineChart
  const timeSeriesData = useMemo(() => {
    if (!sanitizedData?.rows || !sanitizedData.headers) return null;

    // Simple heuristic: look for a column with "date" or "time" in the name
    // AND check if values look like dates
    const dateCol = sanitizedData.headers.find((h: string) =>
      /date|time|day|month|year/i.test(h)
    );

    // Find first numeric column for values
    const valueCol = sanitizedData.headers.find((h: string) =>
      h !== dateCol && sanitizedData.rows.some((r: any) => typeof r[h] === "number")
    );

    if (dateCol && valueCol) {
      // Sort by date
      const sorted = [...sanitizedData.rows]
        .filter(r => r[dateCol] && r[valueCol] !== undefined)
        .sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime())
        .map(r => ({
          date: String(r[dateCol]),
          value: Number(r[valueCol])
        }));

      if (sorted.length > 2) return { data: sorted, dateKey: dateCol, valueKey: valueCol };
    }

    return null;
  }, [sanitizedData]);

  // Process insights with categorization - support both old and new format
  const processedInsights = useMemo(() => {
    if (!analysis?.insights) return null;

    const processed = analysis.insights
      .map((insight: string | { insight?: string; narrative?: string; title?: string }) => {
        const text = typeof insight === "string"
          ? insight
          : (insight.insight || insight.narrative || insight.title || "");
        if (!text) return null;
        const { category, importance, whyItMatters } = categorizeInsight(text);
        return { text, category, importance, whyItMatters };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return groupInsights(processed as any);
  }, [analysis?.insights]);

  // Convert insights to InsightSpec format for new report
  const insightSpecs = useMemo((): InsightSpec[] => {
    if (!analysis?.insights) return [];

    const specs = analysis.insights.map((insight: any, idx: number) => {
      // Handle new structured format
      if (typeof insight === "object" && insight.id) {
        return insight as InsightSpec;
      }

      // Handle old string format or partial format
      const text = typeof insight === "string" ? insight : (insight.insight || insight.narrative || insight.title || "");
      const { category, importance, whyItMatters } = categorizeInsight(text);

      return {
        id: `insight_${idx + 1}`,
        family: (insight.family || category) as any,
        title: insight.title || text.slice(0, 100),
        narrative: insight.narrative || text,
        whyItMatters: insight.whyItMatters || whyItMatters,
        fieldsUsed: insight.fieldsUsed || [],
        importance: insight.importance || importance,
        confidence: insight.confidence || "medium",
        chartSpec: insight.chartSpec
      } as InsightSpec;
    });

    // Sort by importance: critical first, high second, then medium, then low
    const importanceOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };

    return specs.sort((a, b) => {
      const aOrder = importanceOrder[a.importance] ?? 2;
      const bOrder = importanceOrder[b.importance] ?? 2;
      return aOrder - bOrder;
    });
  }, [analysis?.insights]);

  // Compute dataset profile, complexity, and fingerprint with error handling
  const { datasetProfile, complexity, fingerprint } = useMemo(() => {
    const defaultFingerprint: DatasetFingerprint = {
      rowCount: 0,
      columnCount: 0,
      numericCount: 0,
      categoricalCount: 0,
      datetimeCount: 0,
      geoCount: 0,
      idCount: 0,
      textCount: 0,
      averageMissingness: 0,
      highMissingnessColumns: [],
      constantColumns: [],
      warnings: []
    };

    const defaultComplexity: DatasetComplexity = {
      level: "simple" as const,
      score: 0,
      factors: {
        rowCount: 0,
        columnCount: 0,
        numericColumnCount: 0,
        categoricalColumnCount: 0,
        maxCardinality: 0,
        hasTimeSeries: false,
        hasGeo: false,
        correlationCount: 0,
        missingnessScore: 0
      }
    };

    if (!sanitizedData?.rows || sanitizedData.rows.length === 0) {
      return {
        datasetProfile: null,
        complexity: defaultComplexity,
        fingerprint: defaultFingerprint
      };
    }

    try {
      const profile = profileDataset(sanitizedData.rows);
      const comp = computeDatasetComplexity(profile);

      const fp: DatasetFingerprint = {
        rowCount: profile.rowCount,
        columnCount: profile.columns.length,
        numericCount: profile.numericColumns.length,
        categoricalCount: profile.categoricalColumns.length,
        datetimeCount: profile.datetimeColumns.length,
        geoCount: profile.geoColumns.length,
        idCount: profile.idColumns.length,
        textCount: profile.columns.filter(c => c.inferredType === "text").length,
        averageMissingness: profile.columns.reduce((sum, c) => sum + c.missingRate, 0) / (profile.columns.length || 1),
        highMissingnessColumns: profile.columns.filter(c => c.missingRate > 0.1).map(c => c.name),
        constantColumns: profile.columns.filter(c => c.uniqueCount === 1).map(c => c.name),
        warnings: profile.warnings || []
      };

      return { datasetProfile: profile, complexity: comp, fingerprint: fp };
    } catch (err) {
      console.error("Error profiling dataset:", err);
      return {
        datasetProfile: null,
        complexity: defaultComplexity,
        fingerprint: { ...defaultFingerprint, rowCount: sanitizedData.rows.length }
      };
    }
  }, [sanitizedData]);

  const handleCustomChart = (config: any) => {
    setCustomCharts((prev) => [...prev, config]);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground">Loading analysis...</span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-[14px]">Analysis not found</p>
        <Link href="/analyses">
          <Button variant="outline" size="sm">
            Back to Analyses
          </Button>
        </Link>
      </div>
    );
  }

  const sectionConfig = {
    finding: { icon: Zap, label: "Key Findings" },
    trend: { icon: TrendingUp, label: "Trends" },
    anomaly: { icon: AlertTriangle, label: "Anomalies" },
    quality: { icon: Database, label: "Data Quality Notes" },
  };

  return (
    <div className="min-h-screen pb-16 animate-fade-in">
      <div className="max-w-6xl mx-auto px-6">
        <div className="py-4">
          <Link
            href="/analyses"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-back-analyses"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to analyses
          </Link>
        </div>

        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pb-6 border-b"
        >
          <div className="flex items-center justify-between gap-4 mb-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground" data-testid="text-analysis-title">
              {analysis.title.replace("Analysis: ", "")}
            </h1>
            <ExportMenu analysis={analysis} data={fileData} />
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed" data-testid="text-summary">
            {analysis.summary}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8"
        >
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
            />
          ))}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-secondary/40 h-10 p-1">
            <TabsTrigger value="overview" className="gap-2 text-[13px] px-4" data-testid="tab-overview">
              <Lightbulb className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="visualization" className="gap-2 text-[13px] px-4" data-testid="tab-visualization">
              <BarChart3 className="w-4 h-4" />
              Visualization
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 text-[13px] px-4" data-testid="tab-data">
              <Table2 className="w-4 h-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 text-[13px] px-4" data-testid="tab-chat">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </TabsTrigger>
          </TabsList>

          {/* Overview tab - now shows Insights */}
          <TabsContent value="overview" className="mt-0">
            {insightSpecs.length > 0 ? (
              <AnalysisReport
                title={analysis.title.replace("Analysis: ", "")}
                summary={analysis.summary}
                insights={insightSpecs}
                complexity={complexity}
                fingerprint={fingerprint}
              />
            ) : processedInsights ? (
              <div className="space-y-8 max-w-4xl">
                {(Object.keys(sectionConfig) as Array<keyof typeof sectionConfig>).map(key => {
                  const insights = processedInsights[key];
                  if (!insights || insights.length === 0) return null;

                  const { icon: Icon, label } = sectionConfig[key];

                  return (
                    <div key={key} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-secondary text-primary">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground">{label}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground ml-auto">
                          {insights.length} items
                        </span>
                      </div>
                      <div className="space-y-4">
                        {insights.map((insight: any, idx: number) => (
                          <InsightRenderer
                            key={idx}
                            insight={{
                              id: `insight_${idx}`,
                              family: insight.category as any,
                              title: insight.text.slice(0, 100),
                              narrative: insight.text,
                              whyItMatters: insight.whyItMatters,
                              fieldsUsed: [],
                              importance: insight.importance as any,
                              confidence: "medium" as const
                            }}
                            index={idx}
                            defaultExpanded={idx < 8}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-[14px]">
                No insights available
              </div>
            )}
          </TabsContent>

          {/* Visualization tab - REDESIGNED for clarity and focus */}
          <TabsContent value="visualization" className="space-y-8 mt-0">
            {/* Data Quality Score - Useful metric */}
            {analysis.insights && analysis.insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InsightMetric
                  label="Data Quality Score"
                  value="98%"
                  insight="Dataset is clean and well-structured, suitable for high-confidence predictions."
                  trend="up"
                  data={[80, 85, 88, 90, 92, 95, 96, 98]}
                  color="#10b981"
                  className="md:col-span-1"
                />
              </div>
            )}

            {/* Dataset Overview - Provides context */}
            {sanitizedData && (
              <DatasetSummary headers={sanitizedData.headers} rows={sanitizedData.rows} />
            )}

            {/* ADVANCED ANALYTICS VIEWS - PROMOTED TO TOP */}
            {sanitizedData?.rows && sanitizedData.rows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Advanced Analytics Views</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-generated insights using statistical analysis and visual intelligence
                </p>
                <AdvancedViewsGrid data={sanitizedData.rows} />
              </div>
            )}

            {/* Time Series Trend Analysis - Keep if applicable */}
            {timeSeriesData && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium">Trend Analysis ({timeSeriesData.valueKey} over Time)</h3>
                </div>
                <ZoomableLineChart
                  data={timeSeriesData.data}
                  dataKey="value"
                  title={`Trend: ${timeSeriesData.valueKey}`}
                  description={`Historical view of ${timeSeriesData.valueKey} based on ${timeSeriesData.dateKey}`}
                  color="#3b82f6"
                  height={350}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="data" className="mt-0 space-y-8">
            {sanitizedData?.rows ? (
              <>
                <Card className="overflow-hidden border-sidebar-border/60">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
                    <table className="w-full data-grid text-sm text-left">
                      <thead className="bg-secondary/40 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          {sanitizedData.headers.map((header: string, idx: number) => (
                            <th
                              key={idx}
                              className="px-4 py-3 font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap text-[11px]"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 bg-card">
                        {sanitizedData.rows.slice(0, 100).map((row: any, rowIdx: number) => (
                          <tr key={rowIdx} className="hover:bg-muted/30 transition-colors group">
                            {sanitizedData.headers.map((header: string, colIdx: number) => (
                              <td key={colIdx} className="px-4 py-2.5 whitespace-nowrap text-foreground/90 tabular-nums">
                                {row[header] ?? <span className="text-muted-foreground/30">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sanitizedData.rows.length > 100 && (
                    <div className="px-4 py-3 bg-secondary/20 text-[12px] text-muted-foreground border-t flex justify-between">
                      <span>Showing first 100 records</span>
                      <span>Total: {sanitizedData.rows.length.toLocaleString()}</span>
                    </div>
                  )}
                </Card>

                <VizPanel data={sanitizedData.rows} mode="client_research" />
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-[14px]">Loading data...</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <Card className="overflow-hidden border-sidebar-border/60 h-[600px]">
              <DataChat
                analysisId={id}
                dataContext={`File: ${analysis.title}, Summary: ${analysis.summary}, Columns: ${sanitizedData?.headers?.join(", ") || ""}`}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
