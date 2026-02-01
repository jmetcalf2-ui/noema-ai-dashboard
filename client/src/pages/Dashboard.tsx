import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, BarChart3, Clock, FileSpreadsheet } from "lucide-react";

export default function Dashboard() {
  const { data: analyses, isLoading } = useAnalyses();

  return (
    <div className="min-h-[85vh] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Analyze your data
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Upload a CSV or Excel file to automatically generate charts, insights, and executive summaries
            </p>
          </div>

          <FileUpload />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : analyses && analyses.length > 0 ? (
            <div className="pt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Recent analyses</span>
                </div>
                <Link
                  href="/analyses"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  data-testid="link-view-all"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {analyses.slice(0, 5).map((analysis: any) => (
                  <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                    <Card
                      className="p-4 hover:shadow-sm transition-all cursor-pointer group"
                      data-testid={`analysis-item-${analysis.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {analysis.title.replace("Analysis: ", "")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {analysis.summary}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileSpreadsheet className="w-3 h-3" />
                              {analysis.charts?.length || 0} charts
                            </span>
                            <span>
                              {analysis.createdAt
                                ? new Date(analysis.createdAt).toLocaleDateString()
                                : ""}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
