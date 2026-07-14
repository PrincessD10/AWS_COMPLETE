
import { Document, DocumentVersion, DocumentOperations } from '@/types/document';

// Mock documents storage - this will be replaced with database calls
let mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Contract_Application.pdf',
    content: 'This is a sample contract application document content. It contains important legal terms and conditions that need to be reviewed carefully...',
    type: 'pdf',
    clientName: 'John Smith',
    status: 'assigned',
    priority: 'high',
    assignedDate: '2024-01-15',
    deadline: '2024-01-20',
    department: 'Legal Department',
    versions: [
      {
        version: 1,
        content: 'This is a sample contract application document content. It contains important legal terms and conditions that need to be reviewed carefully...',
        modifiedBy: 'system',
        modifiedDate: '2024-01-15',
        notes: 'Initial upload'
      }
    ],
    currentVersion: 1,
    uploadedBy: 'admin@company.com',
    lastModified: '2024-01-15'
  },
  {
    id: '2',
    name: 'License_Renewal.docx',
    content: 'License renewal documentation for business operations. This document outlines the requirements for license renewal and compliance...',
    type: 'docx',
    clientName: 'Jane Doe',
    status: 'in-progress',
    priority: 'medium',
    assignedDate: '2024-01-12',
    deadline: '2024-01-18',
    department: 'Licensing',
    versions: [
      {
        version: 1,
        content: 'License renewal documentation for business operations. This document outlines the requirements for license renewal and compliance...',
        modifiedBy: 'system',
        modifiedDate: '2024-01-12',
        notes: 'Initial upload'
      }
    ],
    currentVersion: 1,
    uploadedBy: 'admin@company.com',
    lastModified: '2024-01-12'
  }
];

export const documentService: DocumentOperations = {
  loadDocument: async (id: string): Promise<Document | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDocuments.find(doc => doc.id === id) || null;
  },

  saveDocument: async (document: Document): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockDocuments.findIndex(doc => doc.id === document.id);
    if (index !== -1) {
      mockDocuments[index] = { ...document, lastModified: new Date().toISOString() };
      return true;
    }
    return false;
  },

  createNewVersion: async (id: string, content: string, notes?: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const document = mockDocuments.find(doc => doc.id === id);
    if (document) {
      const newVersion: DocumentVersion = {
        version: document.currentVersion + 1,
        content,
        modifiedBy: 'current-user@company.com', // This would come from auth context
        modifiedDate: new Date().toISOString(),
        notes
      };
      document.versions.push(newVersion);
      document.currentVersion = newVersion.version;
      document.content = content;
      document.lastModified = new Date().toISOString();
      return true;
    }
    return false;
  },

  uploadDocument: async (file: File, metadata: Partial<Document>): Promise<Document> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newDocument: Document = {
      id: Date.now().toString(),
      name: file.name,
      content: 'Uploaded file content would be extracted here...',
      type: file.name.split('.').pop() as any || 'other',
      clientName: metadata.clientName || 'Unknown Client',
      status: 'assigned',
      priority: metadata.priority || 'medium',
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: metadata.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      department: metadata.department || 'General',
      versions: [
        {
          version: 1,
          content: 'Uploaded file content would be extracted here...',
          modifiedBy: 'current-user@company.com',
          modifiedDate: new Date().toISOString(),
          notes: 'Initial upload'
        }
      ],
      currentVersion: 1,
      uploadedBy: 'current-user@company.com',
      lastModified: new Date().toISOString()
    };
    mockDocuments.push(newDocument);
    return newDocument;
  },

  getAllDocuments: async (): Promise<Document[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockDocuments];
  },

  deleteDocument: async (id: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockDocuments.findIndex(doc => doc.id === id);
    if (index !== -1) {
      mockDocuments.splice(index, 1);
      return true;
    }
    return false;
  },

  downloadDocument: async (id: string, format: 'pdf' | 'docx'): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const document = mockDocuments.find(doc => doc.id === id);
    if (!document) {
      throw new Error('Document not found');
    }

    // Create mock file content based on format
    let fileContent: string;
    let mimeType: string;
    
    if (format === 'pdf') {
      // Mock PDF content - in real implementation, this would generate actual PDF
      fileContent = `%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\nDocument: ${document.name}\nClient: ${document.clientName}\nContent: ${document.content}`;
      mimeType = 'application/pdf';
    } else {
      // Mock DOCX content - in real implementation, this would generate actual DOCX
      fileContent = `Document: ${document.name}\nClient: ${document.clientName}\nDepartment: ${document.department}\n\nContent:\n${document.content}`;
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Create blob and return URL
    const blob = new Blob([fileContent], { type: mimeType });
    return URL.createObjectURL(blob);
  }
};
