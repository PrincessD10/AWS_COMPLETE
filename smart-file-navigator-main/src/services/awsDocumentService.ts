import { awsApiService } from './awsApiService';
import { Document, DocumentOperations } from '@/types/document';

class AwsDocumentService implements DocumentOperations {
  private getAuthToken(): string | null {
    return localStorage.getItem('aws_auth_token');
  }

  private getUserEmail(): string {
    const userStr = localStorage.getItem('aws_auth_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email || 'Unknown';
      } catch {
        return 'Unknown';
      }
    }
    return 'Unknown';
  }

  async getStaffMembers(): Promise<string[]> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');
      const response = await awsApiService.getStaff(token);
      if (response.success && response.data?.staff) {
        return response.data.staff;
      }
      console.error('Failed to get staff members:', response.error);
      return [];
    } catch (error) {
      console.error('Error fetching staff members:', error);
      return [];
    }
  }

  async getDepartments(): Promise<string[]> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');
      const response = await awsApiService.getDepartments(token);
      if (response.success && response.data?.departments) {
        return response.data.departments;
      }
      console.error('Failed to get departments:', response.error);
      return [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async getPendingDocuments(): Promise<Document[]> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');
      const response = await awsApiService.getPendingDocuments(token);
      if (response.success && response.data?.pendingDocuments) {
        return response.data.pendingDocuments.map((doc: any) => this.mapAwsDocumentToDocument(doc));
      }
      console.error('Failed to get pending documents:', response.error);
      return [];
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      return [];
    }
  }

  async loadDocument(id: string): Promise<Document | null> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');

      // Note: Your awsApiService.getDocuments fetches all docs, no specific get by id
      const response = await awsApiService.getDocuments(token);
      if (!response.success) {
        console.error('Failed to load documents from AWS:', response.error);
        throw new Error(response.error || 'Failed to load documents');
      }

      const documents = Array.isArray(response.data) ? response.data : [];
      const doc = documents.find((d: any) => d.id === id);
      if (!doc) return null;
      return this.mapAwsDocumentToDocument(doc);
    } catch (error) {
      console.error('Error loading document:', error);
      throw error;
    }
  }

  async saveDocument(document: Document): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');

      const updateData = {
        name: document.name,
        content: document.content,
        status: document.status,
        priority: document.priority,
      };

      const response = await awsApiService.updateDocument(document.id, {/*updateData*/}, token);
      if (response.success) return true;

      console.error('Failed to save document:', response.error);
      return false;
    } catch (error) {
      console.error('Error saving document:', error);
      return false;
    }
  }

  async createNewVersion(id: string, content: string, notes?: string): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');

      const document = await this.loadDocument(id);
      if (!document) {
        console.error('Document not found for version creation');
        return false;
      }

      const updateData = {
        name: document.name,
        content,
        status: 'in-progress' as const,
        priority: document.priority,
      };

      const response = await awsApiService.updateDocument(id, updateData, token);
      if (response.success) return true;

      console.error('Failed to create new version:', response.error);
      return false;
    } catch (error) {
      console.error('Error creating new version:', error);
      return false;
    }
  }

  async uploadDocument(file: File, metadata: Partial<Document>): Promise<Document> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');

      const content = await this.readFileContent(file);
      const userEmail = this.getUserEmail();

      const documentData = {
        name: metadata.name || file.name,
        content,
        clientName: metadata.clientName || userEmail,
        department: metadata.department || 'General',
        priority: metadata.priority || 'medium' as const,
        deadline: metadata.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      const response = await awsApiService.createDocument(documentData, token);
      if (response.success && response.data) {
        return {
          id: response.data.id,
          name: documentData.name,
          content: documentData.content,
          type: this.getFileType(file.name),
          clientName: documentData.clientName,
          status: 'assigned',
          priority: documentData.priority,
          assignedDate: new Date().toISOString().split('T')[0],
          deadline: documentData.deadline,
          department: documentData.department,
          versions: [{
            version: 1,
            content: documentData.content,
            modifiedBy: userEmail,
            modifiedDate: new Date().toISOString(),
          }],
          currentVersion: 1,
          uploadedBy: userEmail,
          lastModified: new Date().toISOString(),
          estimatedProcessingTime: undefined,
          submittedDate: undefined,
          documentType: undefined,
          urgency: undefined,
        };
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async getAllDocuments(): Promise<Document[]> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await awsApiService.getDocuments(token);
      if (response.success && response.data) {
        return Array.isArray(response.data)
          ? response.data.map((doc: any) => this.mapAwsDocumentToDocument(doc))
          : [];
      }
      console.error('Failed to fetch documents:', response.error);
      return [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await awsApiService.deleteDocument(id, token);
      if (response.success) return true;

      console.error('Failed to delete document:', response.error);
      return false;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  async downloadDocument(id: string, format: 'pdf' | 'docx'): Promise<string> {
    try {
      const document = await this.loadDocument(id);
      if (!document) throw new Error('Document not found');

      const blob = new Blob([document.content], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  private mapAwsDocumentToDocument(awsDoc: any): Document {
    return {
      id: awsDoc.id || '',
      name: awsDoc.name || 'Untitled',
      content: awsDoc.content || '',
      type: this.getFileType(awsDoc.name || ''),
      clientName: awsDoc.clientName || awsDoc.client_name || 'Unknown Client',
      status: awsDoc.status || 'assigned',
      priority: awsDoc.priority || 'medium',
      assignedDate: awsDoc.assignedDate || awsDoc.assigned_date || new Date().toISOString().split('T')[0],
      deadline: awsDoc.deadline || new Date().toISOString().split('T')[0],
      department: awsDoc.department || 'General',
      versions: awsDoc.versions || [{
        version: 1,
        content: awsDoc.content || '',
        modifiedBy: awsDoc.uploadedBy || awsDoc.uploaded_by_email || 'Unknown',
        modifiedDate: awsDoc.lastModified || awsDoc.updated_at || new Date().toISOString(),
      }],
      currentVersion: awsDoc.currentVersion || awsDoc.current_version || 1,
      uploadedBy: awsDoc.uploadedBy || awsDoc.uploaded_by_email || 'Unknown',
      lastModified: awsDoc.lastModified || awsDoc.updated_at || new Date().toISOString(),
      estimatedProcessingTime: undefined,
      submittedDate: undefined,
      documentType: undefined,
      urgency: undefined,
    };
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  private getFileType(filename: string): 'pdf' | 'doc' | 'docx' | 'txt' | 'other' {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc': return 'doc';
      case 'docx': return 'docx';
      case 'txt': return 'txt';
      default: return 'other';
    }
  }
}

export const awsDocumentService = new AwsDocumentService();
