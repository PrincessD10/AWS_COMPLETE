import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, FileText, Image, Download, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { awsDocumentService } from '@/services/awsDocumentService';
import { useAwsAuth } from '@/hooks/useAwsAuth';

interface DocumentUploadProps {
  onBack: () => void;
  userRole: string;
}



const DocumentUpload = ({ onBack, userRole }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();
  

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({
        title: "File Selected",
        description: `${selectedFile.name} is ready for upload`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to submit",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const uploadedDoc = await awsDocumentService.uploadDocument(file, {
        name: file.name,
        priority: priority as 'low' | 'medium' | 'high',
        department: 'General',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      

      setUploadResult(uploadedDoc);
      toast({
        title: "Upload Successful",
        description: `Document "${uploadedDoc.name}" has been uploaded.`,
      });

      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || 'Something went wrong',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">DocuTrack Pro</span>
            </div>
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Document</h1>
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Upload PDF, Word, or image files</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  className="cursor-pointer mt-2"
                />
              </div>

              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              )}

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the document or any special processing requirements..."
                  rows={3}
                />
              </div>

              {userRole !== 'user' && (
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              )}

              <Button
                type="submit"
                disabled={!file || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? "Uploading..." : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Document
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {uploadResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600 inline-block mr-2" />
            <span className="text-green-700">
              Document "<strong>{uploadResult.name}</strong>" uploaded successfully.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
