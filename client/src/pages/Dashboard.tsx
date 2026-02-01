import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { useFiles } from "@/hooks/use-files";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  BarChart3, 
  Clock, 
  FileText, 
  TrendingUp, 
  Upload,
  FolderOpen
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

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-medium text-foreground">Welcome back</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Upload data to generate insights automatically.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-semibold tabular-nums">{analyses?.length || 0}</p>
              <p className="text-[12px] text-muted-foreground">Analyses</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-semibold tabular-nums">{totalCharts}</p>
              <p className="text-[12px] text-muted-foreground">Charts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-semibold tabular-nums">{files?.length || 0}</p>
              <p className="text-[12px] text-muted-foreground">Files</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-muted-foreground" />
          <span className="text-[13px] font-medium text-muted-foreground">New Analysis</span>
        </div>
        <FileUpload />
      </Card>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link href="/analyses" className="flex-1">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" data-testid="button-view-analyses">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-[14px]">View Analyses</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </div>
          </Card>
        </Link>
        <Link href="/files" className="flex-1">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" data-testid="button-manage-files">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-[14px]">Manage Files</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      {analyses && analyses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-[13px] font-medium text-muted-foreground">Recent</span>
            </div>
            <Link
              href="/analyses"
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-view-all"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {analyses.slice(0, 3).map((analysis: any) => (
              <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                <Card
                  className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  data-testid={`analysis-item-${analysis.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-foreground">
                          {analysis.title.replace("Analysis: ", "")}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {analysis.charts?.length || 0} charts
                        </p>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      {analysis.createdAt ? formatDate(analysis.createdAt) : ""}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
