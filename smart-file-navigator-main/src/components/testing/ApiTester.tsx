import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { awsApiService } from '@/services/awsApiService';
import { awsDocumentService } from '@/services/awsDocumentService';
import { useToast } from '@/hooks/use-toast';

const ApiTester = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string>('');
  const { toast } = useToast();

  // Auth test data
  const [authData, setAuthData] = useState({
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    role: 'user' as const,
  });

  // Document test data
  const [docData, setDocData] = useState({
    name: 'Test Document.pdf',
    content: 'This is test document content for API testing.',
    clientName: 'Test Client',
    department: 'Testing Department',
    priority: 'medium' as const,
    deadline: '2024-02-01',
  });

  const logResult = (operation: string, result: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${operation}:\n${JSON.stringify(result, null, 2)}\n\n`;
    setResults(prev => prev + logEntry);
  };

  const testAuthRegister = async () => {
    setLoading(true);
    try {
      const result = await awsApiService.register(authData);
      logResult('AUTH REGISTER', result);
      
      if (result.success) {
        toast({ title: "Registration Test", description: "Registration test completed successfully" });
      } else {
        toast({ title: "Registration Test", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      logResult('AUTH REGISTER ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testAuthLogin = async () => {
    setLoading(true);
    try {
      const result = await awsApiService.login({
        email: authData.email,
        password: authData.password,
      });
      logResult('AUTH LOGIN', result);
      
      if (result.success) {
        toast({ title: "Login Test", description: "Login test completed successfully" });
      } else {
        toast({ title: "Login Test", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      logResult('AUTH LOGIN ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testGetDocuments = async () => {
    setLoading(true);
    try {
      const result = await awsDocumentService.getAllDocuments();
      logResult('GET DOCUMENTS', result);
      toast({ title: "Get Documents Test", description: `Retrieved ${result.length} documents` });
    } catch (error) {
      logResult('GET DOCUMENTS ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testCreateDocument = async () => {
    setLoading(true);
    try {
      // Create a mock file for testing
      const mockFile = new File([docData.content], docData.name, { type: 'application/pdf' });
      const result = await awsDocumentService.uploadDocument(mockFile, docData);
      logResult('CREATE DOCUMENT', result);
      toast({ title: "Create Document Test", description: "Document creation test completed" });
    } catch (error) {
      logResult('CREATE DOCUMENT ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testUpdateDocument = async () => {
    setLoading(true);
    try {
      // For testing, we'll try to update document with ID "1"
      const testId = "1";
      const result = await awsDocumentService.saveDocument({
        id: testId,
        name: docData.name + " (Updated)",
        content: docData.content + " (Updated content)",
        type: 'pdf',
        clientName: docData.clientName,
        status: 'in-progress',
        priority: docData.priority,
        assignedDate: '2024-01-15',
        deadline: docData.deadline,
        department: docData.department,
        versions: [],
        currentVersion: 1,
        uploadedBy: 'test@example.com',
        lastModified: new Date().toISOString(),
      });
      logResult('UPDATE DOCUMENT', { success: result, documentId: testId });
      toast({ title: "Update Document Test", description: result ? "Update successful" : "Update failed" });
    } catch (error) {
      logResult('UPDATE DOCUMENT ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults('');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>AWS API Testing Interface</CardTitle>
          <CardDescription>
            Test your AWS Lambda API endpoints before deploying to production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auth" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={authData.firstName}
                    onChange={(e) => setAuthData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                  
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={authData.lastName}
                    onChange={(e) => setAuthData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button onClick={testAuthRegister} disabled={loading} className="w-full">
                      Test Registration (POST /auth/register)
                    </Button>
                    <Button onClick={testAuthLogin} disabled={loading} className="w-full">
                      Test Login (POST /auth/login)
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label htmlFor="docName">Document Name</Label>
                  <Input
                    id="docName"
                    value={docData.name}
                    onChange={(e) => setDocData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={docData.clientName}
                    onChange={(e) => setDocData(prev => ({ ...prev, clientName: e.target.value }))}
                  />
                  
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={docData.department}
                    onChange={(e) => setDocData(prev => ({ ...prev, department: e.target.value }))}
                  />
                  
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={docData.content}
                    onChange={(e) => setDocData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button onClick={testGetDocuments} disabled={loading} className="w-full">
                      Test Get Documents (GET /documents)
                    </Button>
                    <Button onClick={testCreateDocument} disabled={loading} className="w-full">
                      Test Create Document (POST /documents)
                    </Button>
                    <Button onClick={testUpdateDocument} disabled={loading} className="w-full">
                      Test Update Document (PUT /documents/:id)
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">API Test Results</h3>
                <Button onClick={clearResults} variant="outline">
                  Clear Results
                </Button>
              </div>
              <Textarea
                value={results}
                readOnly
                placeholder="API test results will appear here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTester;