import { useCallback, useState } from "react";
import { Upload, File, Loader2, X } from "lucide-react";
import { useUploadFile } from "@/hooks/use-files";
import { useCreateAnalysis } from "@/hooks/use-analyses";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function FileUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const uploadMutation = useUploadFile();
  const analyzeMutation = useCreateAnalysis();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadedFile = await uploadMutation.mutateAsync(formData);
      
      toast({
        title: "File uploaded",
        description: "Analyzing your data...",
      });
      
      const analysis = await analyzeMutation.mutateAsync({ fileId: uploadedFile.id });
      
      toast({
        title: "Analysis complete",
        description: "Redirecting to results...",
      });
      
      setFile(null);
      onUploadComplete?.();
      setLocation(`/analyses/${analysis.id}`);
    } catch (error: any) {
      console.error("Upload/Analysis error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setFile(null);
  };

  const isPending = uploadMutation.isPending || analyzeMutation.isPending;

  if (file) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <File className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={isPending}
            data-testid="button-clear-file"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={handleUpload}
          disabled={isPending}
          className="w-full"
          data-testid="button-upload-analyze"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadMutation.isPending ? "Uploading..." : "Analyzing..."}
            </>
          ) : (
            "Analyze"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        className={cn(
          "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/30"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        data-testid="file-upload-area"
      >
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".csv,.xlsx,.xls"
          data-testid="file-input"
        />
        <Upload className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Drop a file here or click to browse
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          CSV, Excel files up to 5MB
        </p>
      </label>
    </div>
  );
}
