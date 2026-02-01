import { useRoute, Link } from "wouter";
import { useProject, useProjectAnalyses, useRemoveAnalysisFromProject, useGenerateProjectInsights } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, BarChart3, Trash2, Lightbulb, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link href="/projects">
              <Button variant="ghost" size="icon" className="mt-0.5" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="project-title">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {project.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Created {project.createdAt ? format(new Date(project.createdAt), "MMM d, yyyy") : "Unknown"}
              </p>
            </div>
          </div>

          <Button 
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending || !analyses || analyses.length === 0}
            data-testid="button-generate-insights"
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {hasInsights ? "Regenerate Insights" : "Generate Insights"}
              </>
            )}
          </Button>
        </div>

        {hasInsights && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Cross-Analysis Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Summary
                </h4>
                <p className="text-sm text-foreground" data-testid="project-summary">
                  {project.summary}
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Key Insights
                </h4>
                <ul className="space-y-2">
                  {(project.insights as string[])?.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span data-testid={`insight-${index}`}>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">
              Analyses in Project
              {analyses && analyses.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {analyses.length}
                </Badge>
              )}
            </h2>
          </div>

          {analysesLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : analyses && analyses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  No analyses in this project yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Go to Analyses and use the menu to add analyses to this project
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {analyses?.map((analysis) => (
                <Card key={analysis.id} className="hover-elevate transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/analyses/${analysis.id}`} className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground truncate text-sm" data-testid={`analysis-title-${analysis.id}`}>
                              {analysis.title?.replace("Analysis: ", "") || "Untitled Analysis"}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {analysis.summary?.slice(0, 100)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {analysis.createdAt ? format(new Date(analysis.createdAt), "MMM d, yyyy") : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </Link>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAnalysis(analysis.id)}
                        disabled={removeAnalysis.isPending}
                        className="text-muted-foreground hover:text-destructive"
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
