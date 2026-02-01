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
      { label: "Numeric", value: numericCols.length, icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Charts", value: (analysis?.charts?.length || 0) + customCharts.length, icon: <BarChart3 className="w-4 h-4" /> },
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
        <p className="text-muted-foreground text-sm">Analysis not found</p>
        <Link href="/analyses">
          <Button variant="outline" size="sm">
            Back to Analyses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground">
          <Link href="/analyses" className="hover:text-foreground transition-colors" data-testid="link-back-analyses">
            Analyses
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate max-w-[280px]">{analysis.title}</span>
        </div>

        <header className="pb-5 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h1 className="text-lg font-medium" data-testid="text-analysis-title">
                {analysis.title.replace("Analysis: ", "")}
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed" data-testid="text-summary">
                {analysis.summary}
              </p>
            </div>
            <ExportMenu analysis={analysis} data={fileData} />
          </div>
        </header>

        <div className="grid grid-cols-4 gap-3 py-5">
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
            />
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="bg-secondary/40 h-9">
            <TabsTrigger value="overview" className="gap-1.5 text-xs" data-testid="tab-overview">
              <BarChart3 className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs" data-testid="tab-insights">
              <Lightbulb className="w-3.5 h-3.5" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 text-xs" data-testid="tab-data">
              <Table2 className="w-3.5 h-3.5" />
              Data
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 text-xs" data-testid="tab-chat">
              <MessageSquare className="w-3.5 h-3.5" />
              Ask AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
            <div className="grid gap-3 max-w-2xl">
              {analysis.insights?.map((insight: string | { insight: string }, idx: number) => {
                const insightText = typeof insight === "string" ? insight : insight.insight;
                return (
                  <Card
                    key={idx}
                    className="p-3.5"
                    data-testid={`insight-item-${idx}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center shrink-0">
                        <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/85 pt-0.5">
                        {insightText}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            {sanitizedData?.rows ? (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/40 sticky top-0">
                      <tr>
                        {sanitizedData.headers.map((header: string, idx: number) => (
                          <th
                            key={idx}
                            className="px-3 py-2.5 text-left text-xs text-muted-foreground font-medium whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sanitizedData.rows.slice(0, 100).map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-secondary/20 transition-colors">
                          {sanitizedData.headers.map((header: string, colIdx: number) => (
                            <td key={colIdx} className="px-3 py-2 whitespace-nowrap text-sm">
                              {row[header] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sanitizedData.rows.length > 100 && (
                  <div className="px-3 py-2.5 bg-secondary/20 text-xs text-muted-foreground border-t">
                    Showing 100 of {sanitizedData.rows.length} records
                  </div>
                )}
              </Card>
            ) : (
              <div className="flex items-center justify-center h-56 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Loading data...</span>
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
