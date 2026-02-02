import { useAnalysis } from "@/hooks/use-analyses";
import { useRoute, Link } from "wouter";
import { ChartRenderer } from "@/components/ChartRenderer";
import { DataChat } from "@/components/DataChat";
import { ChartBuilder } from "@/components/ChartBuilder";
import { MetricCard } from "@/components/MetricCard";
import { DatasetSummary } from "@/components/DatasetSummary";
import { InsightCard, categorizeInsight, groupInsights } from "@/components/InsightCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ExportMenu } from "@/components/ExportMenu";
import { motion } from "framer-motion";
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
} from "lucide-react";

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

  // Process insights with categorization
  const processedInsights = useMemo(() => {
    if (!analysis?.insights) return null;

    const processed = analysis.insights.map((insight: string | { insight: string }) => {
      const text = typeof insight === "string" ? insight : insight.insight;
      const { category, importance, whyItMatters } = categorizeInsight(text);
      return { text, category, importance, whyItMatters };
    });

    return groupInsights(processed);
  }, [analysis?.insights]);

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
    <div className="min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-8">
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
            <h1 className="text-xl font-medium" data-testid="text-analysis-title">
              {analysis.title.replace("Analysis: ", "")}
            </h1>
            <ExportMenu analysis={analysis} data={fileData} />
          </div>
          <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed" data-testid="text-summary">
            {analysis.summary}
          </p>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6"
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50 h-10 p-1">
            <TabsTrigger value="overview" className="gap-2 text-[13px] px-4" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2 text-[13px] px-4" data-testid="tab-insights">
              <Lightbulb className="w-4 h-4" />
              Insights
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

          <TabsContent value="overview" className="space-y-6 mt-0">
            {sanitizedData && (
              <DatasetSummary headers={sanitizedData.headers} rows={sanitizedData.rows} />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysis.charts?.map((chartConfig: any, idx: number) => (
                <ChartRenderer key={`original-${idx}`} config={chartConfig} />
              ))}
              {customCharts.map((chartConfig, idx) => (
                <ChartRenderer key={`custom-${idx}`} config={chartConfig} />
              ))}
            </div>

            {sanitizedData?.rows && sanitizedData.rows.length > 0 && (
              <ChartBuilder data={sanitizedData.rows} onChartCreate={handleCustomChart} />
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            {processedInsights ? (
              <div className="space-y-8 max-w-2xl">
                {(Object.keys(sectionConfig) as Array<keyof typeof sectionConfig>).map(key => {
                  const insights = processedInsights[key];
                  if (!insights || insights.length === 0) return null;
                  
                  const { icon: Icon, label } = sectionConfig[key];
                  
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-[13px] font-medium text-muted-foreground">{label}</h3>
                        <span className="text-[11px] text-muted-foreground/60 ml-auto">{insights.length}</span>
                      </div>
                      <div className="space-y-3">
                        {insights.map((insight: any, idx: number) => (
                          <InsightCard
                            key={idx}
                            insight={insight.text}
                            category={insight.category}
                            importance={insight.importance}
                            whyItMatters={insight.whyItMatters}
                            index={idx}
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

          <TabsContent value="data" className="mt-0">
            {sanitizedData?.rows ? (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table className="w-full data-grid">
                    <thead className="bg-secondary/50 sticky top-0 z-10">
                      <tr>
                        {sanitizedData.headers.map((header: string, idx: number) => (
                          <th
                            key={idx}
                            className="px-4 py-3 text-left text-[11px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap border-b"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {sanitizedData.rows.slice(0, 100).map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-accent/30 transition-colors">
                          {sanitizedData.headers.map((header: string, colIdx: number) => (
                            <td key={colIdx} className="px-4 py-2.5 whitespace-nowrap text-[13px] tabular-nums">
                              {row[header] ?? <span className="text-muted-foreground/50">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sanitizedData.rows.length > 100 && (
                  <div className="px-4 py-3 bg-secondary/30 text-[12px] text-muted-foreground border-t">
                    Showing 100 of {sanitizedData.rows.length.toLocaleString()} records
                  </div>
                )}
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-[14px]">Loading data...</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <Card className="overflow-hidden">
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
