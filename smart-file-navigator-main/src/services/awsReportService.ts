import { awsApiService } from './awsApiService';

export interface ReportData {
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
  overdueDocuments: number;
  departmentStats: Array<{
    department: string;
    total: number;
    completed: number;
    pending: number;
  }>;
  processingTimes: Array<{
    documentType: string;
    averageTime: number;
  }>;
  monthlyStats: Array<{
    month: string;
    processed: number;
    completed: number;
  }>;
}

class AwsReportService {
  async generateAnalyticsReport(): Promise<string> {
    try {
      console.log('Generating analytics report from AWS data...');
      
      const token = localStorage.getItem('aws_auth_token');
      const response = await awsApiService.getDocuments(token || undefined);
      
      let reportData: ReportData;
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const documents = response.data;
        
        // Calculate real statistics from AWS data
        reportData = {
          totalDocuments: documents.length,
          completedDocuments: documents.filter(doc => doc.status === 'completed').length,
          pendingDocuments: documents.filter(doc => doc.status !== 'completed').length,
          overdueDocuments: documents.filter(doc => {
            const deadline = new Date(doc.deadline);
            const now = new Date();
            return deadline < now && doc.status !== 'completed';
          }).length,
          departmentStats: this.calculateDepartmentStats(documents),
          processingTimes: this.calculateProcessingTimes(documents),
          monthlyStats: this.calculateMonthlyStats(documents)
        };
      } else {
        // Fallback to sample data if no documents found
        reportData = {
          totalDocuments: 0,
          completedDocuments: 0,
          pendingDocuments: 0,
          overdueDocuments: 0,
          departmentStats: [],
          processingTimes: [],
          monthlyStats: []
        };
      }

      const pdfContent = this.generatePDFReport(reportData);
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating analytics report from AWS:', error);
      throw error;
    }
  }

  async generateProcessingReport(): Promise<string> {
    try {
      console.log('Generating processing report from AWS data...');
      
      const token = localStorage.getItem('aws_auth_token');
      const user = JSON.parse(localStorage.getItem('aws_auth_user') || '{}');
      const response = await awsApiService.getDocuments(token || undefined);
      
      const reportData = {
        staffMember: `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`,
        reportDate: new Date().toLocaleDateString(),
        documentsProcessed: 0,
        documentsCompleted: 0,
        documentsPending: 0,
        averageProcessingTime: 0,
        recentDocuments: [] as any[]
      };

      if (response.success && response.data && Array.isArray(response.data)) {
        const documents = response.data;
        
        reportData.documentsProcessed = documents.length;
        reportData.documentsCompleted = documents.filter(doc => doc.status === 'completed').length;
        reportData.documentsPending = documents.filter(doc => doc.status !== 'completed').length;
        reportData.recentDocuments = documents.slice(0, 10).map(doc => ({
          name: doc.name,
          client: doc.clientName || 'Unknown Client',
          status: doc.status,
          processingTime: this.calculateProcessingTime(doc)
        }));
      }

      const pdfContent = this.generateProcessingPDFReport(reportData);
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating processing report from AWS:', error);
      throw error;
    }
  }

  private calculateDepartmentStats(documents: any[]) {
    const deptMap = new Map();
    
    documents.forEach(doc => {
      const dept = doc.department || 'General';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { total: 0, completed: 0, pending: 0 });
      }
      
      const stats = deptMap.get(dept);
      stats.total++;
      if (doc.status === 'completed') {
        stats.completed++;
      } else {
        stats.pending++;
      }
    });
    
    return Array.from(deptMap.entries()).map(([department, stats]) => ({
      department,
      ...stats
    }));
  }

  private calculateProcessingTimes(documents: any[]) {
    const typeMap = new Map();
    
    documents.forEach(doc => {
      const type = doc.type || 'Other';
      if (!typeMap.has(type)) {
        typeMap.set(type, { total: 0, count: 0 });
      }
      
      const stats = typeMap.get(type);
      stats.count++;
      stats.total += this.getProcessingDays(doc);
    });
    
    return Array.from(typeMap.entries()).map(([documentType, stats]) => ({
      documentType,
      averageTime: stats.count > 0 ? (stats.total / stats.count) : 0
    }));
  }

  private calculateMonthlyStats(documents: any[]) {
    const monthMap = new Map();
    
    documents.forEach(doc => {
      const date = new Date(doc.created_at || Date.now());
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { month: monthName, processed: 0, completed: 0 });
      }
      
      const stats = monthMap.get(monthKey);
      stats.processed++;
      if (doc.status === 'completed') {
        stats.completed++;
      }
    });
    
    return Array.from(monthMap.values()).slice(0, 6); // Last 6 months
  }

  private getProcessingDays(doc: any): number {
    const created = new Date(doc.created_at || Date.now());
    const modified = new Date(doc.last_modified || Date.now());
    const diffTime = Math.abs(modified.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateProcessingTime(doc: any): string {
    const days = this.getProcessingDays(doc);
    return `${days} days`;
  }

  private generatePDFReport(data: ReportData): string {
    let pdf = '%PDF-1.4\n';
    pdf += '1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n';
    pdf += 'DocuTrack Pro - AWS Analytics Report\n';
    pdf += `Generated on: ${new Date().toLocaleDateString()}\n`;
    pdf += 'Data Source: AWS Lambda API\n\n';
    
    pdf += 'SUMMARY STATISTICS\n';
    pdf += `Total Documents: ${data.totalDocuments}\n`;
    pdf += `Completed Documents: ${data.completedDocuments}\n`;
    pdf += `Pending Documents: ${data.pendingDocuments}\n`;
    pdf += `Overdue Documents: ${data.overdueDocuments}\n\n`;
    
    if (data.departmentStats.length > 0) {
      pdf += 'DEPARTMENT STATISTICS\n';
      data.departmentStats.forEach(dept => {
        pdf += `${dept.department}: Total=${dept.total}, Completed=${dept.completed}, Pending=${dept.pending}\n`;
      });
      pdf += '\n';
    }
    
    if (data.processingTimes.length > 0) {
      pdf += 'PROCESSING TIMES BY DOCUMENT TYPE\n';
      data.processingTimes.forEach(pt => {
        pdf += `${pt.documentType}: ${pt.averageTime.toFixed(1)} days average\n`;
      });
      pdf += '\n';
    }
    
    if (data.monthlyStats.length > 0) {
      pdf += 'MONTHLY STATISTICS\n';
      data.monthlyStats.forEach(ms => {
        pdf += `${ms.month}: Processed=${ms.processed}, Completed=${ms.completed}\n`;
      });
    }
    
    return pdf;
  }

  private generateProcessingPDFReport(data: any): string {
    let pdf = '%PDF-1.4\n';
    pdf += '1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n';
    pdf += 'DocuTrack Pro - AWS Processing Staff Report\n';
    pdf += `Staff Member: ${data.staffMember}\n`;
    pdf += `Report Date: ${data.reportDate}\n`;
    pdf += 'Data Source: AWS Lambda API\n\n';
    
    pdf += 'PERFORMANCE SUMMARY\n';
    pdf += `Documents Processed: ${data.documentsProcessed}\n`;
    pdf += `Documents Completed: ${data.documentsCompleted}\n`;
    pdf += `Documents Pending: ${data.documentsPending}\n`;
    pdf += `Average Processing Time: ${data.averageProcessingTime} days\n\n`;
    
    if (data.recentDocuments.length > 0) {
      pdf += 'RECENT DOCUMENTS\n';
      data.recentDocuments.forEach((doc: any) => {
        pdf += `${doc.name} - Client: ${doc.client} - Status: ${doc.status} - Time: ${doc.processingTime}\n`;
      });
    }
    
    return pdf;
  }
}

export const awsReportService = new AwsReportService();