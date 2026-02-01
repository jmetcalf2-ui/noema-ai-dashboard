import { useAnalysis } from "@/hooks/use-analyses";
import { useRoute, Link } from "wouter";
import { ChartRenderer } from "@/components/ChartRenderer";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalysisDetail() {
  const [, params] = useRoute("/analyses/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: analysis, isLoading, error } = useAnalysis(id);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Analysis not found</p>
        <Link href="/analyses">
          <Button variant="outline" size="sm">Back to Analyses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back link */}
      <Link 
        href="/analyses" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        data-testid="link-back-analyses"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-analysis-title">
          {analysis.title}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : 'Unknown date'}
        </p>
      </div>

      {/* Executive Summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Executive Summary
        </h2>
        <p className="text-base leading-relaxed" data-testid="text-summary">
          {analysis.summary}
        </p>
      </section>

      {/* Charts */}
      {analysis.charts && analysis.charts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Visualizations
          </h2>
          <div className="space-y-8">
            {analysis.charts.map((chartConfig: any, idx: number) => (
              <ChartRenderer key={idx} config={chartConfig} />
            ))}
          </div>
        </section>
      )}

      {/* Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Key Insights
          </h2>
          <div className="space-y-3">
            {analysis.insights.map((insight: string | { insight: string }, idx: number) => {
              const insightText = typeof insight === 'string' ? insight : insight.insight;
              return (
                <div 
                  key={idx} 
                  className="flex gap-3 p-4 rounded-lg border bg-card"
                  data-testid={`insight-item-${idx}`}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{insightText}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
