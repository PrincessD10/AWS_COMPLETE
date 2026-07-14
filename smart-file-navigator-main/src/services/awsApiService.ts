import { AWS_CONFIG, getApiUrl } from '@/config/aws';
import { awsFreeTierMonitor } from '@/utils/awsFreeTierMonitor';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface AuthRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  organization: string;
  department: string;
}

interface AuthLoginRequest {
  email: string;
  password: string;
}

interface DocumentCreateRequest {
  name: string;
  content: string;
  clientName: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
}

interface DocumentUpdateRequest {
  name?: string;
  content?: string;
  status?: 'assigned' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

class AwsApiService {
  private async makeRequest<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    try {
      awsFreeTierMonitor.incrementApiCall();

      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (body) {
        config.body = JSON.stringify(body);
      }

      console.log(`Making ${method} request to AWS API:`, url);
      console.log('Request body:', body);
      console.log('Free tier usage check:', awsFreeTierMonitor.checkFreeTierLimits());

      const response = await fetch(url, config);
      const data = await response.json();

      console.log('AWS API Response status:', response.status);
      console.log('AWS API Response data:', data);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('AWS API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ──────────────── AUTH ────────────────

  async register(userData: AuthRegisterRequest): Promise<ApiResponse> {
    const url = getApiUrl(AWS_CONFIG.ENDPOINTS.REGISTER);
    return this.makeRequest(url, 'POST', userData);
  }

  async login(credentials: AuthLoginRequest): Promise<ApiResponse> {
    const url = getApiUrl(AWS_CONFIG.ENDPOINTS.LOGIN);
    return this.makeRequest(url, 'POST', credentials);
  }

  // ──────────────── DOCUMENTS ────────────────

  async getDocuments(token?: string): Promise<ApiResponse> {
    const url = getApiUrl(AWS_CONFIG.ENDPOINTS.DOCUMENTS);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'GET', undefined, headers);
  }

  async getDocumentById(id: string, token?: string): Promise<ApiResponse> {
    const url = `${getApiUrl(AWS_CONFIG.ENDPOINTS.DOCUMENT_BY_ID)}/${id}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'GET', undefined, headers);
  }

  async createDocument(documentData: DocumentCreateRequest, token?: string): Promise<ApiResponse> {
    const url = getApiUrl(AWS_CONFIG.ENDPOINTS.DOCUMENTS);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'POST', documentData, headers);
  }

  async updateDocument(id: string, updates: DocumentUpdateRequest, token?: string): Promise<ApiResponse> {
    const url = `${getApiUrl(AWS_CONFIG.ENDPOINTS.DOCUMENT_BY_ID)}/${id}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'PUT', updates, headers);
  }

  async deleteDocument(id: string, token?: string): Promise<ApiResponse> {
    const url = `${getApiUrl(AWS_CONFIG.ENDPOINTS.DOCUMENT_BY_ID)}/${id}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'DELETE', undefined, headers);
  }

  async getPendingDocuments(token?: string): Promise<ApiResponse> {
    const url = `${getApiUrl(AWS_CONFIG.ENDPOINTS.DOCUMENTS)}/pending`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'GET', undefined, headers);
  }

  // ──────────────── DEPARTMENTS & STAFF ────────────────

  async getDepartments(token?: string): Promise<ApiResponse> {
    const url = getApiUrl(AWS_CONFIG.ENDPOINTS.DEPARTMENTS);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'GET', undefined, headers);
  }

  async getStaff(token?: string): Promise<ApiResponse> {
    const url = getApiUrl(AWS_CONFIG.ENDPOINTS.STAFF);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'GET', undefined, headers);
  }

  // ──────────────── NOTIFICATIONS ────────────────

  async getNotifications(userId: string, token?: string): Promise<ApiResponse> {
    const url = `${getApiUrl(AWS_CONFIG.ENDPOINTS.NOTIFICATIONS)}?userId=${userId}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'GET', undefined, headers);
  }

  async createNotification(notificationData: any, token?: string): Promise<ApiResponse> {
    const url = getApiUrl(AWS_CONFIG.ENDPOINTS.NOTIFICATIONS);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'POST', notificationData, headers);
  }

  // ──────────────── REPORTS ────────────────

  async generateReport(reportType: string, token?: string): Promise<ApiResponse> {
    const url = `${getApiUrl(AWS_CONFIG.ENDPOINTS.REPORTS)}?type=${reportType}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.makeRequest(url, 'GET', undefined, headers);
  }

  // ──────────────── FREE TIER ────────────────

  getFreeTierUsage() {
    return awsFreeTierMonitor.checkFreeTierLimits();
  }
}

export const awsApiService = new AwsApiService();
