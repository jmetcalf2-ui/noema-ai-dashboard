import { FileUpload } from "@/components/FileUpload";
import { useAnalyses } from "@/hooks/use-analyses";
import { Link } from "wouter";
import { ArrowRight, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: analyses, isLoading } = useAnalyses();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-medium tracking-tight">
            What would you like to analyze?
          </h1>
          <p className="text-muted-foreground">
            Upload a CSV or Excel file to get started
          </p>
        </div>

        <FileUpload />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : analyses && analyses.length > 0 ? (
          <div className="pt-8 border-t">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Recent analyses</p>
              <Link
                href="/analyses"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                data-testid="link-view-all"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {analyses.slice(0, 5).map((analysis: any) => (
                <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
                  <div
                    className="p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    data-testid={`analysis-item-${analysis.id}`}
                  >
                    <p className="font-medium text-sm">{analysis.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {analysis.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
