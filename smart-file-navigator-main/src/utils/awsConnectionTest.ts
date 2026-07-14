import { AWS_CONFIG, getApiUrl, checkApiHealth } from '@/config/aws';
import { awsApiService } from '@/services/awsApiService';

export interface ConnectionTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  responseTime?: number;
}

export class AwsConnectionTester {
  async testAllEndpoints(): Promise<ConnectionTestResult[]> {
    console.log('Starting AWS API connection tests...');
    
    const tests: ConnectionTestResult[] = [
      { endpoint: 'Health Check', status: 'pending', message: 'Testing...' },
      { endpoint: 'Authentication', status: 'pending', message: 'Testing...' },
      { endpoint: 'Documents API', status: 'pending', message: 'Testing...' }
    ];

    // Test health endpoint
    const healthStart = Date.now();
    try {
      const isHealthy = await checkApiHealth();
      const healthTime = Date.now() - healthStart;
      
      tests[0] = {
        endpoint: 'Health Check',
        status: isHealthy ? 'success' : 'error',
        message: isHealthy ? 'API is responding' : 'Health check failed',
        responseTime: healthTime
      };
    } catch (error) {
      tests[0] = {
        endpoint: 'Health Check',
        status: 'error',
        message: `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // Test authentication endpoint (without actual login)
    const authStart = Date.now();
    try {
      const response = await fetch(getApiUrl(AWS_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' })
      });
      
      const authTime = Date.now() - authStart;
      
      // We expect this to fail with 401/400, but not with network errors
      if (response.status === 401 || response.status === 400) {
        tests[1] = {
          endpoint: 'Authentication',
          status: 'success',
          message: 'Auth endpoint is responding correctly',
          responseTime: authTime
        };
      } else {
        tests[1] = {
          endpoint: 'Authentication',
          status: 'error',
          message: `Unexpected response: ${response.status}`,
          responseTime: authTime
        };
      }
    } catch (error) {
      tests[1] = {
        endpoint: 'Authentication',
        status: 'error',
        message: `Auth test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    // Test documents endpoint (should require auth)
    const docsStart = Date.now();
    try {
      const response = await fetch(getApiUrl(AWS_CONFIG.ENDPOINTS.DOCUMENTS));
      const docsTime = Date.now() - docsStart;
      
      // We expect 401 (unauthorized) which means the endpoint exists
      if (response.status === 401) {
        tests[2] = {
          endpoint: 'Documents API',
          status: 'success',
          message: 'Documents endpoint is responding (auth required)',
          responseTime: docsTime
        };
      } else if (response.status === 200) {
        tests[2] = {
          endpoint: 'Documents API',
          status: 'success',
          message: 'Documents endpoint is accessible',
          responseTime: docsTime
        };
      } else {
        tests[2] = {
          endpoint: 'Documents API',
          status: 'error',
          message: `Unexpected response: ${response.status}`,
          responseTime: docsTime
        };
      }
    } catch (error) {
      tests[2] = {
        endpoint: 'Documents API',
        status: 'error',
        message: `Documents test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    console.log('AWS API connection tests completed:', tests);
    return tests;
  }

  async testWithCredentials(email: string, password: string): Promise<ConnectionTestResult> {
    console.log('Testing AWS API with user credentials...');
    
    try {
      const loginStart = Date.now();
      const response = await awsApiService.login({ email, password });
      const loginTime = Date.now() - loginStart;

      if (response.success) {
        return {
          endpoint: 'Full Authentication Test',
          status: 'success',
          message: 'Successfully authenticated with AWS API',
          responseTime: loginTime
        };
      } else {
        return {
          endpoint: 'Full Authentication Test',
          status: 'error',
          message: response.error || 'Authentication failed'
        };
      }
    } catch (error) {
      return {
        endpoint: 'Full Authentication Test',
        status: 'error',
        message: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const awsConnectionTester = new AwsConnectionTester();
