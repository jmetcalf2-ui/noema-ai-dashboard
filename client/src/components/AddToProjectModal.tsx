import { useState } from "react";
import { useProjects, useCreateProject, useAddAnalysisToProject } from "@/hooks/use-projects";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FolderOpen, Plus, Loader2 } from "lucide-react";

interface AddToProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: number;
  analysisTitle: string;
}

export function AddToProjectModal({ open, onOpenChange, analysisId, analysisTitle }: AddToProjectModalProps) {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const addToProject = useAddAnalysisToProject();
  
  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");

  const handleSubmit = async () => {
    if (mode === "create") {
      if (!newProjectName.trim()) return;
      
      const newProject = await createProject.mutateAsync({
        name: newProjectName.trim(),
      });
      
      await addToProject.mutateAsync({
        projectId: newProject.id,
        analysisId,
      });
    } else {
      if (!selectedProjectId) return;
      
      await addToProject.mutateAsync({
        projectId: parseInt(selectedProjectId),
        analysisId,
      });
    }
    
    setSelectedProjectId("");
    setNewProjectName("");
    setMode("select");
    onOpenChange(false);
  };

  const isPending = createProject.isPending || addToProject.isPending;
  const canSubmit = mode === "create" ? newProjectName.trim() : selectedProjectId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Project</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Add "{analysisTitle}" to a project for cross-analysis insights.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {projects && projects.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Choose a project</Label>
                  <RadioGroup 
                    value={selectedProjectId} 
                    onValueChange={(v) => {
                      setSelectedProjectId(v);
                      setMode("select");
                    }}
                  >
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value={String(project.id)} id={`project-${project.id}`} />
                        <Label htmlFor={`project-${project.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{project.name}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {projects && projects.length > 0 && (
                    <div className="h-px flex-1 bg-border" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {projects && projects.length > 0 ? "Or create new" : "Create a project"}
                  </span>
                  {projects && projects.length > 0 && (
                    <div className="h-px flex-1 bg-border" />
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);
                      if (e.target.value) {
                        setMode("create");
                        setSelectedProjectId("");
                      }
                    }}
                    placeholder="New project name..."
                    data-testid="input-new-project-name"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || isPending}
            data-testid="button-add-to-project"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {mode === "create" ? "Create & Add" : "Add to Project"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
