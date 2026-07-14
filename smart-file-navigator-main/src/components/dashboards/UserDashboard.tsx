import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Clock, CheckCircle, AlertCircle, LogOut, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAwsAuth } from '@/hooks/useAwsAuth';
import { awsDocumentService } from '@/services/awsDocumentService';
import { Document } from '@/types/document';
import DocumentUpload from '@/components/documents/DocumentUpload';

interface UserDashboardProps {
  user: { email: string; role: string };
  onLogout: () => void;
}

const UserDashboard = ({ user, onLogout }: UserDashboardProps) => {
  const [showUpload, setShowUpload] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut, token } = useAwsAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUserDocuments();
  }, []);

  const loadUserDocuments = async () => {
    try {
      setIsLoading(true);
      console.log('Loading documents from AWS API with token:', token ? 'Present' : 'Missing');
      const allDocuments = await awsDocumentService.getAllDocuments();
      // Filter documents for the current user (assuming clientName matches user email)
      const userDocuments = allDocuments.filter(doc => 
        doc.clientName === user.email || doc.uploadedBy === user.email
      );
      setDocuments(userDocuments);
      console.log(`Loaded ${userDocuments.length} documents for user ${user.email}`);
    } catch (error) {
      console.error('Error loading user documents:', error);
      toast({
        title: "Error Loading Documents",
        description: "Failed to load your documents from AWS API. Please check your connection and API configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('User logging out, clearing AWS auth data');
    signOut();
    onLogout();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'assigned': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (showUpload) {
    return (
      <DocumentUpload 
        onBack={() => {
          setShowUpload(false);
          loadUserDocuments(); // Reload documents after upload
        }} 
        userRole="user" 
      />
    );
  }

  const pendingDocuments = documents.filter(d => d.status === 'assigned').length;
  const processingDocuments = documents.filter(d => d.status === 'in-progress').length;
  const completedDocuments = documents.filter(d => d.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">DocuTrack Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-2">Submit and track your document processing requests via AWS API</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowUpload(true)}>
            <CardHeader className="text-center">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Submit New Document</CardTitle>
              <CardDescription>Upload documents for processing via AWS</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <CardTitle>Pending Documents</CardTitle>
              <CardDescription>{pendingDocuments} documents awaiting processing</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Completed</CardTitle>
              <CardDescription>{completedDocuments} documents processed</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Document List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>Track the status of your submitted documents (real-time data from AWS API)</CardDescription>
            </div>
            <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Submit Document
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your documents from AWS API...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No documents found in AWS. Upload your first document to get started!</p>
                    <p className="text-sm mt-2">Make sure your AWS API Gateway URL is configured correctly.</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <p className="text-sm text-gray-500">Submitted: {doc.assignedDate}</p>
                          <p className="text-sm text-gray-500">Department: {doc.department}</p>
                          <p className="text-sm text-blue-600">Status synced from AWS</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(doc.status)} flex items-center gap-1`}>
                          {getStatusIcon(doc.status)}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Deadline: {doc.deadline}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;