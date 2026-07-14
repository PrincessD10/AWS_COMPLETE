import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, LogOut, Eye, Download, CheckCircle, Clock, AlertTriangle, Edit, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentEditor from '@/components/documents/DocumentEditor';
import DocumentManager from '@/components/documents/DocumentManager';
import { Document } from '@/types/document';
import { awsDocumentService } from '@/services/awsDocumentService';
import { awsNotificationService } from '@/services/awsNotificationService';
import { awsReportService } from '@/services/awsReportService';

interface ProcessingStaffDashboardProps {
  user: { email: string; role: string };
  onLogout: () => void;
}

const ProcessingStaffDashboard = ({ user, onLogout }: ProcessingStaffDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'editor' | 'manager'>('dashboard');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [assignedDocuments, setAssignedDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deadlineNotifications, setDeadlineNotifications] = useState<Document[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAssignedDocuments();
    checkDeadlines();
  }, []);

  const loadAssignedDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await awsDocumentService.getAllDocuments();
      setAssignedDocuments(docs);
    } catch (error) {
      toast({
        title: "Error Loading Documents",
        description: "Failed to load assigned documents.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDeadlines = async () => {
    try {
      const docs = await awsDocumentService.getAllDocuments();
      const today = new Date();
      const upcomingDeadlines = docs.filter(doc => {
        const deadline = new Date(doc.deadline);
        const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDeadline <= 3 && daysUntilDeadline >= 0 && doc.status !== 'completed';
      });
      
      setDeadlineNotifications(upcomingDeadlines);
      
      // Send deadline reminders for urgent documents
      upcomingDeadlines.forEach(async (doc) => {
        const daysLeft = Math.ceil((new Date(doc.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 1) {
          await awsNotificationService.sendDeadlineReminder(
            doc.id,
            doc.name,
            doc.deadline,
            user.email
          );
        }
      });
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  };

  const generateReports = async () => {
    try {
      setIsGeneratingReport(true);
      const reportUrl = await awsReportService.generateProcessingReport();
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = reportUrl;
      link.download = `DocuTrack_Processing_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(reportUrl);
      
      toast({
        title: "Processing Report Generated",
        description: "Your processing report has been downloaded as a PDF file.",
      });
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate processing report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const getDeadlineColor = (deadline: string) => {
    const daysLeft = getDaysUntilDeadline(deadline);
    if (daysLeft <= 1) return 'bg-red-100 text-red-800';
    if (daysLeft <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (docId: string, newStatus: string) => {
    try {
      const document = assignedDocuments.find(doc => doc.id === docId);
      if (document) {
        const updatedDoc = { ...document, status: newStatus as any };
        await awsDocumentService.saveDocument(updatedDoc);
        await loadAssignedDocuments();
        
        // Send notification to deputy director when document is edited
        if (newStatus === 'in-progress') {
          await awsNotificationService.sendNotification({
            type: 'document_edited',
            title: 'Document Being Processed',
            message: `${document.name} is now being processed by ${user.email}`,
            documentId: docId,
            documentName: document.name,
            fromUser: user.email,
            toUser: 'deputy-director@company.com'
          });
        }
        
        toast({
          title: "Status Updated",
          description: `Document status changed to ${newStatus}`,
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update document status.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsProcessed = async (docId: string) => {
    try {
      const document = assignedDocuments.find(doc => doc.id === docId);
      if (document) {
        const updatedDoc = { ...document, status: 'review' as any };
        await awsDocumentService.saveDocument(updatedDoc);
        await loadAssignedDocuments();
        
        // Send notification to deputy director for review
        await awsNotificationService.sendNotification({
          type: 'document_processed',
          title: 'Document Ready for Review',
          message: `${document.name} has been processed and is ready for your review and validation.`,
          documentId: docId,
          documentName: document.name,
          fromUser: user.email,
          toUser: 'deputy-director@company.com'
        });
        
        toast({
          title: "Document Processed",
          description: "Document sent to Deputy Director for review and validation.",
        });
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to mark document as processed.",
        variant: "destructive"
      });
    }
  };

  const handleEditDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setCurrentView('editor');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedDocumentId(null);
    loadAssignedDocuments();
  };

  // Show different views based on current state
  if (currentView === 'upload') {
    return (
      <DocumentUpload 
        onBack={handleBackToDashboard} 
        userRole="processing-staff" 
      />
    );
  }

  if (currentView === 'editor' && selectedDocumentId) {
    return (
      <DocumentEditor 
        documentId={selectedDocumentId}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'manager') {
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
                <span className="text-sm text-gray-600">Processing Staff - {user.email}</span>
                <Button variant="ghost" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={handleBackToDashboard}
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>
          
          <DocumentManager 
            onEditDocument={handleEditDocument}
            onUploadNew={() => setCurrentView('upload')}
          />
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
              <span className="text-xl font-bold text-gray-900">DocuTrack Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Processing Staff - {user.email}</span>
              <Button variant="ghost" onClick={onLogout}>
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
          <h1 className="text-3xl font-bold text-gray-900">Processing Staff Dashboard</h1>
          <p className="text-gray-600 mt-2">Process assigned documents and manage workflows</p>
        </div>

        {/* Deadline Alerts */}
        {deadlineNotifications.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Documents requiring urgent attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deadlineNotifications.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({doc.clientName})</span>
                    </div>
                    <Badge className={getDeadlineColor(doc.deadline)}>
                      {getDaysUntilDeadline(doc.deadline) === 0 ? 'Due Today' : 
                       getDaysUntilDeadline(doc.deadline) === 1 ? 'Due Tomorrow' :
                       `${getDaysUntilDeadline(doc.deadline)} days left`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
              <CardTitle>Assigned</CardTitle>
              <CardDescription>{assignedDocuments.filter(d => d.status === 'assigned').length} new documents</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <CardTitle>In Progress</CardTitle>
              <CardDescription>{assignedDocuments.filter(d => d.status === 'in-progress').length} documents processing</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Eye className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Under Review</CardTitle>
              <CardDescription>{assignedDocuments.filter(d => d.status === 'review').length} awaiting review</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Completed Today</CardTitle>
              <CardDescription>{assignedDocuments.filter(d => d.status === 'completed').length} completed documents</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Button 
            onClick={() => setCurrentView('upload')} 
            className="bg-blue-600 hover:bg-blue-700 h-20 text-lg"
          >
            <FileText className="h-6 w-6 mr-2" />
            Upload New Document
          </Button>
          
          <Button 
            onClick={() => setCurrentView('manager')} 
            variant="outline"
            className="h-20 text-lg border-2"
          >
            <Edit className="h-6 w-6 mr-2" />
            Manage Documents
          </Button>
          
          <Button 
            onClick={generateReports}
            disabled={isGeneratingReport}
            className="bg-green-600 hover:bg-green-700 h-20 text-lg"
          >
            {isGeneratingReport ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-6 w-6 mr-2" />
                Generate & Download Report
              </>
            )}
          </Button>
        </div>

        {/* Assigned Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assigned Documents</CardTitle>
            <CardDescription>Quick overview of your most recent assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedDocuments.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.name}</h3>
                        <p className="text-sm text-gray-500">Client: {doc.clientName}</p>
                        <p className="text-sm text-gray-500">Assigned: {doc.assignedDate} | Deadline: {doc.deadline}</p>
                        <p className="text-sm text-gray-500">Department: {doc.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(doc.priority)}>
                        {doc.priority.charAt(0).toUpperCase() + doc.priority.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge className={getDeadlineColor(doc.deadline)}>
                        {getDaysUntilDeadline(doc.deadline) <= 0 ? 'Overdue' : 
                         getDaysUntilDeadline(doc.deadline) === 1 ? 'Due Tomorrow' :
                         `${getDaysUntilDeadline(doc.deadline)} days left`}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditDocument(doc.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusUpdate(doc.id, 'in-progress')}
                        >
                          Start
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleMarkAsProcessed(doc.id)}
                          disabled={doc.status !== 'in-progress'}
                        >
                          Processed
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessingStaffDashboard;