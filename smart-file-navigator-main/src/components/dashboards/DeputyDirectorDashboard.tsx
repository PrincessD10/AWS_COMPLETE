import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, LogOut, Users, Building, BarChart3, TrendingUp, ClipboardList, Folder, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import DocumentCategories from '@/components/dashboards/DocumentCategories';
import { awsDocumentService } from '@/services/awsDocumentService';
import { awsNotificationService } from '@/services/awsNotificationService';
import { awsReportService } from '@/services/awsReportService';
import { Document } from '@/types/document';

interface DeputyDirectorDashboardProps {
  user: { email: string; role: string };
  onLogout: () => void;
}

const DeputyDirectorDashboard = ({ user, onLogout }: DeputyDirectorDashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'categories'>('dashboard');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<{ [key: number]: string }>({});
  const [selectedStaff, setSelectedStaff] = useState<{ [key: number]: string }>({});
  const [deadlines, setDeadlines] = useState<{ [key: number]: string }>({});
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [staffMembers, setStaffMembers] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [docs, depts, staff] = await Promise.all([
        awsDocumentService.getPendingDocuments(),
        awsDocumentService.getDepartments(),
        awsDocumentService.getStaffMembers()
      ]);
      setPendingDocuments(docs);
      setDepartments(depts);
      setStaffMembers(staff);
    };

    fetchData();
  }, []);


  const handleAssignDocument = async (docId: number, department: string, staff: string) => {
    const deadline = deadlines[docId];
    if (!deadline) {
      toast({
        title: "Missing Deadline",
        description: "Please set a deadline before assigning the document.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Send notification to processing staff about deadline
      await awsNotificationService.sendNotification({
        type: 'document_assigned',
        title: 'New Document Assigned with Deadline',
        message: `A new document has been assigned to you. Deadline: ${deadline}`,
        documentId: docId.toString(),
        documentName: pendingDocuments.find(d => Number(d.id) === docId)?.name || 'Unknown Document',
        fromUser: user.email,
        toUser: staff.split(' ')[0].toLowerCase() + '@company.com'
      });

      toast({
        title: "Document Assigned",
        description: `Document assigned to ${staff} in ${department} with deadline ${deadline}`,
      });
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Failed to assign document.",
        variant: "destructive"
      });
    }
  };

  const handleDocumentReview = async (documentId: string, action: 'approve' | 'reject') => {
    try {
      const document = await awsDocumentService.loadDocument(documentId);
      if (document) {
        const newStatus = action === 'approve' ? 'completed' : 'in-progress';
        const updatedDoc = { ...document, status: newStatus as any };
        await awsDocumentService.saveDocument(updatedDoc);

        // Send notification back to processing staff
        await awsNotificationService.sendNotification({
          type: action === 'approve' ? 'document_approved' : 'document_rejected',
          title: `Document ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          message: `${document.name} has been ${action}d by the Deputy Director.`,
          documentId,
          documentName: document.name,
          fromUser: user.email,
          toUser: document.uploadedBy
        });

        toast({
          title: `Document ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          description: `${document.name} has been ${action}d and ${action === 'approve' ? 'completed' : 'returned for revision'}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: `Failed to ${action} document.`,
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const document = await awsDocumentService.loadDocument(documentId);
      if (document) {
        setSelectedDocument(document);
      } else {
        toast({
          title: "Document Not Found",
          description: "Unable to load the document for preview.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document.",
        variant: "destructive"
      });
    }
  };

  const generateAnalyticsReport = async () => {
    try {
      setIsGeneratingReport(true);
      const reportUrl = await awsReportService.generateAnalyticsReport();

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = reportUrl;
      link.download = `DocuTrack_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      URL.revokeObjectURL(reportUrl);

      toast({
        title: "Analytics Report Generated",
        description: "Your comprehensive analytics report has been downloaded as a PDF file.",
      });
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate analytics report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (currentView === 'categories') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DocuTrack Pro</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Deputy Director - {user.email}</span>
                <Button variant="ghost" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DocumentCategories onBack={() => setCurrentView('dashboard')} />
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
              <span className="text-sm text-gray-600">Deputy Director - {user.email}</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Deputy Director Dashboard</h1>
          <p className="text-gray-600 mt-2">Assign documents, monitor progress, and oversee operations</p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <ClipboardList className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Pending Assignment</CardTitle>
              <CardDescription>{pendingDocuments.length} documents awaiting assignment</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Active Staff</CardTitle>
              <CardDescription>18 staff members processing documents</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Building className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Departments</CardTitle>
              <CardDescription>6 departments handling various document types</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-2" />
              <CardTitle>Processing Rate</CardTitle>
              <CardDescription>92% completion rate this month</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => setCurrentView('categories')}
            className="bg-purple-600 hover:bg-purple-700 h-16 text-lg"
          >
            <Folder className="h-6 w-6 mr-2" />
            View Document Categories
          </Button>

          <Button
            onClick={generateAnalyticsReport}
            disabled={isGeneratingReport}
            className="bg-blue-600 hover:bg-blue-700 h-16 text-lg"
          >
            {isGeneratingReport ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-6 w-6 mr-2" />
                Generate & Download Analytics Report
              </>
            )}
          </Button>
        </div>

        {/* Notifications and Document Assignment in Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Notifications */}
          <div className="lg:col-span-1">
            <NotificationCenter
              userId="deputy-director@company.com"
              onDocumentReview={handleDocumentReview}
              onViewDocument={handleViewDocument}
            />
          </div>

          {/* Document Assignment */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Assignment</CardTitle>
                <CardDescription>Assign pending documents to appropriate departments and staff members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {pendingDocuments.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-6 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-10 w-10 text-gray-400" />
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{doc.name}</h3>
                            <p className="text-gray-600">Client: {doc.clientName}</p>
                            <p className="text-gray-500 text-sm">Submitted: {doc.submittedDate}</p>
                            <p className="text-gray-500 text-sm">Type: {doc.documentType}</p>
                            <p className="text-gray-500 text-sm">Est. Processing: {doc.estimatedProcessingTime}</p>
                          </div>
                        </div>
                        <Badge className={getUrgencyColor(doc.urgency)}>
                          {doc.urgency.charAt(0).toUpperCase() + doc.urgency.slice(1)} Priority
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to Department
                          </Label>
                          <Select onValueChange={(value) => setSelectedDepartment({ ...selectedDepartment, [doc.id]: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to Staff Member
                          </Label>
                          <Select onValueChange={(value) => setSelectedStaff({ ...selectedStaff, [doc.id]: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffMembers.map((staff) => (
                                <SelectItem key={staff} value={staff}>
                                  {staff}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="block text-sm font-medium text-gray-700 mb-2">
                            Processing Deadline
                          </Label>
                          <Input
                            type="date"
                            value={deadlines[doc.id] || ''}
                            onChange={(e) => setDeadlines({ ...deadlines, [doc.id]: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleAssignDocument(Number(doc.id), selectedDepartment[doc.id], selectedStaff[doc.id])}
                            disabled={!selectedDepartment[doc.id] || !selectedStaff[doc.id] || !deadlines[doc.id]}
                          >
                            Assign Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Document processing by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{dept}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{Math.floor(Math.random() * 50) + 10}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Removed Recent Activities Card */}
        </div>


        {/* Document Preview Modal */}
        {selectedDocument && (
          <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedDocument.name}</DialogTitle>
                <DialogDescription>
                  Client: {selectedDocument.clientName} | Department: {selectedDocument.department}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Document Content:</h4>
                  <div className="whitespace-pre-wrap text-sm">{selectedDocument.content}</div>
                </div>
                <div className="flex space-x-4 mt-6">
                  <Button
                    onClick={() => handleDocumentReview(selectedDocument.id, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Document
                  </Button>
                  <Button
                    onClick={() => handleDocumentReview(selectedDocument.id, 'reject')}
                    variant="outline"
                  >
                    Reject Document
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
    
  export default DeputyDirectorDashboard;