import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { useFiles } from "@/hooks/use-files";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { ArrowRight, BarChart3, Clock, FileText, TrendingUp, Sparkles } from "lucide-react";

export default function Dashboard() {
  const { data: analyses } = useAnalyses();
  const { data: files } = useFiles();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const totalCharts = analyses?.reduce((sum: number, a: any) => sum + (a.charts?.length || 0), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">Welcome back</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Upload data and discover insights with AI.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload Card - Spans 2 columns */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">New Analysis</span>
          </div>
          <FileUpload />
        </Card>

        {/* Stats Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Your Stats</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-2xl font-semibold tabular-nums">{analyses?.length || 0}</p>
              <p className="text-[12px] text-muted-foreground">Analyses</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{files?.length || 0}</p>
              <p className="text-[12px] text-muted-foreground">Files</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{totalCharts}</p>
              <p className="text-[12px] text-muted-foreground">Charts</p>
            </div>
          </div>
        </Card>

        {/* Recent Analyses - Full width */}
        {analyses && analyses.length > 0 && (
          <Card className="lg:col-span-3 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Recent</span>
              </div>
              <Link
                href="/analyses"
                className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                data-testid="link-view-all"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analyses.slice(0, 3).map((analysis: any) => (
                <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                  <div
                    className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
                    data-testid={`analysis-item-${analysis.id}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate text-foreground">
                        {analysis.title.replace("Analysis: ", "")}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {analysis.createdAt ? formatDate(analysis.createdAt) : ""} · {analysis.charts?.length || 0} charts
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
