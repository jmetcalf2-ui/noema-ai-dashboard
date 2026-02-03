import { useAnalyses, useCreateAnalysis, useDeleteAnalysis } from "@/hooks/use-analyses";
import { useFiles } from "@/hooks/use-files";
import { Link } from "wouter";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  BarChart3, 
  Search,
  MoreHorizontal,
  FolderPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { AddToProjectModal } from "@/components/AddToProjectModal";

export default function AnalysesPage() {
  const { data: analyses, isLoading } = useAnalyses();
  const { data: files } = useFiles();
  const createAnalysis = useCreateAnalysis();
  const deleteAnalysis = useDeleteAnalysis();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedAnalysisForProject, setSelectedAnalysisForProject] = useState<{id: number; title: string} | null>(null);

  const handleCreate = async () => {
    if (!selectedFileId) return;
    
    try {
      await createAnalysis.mutateAsync({ fileId: parseInt(selectedFileId) });
      setIsDialogOpen(false);
      toast({
        title: "Analysis Started",
        description: "Your file is being processed. This may take a moment.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis?")) return;

    try {
      await deleteAnalysis.mutateAsync(id);
      toast({ title: "Analysis deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const filteredAnalyses = analyses?.filter((a: any) => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-foreground">Analyses</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Explore insights generated from your data.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-analysis">
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Analysis</DialogTitle>
              <DialogDescription>
                Select a file to analyze. Our AI will extract insights and generate charts.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select onValueChange={setSelectedFileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a file..." />
                </SelectTrigger>
                <SelectContent>
                  {files?.map((file: any) => (
                    <SelectItem key={file.id} value={file.id.toString()}>
                      {file.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleCreate} 
                disabled={!selectedFileId || createAnalysis.isPending}
              >
                {createAnalysis.isPending ? "Processing..." : "Start Analysis"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search analyses..." 
          className="pl-9 max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAnalyses?.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-foreground">No analyses found</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            {searchTerm ? "Try a different search term" : "Create your first analysis to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalyses?.map((analysis: any) => (
            <div key={analysis.id} className="relative">
              <Link href={`/analyses/${analysis.id}`}>
                <div 
                  className="group bg-card rounded-lg border p-5 hover:bg-accent/50 transition-colors cursor-pointer h-full flex flex-col"
                  data-testid={`analysis-card-${analysis.id}`}
                >
                  <h3 className="text-[15px] font-medium text-foreground mb-1.5 pr-8">
                    {analysis.title.replace("Analysis: ", "")}
                  </h3>
                  <p className="text-[13px] text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {analysis.summary}
                  </p>

                  <div className="flex items-center justify-between text-[12px] text-muted-foreground pt-3 border-t">
                    <span>{new Date(analysis.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="flex items-center gap-1">
                      {analysis.charts?.length || 0} charts
                    </span>
                  </div>
                </div>
              </Link>
              
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      data-testid={`analysis-menu-${analysis.id}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedAnalysisForProject({ id: analysis.id, title: analysis.title.replace("Analysis: ", "") });
                        setProjectModalOpen(true);
                      }}
                      data-testid={`add-to-project-${analysis.id}`}
                    >
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Add to Project
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete({ preventDefault: () => {}, stopPropagation: () => {} } as any, analysis.id)}
                      className="text-destructive"
                      data-testid={`button-delete-${analysis.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAnalysisForProject && (
        <AddToProjectModal
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
          analysisId={selectedAnalysisForProject.id}
          analysisTitle={selectedAnalysisForProject.title}
        />
      )}
    </div>
  );
}
