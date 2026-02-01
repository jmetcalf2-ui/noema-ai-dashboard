import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, BarChart3, FileSpreadsheet } from "lucide-react";

export default function Dashboard() {
  const { data: analyses, isLoading } = useAnalyses();

  return (
    <div className="min-h-[85vh] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-10">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-medium">
              Analyze your data
            </h1>
            <p className="text-muted-foreground text-sm">
              Upload a CSV or Excel file to generate charts and insights
            </p>
          </div>

          <FileUpload />

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : analyses && analyses.length > 0 ? (
            <div className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">Recent</span>
                <Link
                  href="/analyses"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  data-testid="link-view-all"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {analyses.slice(0, 4).map((analysis: any) => (
                  <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                    <Card
                      className="p-3.5 hover:bg-secondary/40 transition-colors cursor-pointer"
                      data-testid={`analysis-item-${analysis.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            {analysis.title.replace("Analysis: ", "")}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
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
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
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
