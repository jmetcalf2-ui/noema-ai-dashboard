import { useAnalysis } from "@/hooks/use-analyses";
import { useRoute, Link } from "wouter";
import { ChartRenderer } from "@/components/ChartRenderer";
import { 
  ArrowLeft, 
  Loader2, 
  Lightbulb, 
  Calendar,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AnalysisDetail() {
  const [, params] = useRoute("/analyses/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: analysis, isLoading, error } = useAnalysis(id);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Analysis Not Found</h2>
        <Link href="/analyses">
          <Button>Return to List</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="space-y-6">
        <Link href="/analyses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Analyses
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{analysis.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> 
                {new Date(analysis.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="secondary" className="font-normal">AI Analysis</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" /> Share Report
          </Button>
        </div>

        <div className="bg-secondary/30 p-6 rounded-2xl border backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Executive Summary</h3>
          <p className="text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </div>
      </div>

      {/* Key Insights */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-semibold">Key Insights</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {analysis.insights.map((insight: string, idx: number) => (
            <div 
              key={idx} 
              className="p-5 rounded-xl border bg-card hover:bg-secondary/20 transition-colors flex gap-4"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visualizations */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Visualizations</h2>
        <div className="grid grid-cols-1 gap-8">
          {analysis.charts.map((chartConfig: any, idx: number) => (
            <ChartRenderer key={idx} config={chartConfig} />
          ))}
        </div>
      </section>
    </div>
  );
}
