import { useFiles } from "@/hooks/use-files";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { FileText, MoreVertical, Loader2, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function FilesPage() {
  const { data: files, isLoading, refetch } = useFiles();
  const { toast } = useToast();

  const handleDownload = (url: string, name: string) => {
    // In a real app, this would likely be a secure download link
    // For MVP, we assume fileUrl is accessible or proxied
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-foreground">Files</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Manage your uploaded datasets.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-medium">Upload New File</CardTitle>
          <CardDescription className="text-[13px]">Supported formats: CSV, Excel, JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onUploadComplete={() => refetch()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-medium">Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
             </div>
          ) : files?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-[14px] text-muted-foreground">No files uploaded yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Uploaded</TableHead>
                    <TableHead className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files?.map((file: any) => (
                    <TableRow key={file.id} data-testid={`file-row-${file.id}`}>
                      <TableCell className="text-[14px] font-medium">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {file.fileName}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground uppercase">
                        {file.fileType.split('/')[1] || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownload(file.fileUrl, file.fileName)}
                          data-testid={`button-download-${file.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
