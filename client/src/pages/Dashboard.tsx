import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { useFiles } from "@/hooks/use-files";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import {
  ArrowRight,
  BarChart3,
  FileText,
  TrendingUp,
  Upload,
  FolderOpen,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Fake trends for visual demo (replace with real data if available)
  const analysisTrend = [10, 15, 12, 18, 20, 25, 22, 28, 30, 35];
  const chartTrend = [5, 8, 12, 10, 15, 20, 25, 23, 28, 32];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Analyses"
            value={analyses?.length || 0}
            change={12.5}
            changeLabel="vs last month"
            icon={<BarChart3 className="w-4 h-4" />}
            trend={analysisTrend}
          />
          <StatCard
            label="Total Charts Generated"
            value={totalCharts}
            change={8.2}
            changeLabel="vs last month"
            icon={<TrendingUp className="w-4 h-4" />}
            trend={chartTrend}
          />
          <StatCard
            label="Source Files"
            value={files?.length || 0}
            change={-2.1}
            changeLabel="vs last month"
            icon={<FileText className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Action Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/5 text-primary">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">New Analysis</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Upload a dataset to generate new insights and visualizations.
                      </p>
                      <Link href="/files">
                        <Button size="sm" className="w-full sm:w-auto shadow-sm">
                          <Plus className="w-4 h-4 mr-2" /> Start Analysis
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Link href="/analyses">
                  <Card className="p-4 hover:shadow-md transition-all cursor-pointer group border border-border/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="font-medium text-sm">Browse Analysis</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Card>
                </Link>
                <Link href="/files">
                  <Card className="p-4 hover:shadow-md transition-all cursor-pointer group border border-border/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="font-medium text-sm">Manage Files</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Analysis Table-ish view */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
              <Link href="/analyses" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                View all history
              </Link>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
              {analyses && analyses.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {analyses.slice(0, 5).map((analysis: any) => (
                    <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-md bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
                            <BarChart3 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {analysis.title.replace("Analysis: ", "")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {analysis.charts?.length || 0} visualizations generated
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDate(analysis.createdAt)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent activity. Start a new analysis to see it here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Extra Info */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Pro Tip</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground">
                Upload CSV files with clear headers for the best results. The AI works best with structured tabular data.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Database
                </span>
                <span className="text-emerald-600 font-medium text-xs">Healthy</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  AI Inference
                </span>
                <span className="text-emerald-600 font-medium text-xs">Operational</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Storage
                </span>
                <span className="text-emerald-600 font-medium text-xs">98% Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
