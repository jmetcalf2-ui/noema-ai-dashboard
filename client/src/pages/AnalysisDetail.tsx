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
import {
  Loader2,
  BarChart3,
  MessageSquare,
  Table2,
  Lightbulb,
  ChevronRight,
  FileSpreadsheet,
  TrendingUp,
  Layers,
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

  const metrics = useMemo(() => {
    if (!fileData?.rows) return [];
    const rows = fileData.rows;
    const headers = fileData.headers;
    
    const numericCols = headers.filter((h: string) => 
      rows.some((r: any) => typeof r[h] === "number" && !isNaN(r[h]))
    );

    return [
      { label: "Total Records", value: rows.length, icon: <Layers className="w-5 h-5" /> },
      { label: "Data Columns", value: headers.length, icon: <FileSpreadsheet className="w-5 h-5" /> },
      { label: "Numeric Fields", value: numericCols.length, icon: <TrendingUp className="w-5 h-5" /> },
      { label: "Charts Generated", value: (analysis?.charts?.length || 0) + customCharts.length, icon: <BarChart3 className="w-5 h-5" /> },
    ];
  }, [fileData, analysis, customCharts]);

  const handleCustomChart = (config: any) => {
    setCustomCharts((prev) => [...prev, config]);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Analysis not found</p>
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
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Link href="/analyses" className="hover:text-foreground transition-colors" data-testid="link-back-analyses">
            Analyses
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground truncate max-w-[300px]">{analysis.title}</span>
        </div>

        <header className="pb-6 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h1 className="text-xl font-semibold tracking-tight" data-testid="text-analysis-title">
                {analysis.title.replace("Analysis: ", "")}
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed" data-testid="text-summary">
                {analysis.summary}
              </p>
            </div>
            <ExportMenu analysis={analysis} data={fileData} />
          </div>
        </header>

        <div className="grid grid-cols-4 gap-4 py-6">
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
            />
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <BarChart3 className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2" data-testid="tab-insights">
              <Lightbulb className="w-3.5 h-3.5" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2" data-testid="tab-data">
              <Table2 className="w-3.5 h-3.5" />
              Data
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2" data-testid="tab-chat">
              <MessageSquare className="w-3.5 h-3.5" />
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

            {fileData?.rows && (
              <ChartBuilder data={fileData.rows} onChartCreate={handleCustomChart} />
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <div className="grid gap-4 max-w-3xl">
              {analysis.insights?.map((insight: string | { insight: string }, idx: number) => {
                const insightText = typeof insight === "string" ? insight : insight.insight;
                return (
                  <Card
                    key={idx}
                    className="p-4 hover:shadow-sm transition-shadow"
                    data-testid={`insight-item-${idx}`}
                  >
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed text-foreground/90">
                          {insightText}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            {fileData?.rows ? (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 sticky top-0">
                      <tr>
                        {fileData.headers.map((header: string, idx: number) => (
                          <th
                            key={idx}
                            className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fileData.rows.slice(0, 100).map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-secondary/30 transition-colors">
                          {fileData.headers.map((header: string, colIdx: number) => (
                            <td key={colIdx} className="px-4 py-2.5 whitespace-nowrap">
                              {row[header] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {fileData.rows.length > 100 && (
                  <div className="px-4 py-3 bg-secondary/30 text-sm text-muted-foreground border-t">
                    Showing 100 of {fileData.rows.length} records
                  </div>
                )}
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading data...
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <div className="max-w-2xl">
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
