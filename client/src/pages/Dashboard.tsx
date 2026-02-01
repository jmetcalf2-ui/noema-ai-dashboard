import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { useFiles } from "@/hooks/use-files";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  BarChart3, 
  Clock, 
  FileText, 
  TrendingUp, 
  Sparkles,
  Upload,
  FolderOpen,
  Zap
} from "lucide-react";

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
  const latestAnalysis = analyses?.[0];

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-6">
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Welcome Card - Wide */}
        <Card className="md:col-span-2 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h1>
              <p className="text-[14px] text-muted-foreground max-w-sm">
                Upload your data and let AI discover patterns, generate charts, and surface insights.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Quick Stats - Analyses */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums">{analyses?.length || 0}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Analyses</p>
          </div>
        </Card>

        {/* Quick Stats - Charts */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums">{totalCharts}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Charts</p>
          </div>
        </Card>

        {/* Upload Card - Tall, spans 2 rows */}
        <Card className="md:col-span-2 lg:row-span-2 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Upload className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-[14px] font-medium text-foreground">New Analysis</span>
          </div>
          <FileUpload />
        </Card>

        {/* Quick Stats - Files */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums">{files?.length || 0}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Files</p>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Link href="/analyses">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <BarChart3 className="w-4 h-4" />
                View Analyses
              </Button>
            </Link>
            <Link href="/files">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <FolderOpen className="w-4 h-4" />
                Manage Files
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity - Full width */}
        {analyses && analyses.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[14px] font-medium text-foreground">Recent Activity</span>
              </div>
              <Link
                href="/analyses"
                className="text-[13px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                data-testid="link-view-all"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {analyses.slice(0, 4).map((analysis: any) => (
                <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                  <div
                    className="p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
                    data-testid={`analysis-item-${analysis.id}`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-[12px] text-muted-foreground">
                        {analysis.createdAt ? formatDate(analysis.createdAt) : ""}
                      </p>
                    </div>
                    <p className="text-[14px] font-medium text-foreground line-clamp-2">
                      {analysis.title.replace("Analysis: ", "")}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">
                      {analysis.charts?.length || 0} charts
                    </p>
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
