import { useCallback, useState } from "react";
import { Upload, File, Loader2, X } from "lucide-react";
import { useUploadFile } from "@/hooks/use-files";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function FileUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const uploadMutation = useUploadFile();
  const { toast } = useToast();

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

    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadMutation.mutateAsync(formData);
      toast({
        title: "Success",
        description: "File uploaded successfully.",
      });
      setFile(null);
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-out text-center cursor-pointer overflow-hidden",
          dragActive 
            ? "border-primary bg-primary/5 scale-[1.01]" 
            : "border-border hover:border-primary/50 hover:bg-secondary/30",
          file ? "border-solid border-primary/20 bg-card shadow-sm" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          onChange={handleChange}
          accept=".csv,.xlsx,.xls,.json"
          disabled={uploadMutation.isPending || !!file}
        />

        <div className="relative z-10 flex flex-col items-center justify-center gap-4">
          {file ? (
            <div className="w-full">
              <div className="flex items-center justify-between bg-secondary/50 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors z-30"
                  disabled={uploadMutation.isPending}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent input click
                  handleUpload();
                }}
                disabled={uploadMutation.isPending}
                className={cn(
                  "w-full py-2.5 rounded-lg font-medium transition-all duration-200 z-30 relative",
                  uploadMutation.isPending
                    ? "bg-secondary text-muted-foreground cursor-wait"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
                )}
              >
                {uploadMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  "Upload & Analyze"
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">Upload Data File</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop CSV or Excel file, or click to browse
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
