import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Filter, Trash2, Download } from 'lucide-react';
import { Document } from '@/types/document';
import { awsDocumentService } from '@/services/awsDocumentService';
import { useToast } from '@/hooks/use-toast';

interface DocumentCategoriesProps {
  onBack: () => void;
}

const DocumentCategories = ({ onBack }: DocumentCategoriesProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await awsDocumentService.getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      toast({
        title: "Error Loading Documents",
        description: "Failed to load documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    try {
      const success = await awsDocumentService.deleteDocument(documentId);
      if (success) {
        await loadDocuments(); // Reload the documents list
        toast({
          title: "Document Deleted",
          description: `${documentName} has been permanently deleted from the system.`,
        });
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete the document. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the document.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (documentId: string, documentName: string, format: 'pdf' | 'docx') => {
    try {
      setDownloadingDoc(documentId);
      const downloadUrl = await awsDocumentService.downloadDocument(documentId, format);
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${documentName.split('.')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Document Downloaded",
        description: `${documentName} has been downloaded in ${format.toUpperCase()} format.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingDoc(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [
    { key: 'all', label: 'All Documents', count: documents.length },
    { key: 'assigned', label: 'Assigned', count: documents.filter(d => d.status === 'assigned').length },
    { key: 'in-progress', label: 'Processing', count: documents.filter(d => d.status === 'in-progress').length },
    { key: 'review', label: 'Under Review', count: documents.filter(d => d.status === 'review').length },
    { key: 'completed', label: 'Completed', count: documents.filter(d => d.status === 'completed').length },
  ];

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === selectedCategory);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading document categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Categories</h2>
          <p className="text-gray-600">Overview of all document statuses and categories</p>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.key}
            className={`cursor-pointer transition-all ${
              selectedCategory === category.key ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedCategory(category.key)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{category.count}</div>
              <div className="text-sm text-gray-600">{category.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>{categories.find(c => c.key === selectedCategory)?.label} ({filteredDocuments.length})</span>
          </CardTitle>
          <CardDescription>
            Documents in the selected category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No documents found in this category</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-500">Client: {doc.clientName}</p>
                      <p className="text-sm text-gray-500">Department: {doc.department}</p>
                      <p className="text-sm text-gray-500">
                        Assigned: {doc.assignedDate} | Deadline: {doc.deadline}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {doc.status === 'completed' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(doc.id, doc.name, 'pdf')}
                          disabled={downloadingDoc === doc.id}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {downloadingDoc === doc.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span className="ml-1">PDF</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDocument(doc.id, doc.name, 'docx')}
                          disabled={downloadingDoc === doc.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {downloadingDoc === doc.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span className="ml-1">Word</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentCategories;
