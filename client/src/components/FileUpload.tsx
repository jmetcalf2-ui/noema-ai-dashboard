import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, Loader2, X, CheckCircle2 } from "lucide-react";
import { useUploadFile } from "@/hooks/use-files";
import { useCreateAnalysis } from "@/hooks/use-analyses";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-3"
      >
        <div className="flex items-center justify-between p-4 border rounded-xl bg-card">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[14px] font-medium truncate">{file.name}</p>
              <p className="text-[12px] text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={isPending}
            className="shrink-0"
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
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadMutation.isPending ? "Uploading..." : "Analyzing..."}</span>
              </motion.div>
            ) : (
              <motion.span
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Analyze
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <label
        className={cn(
          "flex flex-col items-center justify-center py-14 px-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          dragActive
            ? "border-foreground/40 bg-accent/60 scale-[1.01]"
            : "border-border hover:border-muted-foreground/40 hover:bg-accent/40"
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
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
          dragActive ? "bg-foreground/10" : "bg-secondary"
        )}>
          <Upload className={cn(
            "w-5 h-5 transition-colors",
            dragActive ? "text-foreground" : "text-muted-foreground"
          )} />
        </div>
        <p className="text-[15px] text-foreground font-medium">
          Drop your file here
        </p>
        <p className="text-[13px] text-muted-foreground mt-1">
          or click to browse
        </p>
        <div className="flex items-center gap-3 mt-4 text-[12px] text-muted-foreground/70">
          <span className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV, XLS, XLSX
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span>Up to 5MB</span>
        </div>
      </label>
    </div>
  );
}
