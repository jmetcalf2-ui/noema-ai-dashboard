import { useAnalysis } from "@/hooks/use-analyses";
import { useRoute, Link } from "wouter";
import { ChartRenderer } from "@/components/ChartRenderer";
import { DataChat } from "@/components/DataChat";
import { ChartBuilder } from "@/components/ChartBuilder";
import { MetricCard } from "@/components/MetricCard";
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
  MessageSquare,
  Table2,
  Lightbulb,
  ArrowLeft,
  FileSpreadsheet,
  TrendingUp,
  Layers,
  Sparkles,
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

  const handleCustomChart = (config: any) => {
    setCustomCharts((prev) => [...prev, config]);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
            <div className="grid gap-4 max-w-2xl">
              {analysis.insights?.map((insight: string | { insight: string }, idx: number) => {
                const insightText = typeof insight === "string" ? insight : insight.insight;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className="p-4"
                      data-testid={`insight-item-${idx}`}
                    >
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="text-[14px] leading-relaxed text-foreground/90 pt-1">
                          {insightText}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
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
            <div className="max-w-xl">
              <DataChat
                analysisId={id}
                dataContext={`File: ${analysis.title}, Summary: ${analysis.summary}`}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
