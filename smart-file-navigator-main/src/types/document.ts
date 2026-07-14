
export interface Document {
  estimatedProcessingTime: ReactNode;
  submittedDate: ReactNode;
  documentType: ReactNode;
  urgency: any;
  id: string;
  name: string;
  content: string;
  type: 'pdf' | 'doc' | 'docx' | 'txt' | 'other';
  clientName: string;
  status: 'assigned' | 'in-progress' | 'review' | 'completed';
  priority: 'high' | 'medium' | 'low';
  assignedDate: string;
  deadline: string;
  department: string;
  versions: DocumentVersion[];
  currentVersion: number;
  uploadedBy: string;
  lastModified: string;
}

export interface DocumentVersion {
  version: number;
  content: string;
  modifiedBy: string;
  modifiedDate: string;
  notes?: string;
}

export interface DocumentOperations {
  loadDocument: (id: string) => Promise<Document | null>;
  saveDocument: (document: Document) => Promise<boolean>;
  createNewVersion: (id: string, content: string, notes?: string) => Promise<boolean>;
  uploadDocument: (file: File, metadata: Partial<Document>) => Promise<Document>;
  getAllDocuments: () => Promise<Document[]>;
  deleteDocument: (id: string) => Promise<boolean>;
  downloadDocument: (id: string, format: 'pdf' | 'docx') => Promise<string>;
}