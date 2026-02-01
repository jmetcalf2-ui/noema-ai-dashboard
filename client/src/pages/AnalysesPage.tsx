import { useAnalyses, useCreateAnalysis, useDeleteAnalysis } from "@/hooks/use-analyses";
import { useFiles } from "@/hooks/use-files";
import { Link } from "wouter";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  BarChart3, 
  Search,
  ArrowUpRight
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function AnalysesPage() {
  const { data: analyses, isLoading } = useAnalyses();
  const { data: files } = useFiles();
  const createAnalysis = useCreateAnalysis();
  const deleteAnalysis = useDeleteAnalysis();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyses</h1>
          <p className="text-muted-foreground mt-1">
            Explore insights generated from your data.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filteredAnalyses?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-secondary/5">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No analyses found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try a different search term" : "Create your first analysis to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnalyses?.map((analysis: any) => (
            <Link key={analysis.id} href={`/analyses/${analysis.id}`}>
              <div className="group relative bg-card rounded-xl border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDelete(e, analysis.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                    AI Generated
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {analysis.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                  {analysis.summary}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t mt-auto">
                  <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-primary font-medium">
                    View Report <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
