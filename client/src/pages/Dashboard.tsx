import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { ArrowRight, Loader2, BarChart3, Clock } from "lucide-react";

export default function Dashboard() {
  const { data: analyses, isLoading } = useAnalyses();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
      <div>
        <h1 className="text-xl font-medium text-foreground">Home</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Upload a spreadsheet and get AI-powered insights.
        </p>
      </div>

      <Card className="p-6">
        <FileUpload />
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/60" />
        </div>
      ) : analyses && analyses.length > 0 ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[15px] font-medium text-foreground">
              Recent Analyses
            </span>
            <Link
              href="/analyses"
              className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              data-testid="link-view-all"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {analyses.slice(0, 4).map((analysis: any) => (
              <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                <div
                  className="flex items-center gap-3.5 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
                  data-testid={`analysis-item-${analysis.id}`}
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate text-foreground">
                      {analysis.title.replace("Analysis: ", "")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {analysis.createdAt ? formatDate(analysis.createdAt) : ""}
                      </span>
                      <span className="text-muted-foreground/40 mx-1">·</span>
                      <span>{analysis.charts?.length || 0} charts</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
