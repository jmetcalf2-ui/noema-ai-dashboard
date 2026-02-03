import { useRoute, Link } from "wouter";
import { useProject, useProjectAnalyses, useRemoveAnalysisFromProject, useGenerateProjectInsights } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, BarChart3, Trash2, Lightbulb, FileText, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { StatCard } from "@/components/StatCard";
import { ZoomableLineChart } from "@/components/charts/ZoomableLineChart";
import { useMemo } from "react";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = parseInt(params?.id || "0");

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: analyses, isLoading: analysesLoading } = useProjectAnalyses(projectId);
  const removeAnalysis = useRemoveAnalysisFromProject();
  const generateInsights = useGenerateProjectInsights();

  const handleRemoveAnalysis = async (analysisId: number) => {
    await removeAnalysis.mutateAsync({ projectId, analysisId });
  };

  const handleGenerateInsights = async () => {
    await generateInsights.mutateAsync(projectId);
  };

  // Aggregated Statistics
  const stats = useMemo(() => {
    if (!analyses) return null;
    const totalAnalyses = analyses.length;
    // Mock metric for demonstration - assuming each analysis might have some "insights" count
    const totalInsights = analyses.reduce((sum, a) => sum + (a.insights?.length || 0), 0);

    // Safety check for dates
    const timestamps = analyses
      .map(a => a.createdAt ? new Date(a.createdAt).getTime() : 0)
      .filter(t => t > 0);

    const lastActivity = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

    return { totalAnalyses, totalInsights, lastActivity };
  }, [analyses]);

  // Timeline Data for Chart
  const timelineData = useMemo(() => {
    if (!analyses || analyses.length === 0) return [];

    // Group analyses by date
    const timeline = analyses.reduce((acc: any, curr) => {
      const date = format(new Date(curr.createdAt), "yyyy-MM-dd");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and sort
    return Object.entries(timeline).map(([date, count]) => ({
      date,
      value: Number(count)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [analyses]);


  if (projectLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Project not found</p>
              <Link href="/projects">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasInsights = project.summary && project.insights && (project.insights as string[]).length > 0;

  return (
    <div className="p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link href="/projects">
              <Button variant="ghost" size="icon" className="mt-0.5 text-muted-foreground hover:text-foreground" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight" data-testid="project-title">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/80">
                <Calendar className="w-3.5 h-3.5" />
                Created {project.createdAt ? format(new Date(project.createdAt), "MMMM d, yyyy") : "Unknown"}
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending || !analyses || analyses.length === 0}
            data-testid="button-generate-insights"
            variant="default"
            size="sm"
            className="shadow-sm"
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {hasInsights ? "Refresh Insights" : "Generate Cross-Project Insights"}
              </>
            )}
          </Button>
        </div>

        {/* Project Dashboard - Stats & Timeline */}
        {analyses && analyses.length > 0 && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">At a Glance</h3>
              <StatCard
                label="Total Analyses"
                value={stats.totalAnalyses}
                change={0}
                icon={<FileText className="w-4 h-4" />}
                className="bg-card/50"
              />
              <StatCard
                label="Total Insights Found"
                value={stats.totalInsights}
                change={0}
                icon={<Lightbulb className="w-4 h-4" />}
                className="bg-card/50"
              />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activity Timeline</h3>
              <ZoomableLineChart
                data={timelineData}
                title="Analysis Activity"
                description="Frequency of analyses added to this project over time"
                color="#6366f1"
                height={280}
                dataKey="value"
              />
            </div>
          </div>
        )}

        {/* AI Analysis Section */}
        {hasInsights && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI Synthesis</h3>
            <Card className="border-l-4 border-l-purple-500 bg-purple-500/5">
              <CardHeader className="pb-3 border-b border-purple-500/10">
                <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  Cross-Analysis Synthesis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2">
                    Executive Summary
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed" data-testid="project-summary">
                    {project.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3">
                    Key Drivers & Patterns
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(project.insights as string[])?.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground" data-testid={`insight-${index}`}>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analyses List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-medium tracking-tight">
              Analyses
              {analyses && analyses.length > 0 && (
                <span className="ml-2 text-sm text-muted-foreground font-normal">
                  ({analyses.length})
                </span>
              )}
            </h2>
            <Link href="/analyses">
              <Button variant="outline" size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Add New Analysis
              </Button>
            </Link>
          </div>

          {analysesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : analyses && analyses.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground">No analyses yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Start by creating analyses from your datasets, then group them here for unified insights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyses?.map((analysis) => (
                <Card key={analysis.id} className="hover:border-primary/50 transition-colors group cursor-pointer hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/analyses/${analysis.id}`} className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="font-medium text-foreground truncate heading-font" data-testid={`analysis-title-${analysis.id}`}>
                              {analysis.title?.replace("Analysis: ", "") || "Untitled Analysis"}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {analysis.summary || "No summary available."}
                            </p>
                            <div className="flex items-center gap-2 pt-2">
                              <Badge variant="secondary" className="text-[10px] h-5">
                                Analysis
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {analysis.createdAt ? format(new Date(analysis.createdAt), "MMM d, yyyy") : "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAnalysis(analysis.id)}
                        disabled={removeAnalysis.isPending}
                        className="text-muted-foreground hover:text-destructive -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from project"
                        data-testid={`remove-analysis-${analysis.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
