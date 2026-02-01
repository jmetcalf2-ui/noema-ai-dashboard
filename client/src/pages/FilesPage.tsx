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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Files</h1>
          <p className="text-muted-foreground mt-1">
            Manage your uploaded datasets and view their status.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New File</CardTitle>
          <CardDescription>Supported formats: CSV, Excel, JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload onUploadComplete={() => refetch()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center py-12">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : files?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No files uploaded yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files?.map((file: any) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          {file.fileName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground uppercase text-xs">
                        {file.fileType.split('/')[1] || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownload(file.fileUrl, file.fileName)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
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
