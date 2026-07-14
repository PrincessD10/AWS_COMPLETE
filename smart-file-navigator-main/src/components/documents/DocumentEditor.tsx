
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Upload, History, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/types/document';
import { awsDocumentService } from '@/services/awsDocumentService';

interface DocumentEditorProps {
  documentId: string;
  onBack: () => void;
}

const DocumentEditor = ({ documentId, onBack }: DocumentEditorProps) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      const doc = await awsDocumentService.loadDocument(documentId);
      if (doc) {
        setDocument(doc);
        setEditedContent(doc.content);
      } else {
        toast({
          title: "Document Not Found",
          description: "The requested document could not be loaded.",
          variant: "destructive"
        });
        onBack();
      }
    } catch (error) {
      toast({
        title: "Error Loading Document",
        description: "Failed to load the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewVersion = async () => {
    if (!document || editedContent === document.content) {
      toast({
        title: "No Changes",
        description: "No changes have been made to save.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const success = await awsDocumentService.createNewVersion(
        document.id,
        editedContent,
        versionNotes || 'Updated content'
      );

      if (success) {
        toast({
          title: "Version Saved",
          description: "New version has been created successfully.",
        });
        setVersionNotes('');
        // Reload document to get updated version info
        await loadDocument();
      } else {
        toast({
          title: "Save Failed",
          description: "Failed to save the new version.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Save Error",
        description: "An error occurred while saving.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Document not found</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Document Editor</span>
            </div>
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{document.name}</CardTitle>
                <CardDescription>Client: {document.clientName} | Department: {document.department}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(document.priority)}>
                  {document.priority.charAt(0).toUpperCase() + document.priority.slice(1)}
                </Badge>
                <Badge className={getStatusColor(document.status)}>
                  {document.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Version: {document.currentVersion}</span>
              <span>Deadline: {document.deadline}</span>
              <span>Last Modified: {new Date(document.lastModified).toLocaleDateString()}</span>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Content</CardTitle>
                <CardDescription>Edit the document content below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Document content..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Version Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={versionNotes}
                    onChange={(e) => setVersionNotes(e.target.value)}
                    placeholder="Describe the changes made..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleSaveNewVersion}
                    disabled={isSaving || editedContent === document.content}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save New Version
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Version History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Version History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>Previous versions of this document</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {document.versions.slice().reverse().map((version) => (
                    <div
                      key={version.version}
                      className={`p-3 border rounded-lg ${
                        version.version === document.currentVersion 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Version {version.version}</span>
                        {version.version === document.currentVersion && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>By: {version.modifiedBy}</p>
                        <p>Date: {new Date(version.modifiedDate).toLocaleDateString()}</p>
                        {version.notes && <p>Notes: {version.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
