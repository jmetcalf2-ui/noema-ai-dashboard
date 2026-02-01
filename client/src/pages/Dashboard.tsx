import { useFiles } from "@/hooks/use-files";
import { useAnalyses } from "@/hooks/use-analyses";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, BarChart3, FileText, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: files, isLoading: isLoadingFiles } = useFiles();
  const { data: analyses, isLoading: isLoadingAnalyses } = useAnalyses();

  const isLoading = isLoadingFiles || isLoadingAnalyses;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome to Noema. Upload your data to discover actionable insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-black">
            <CardHeader>
              <CardTitle>Quick Analysis</CardTitle>
              <CardDescription>Upload a spreadsheet to generate instant visualizations</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload />
            </CardContent>
          </Card>

          {/* Recent Analyses Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold tracking-tight">Recent Analyses</h2>
              <Link href="/analyses" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {isLoading ? (
               <div className="flex items-center justify-center py-12">
                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
               </div>
            ) : analyses?.length === 0 ? (
              <div className="text-center py-12 border rounded-xl border-dashed bg-secondary/10">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No analyses yet</p>
                <p className="text-sm text-muted-foreground/70">Upload a file to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyses?.slice(0, 4).map((analysis: any) => (
                  <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                    <div className="group block bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold truncate mb-1">{analysis.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{analysis.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Stats Widget */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Total Files</p>
                <p className="text-3xl font-bold mt-2">{files?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">Analyses</p>
                <p className="text-3xl font-bold mt-2">{analyses?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Files List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Files</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {files?.slice(0, 5).map((file: any) => (
                  <div key={file.id} className="p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {!files?.length && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No files uploaded
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-secondary/20">
                <Link href="/files" className="text-sm font-medium text-primary hover:underline w-full block text-center">
                  Manage all files
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
