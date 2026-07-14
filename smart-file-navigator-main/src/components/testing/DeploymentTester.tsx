import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { awsApiService } from '@/services/awsApiService';
import { AWS_CONFIG } from '@/config/aws';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const DeploymentTester = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: API URL Configuration
    updateResult('API Config', 'pending', 'Checking API configuration...');
    if (AWS_CONFIG.API_GATEWAY_URL.includes('your-api-id')) {
      updateResult('API Config', 'error', 'API Gateway URL not configured', 'Please update the URL in src/config/aws.ts');
    } else {
      updateResult('API Config', 'success', 'API Gateway URL configured');
    }

    // Test 2: API Connectivity
    updateResult('API Connectivity', 'pending', 'Testing API connectivity...');
    try {
      const response = await fetch(AWS_CONFIG.API_GATEWAY_URL + '/health');
      if (response.ok) {
        updateResult('API Connectivity', 'success', 'API is reachable');
      } else {
        updateResult('API Connectivity', 'warning', `API returned status ${response.status}`, 'Check if health endpoint exists');
      }
    } catch (error) {
      updateResult('API Connectivity', 'error', 'Cannot reach API', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 3: CORS Configuration
    updateResult('CORS', 'pending', 'Testing CORS configuration...');
    try {
      const response = await fetch(AWS_CONFIG.API_GATEWAY_URL + '/health', {
        method: 'OPTIONS'
      });
      if (response.ok) {
        updateResult('CORS', 'success', 'CORS is properly configured');
      } else {
        updateResult('CORS', 'warning', 'CORS might have issues', 'Check API Gateway CORS settings');
      }
    } catch (error) {
      updateResult('CORS', 'error', 'CORS test failed', 'Verify CORS configuration in API Gateway');
    }

    // Test 4: User Registration
    updateResult('Registration', 'pending', 'Testing user registration...');
    try {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as const
      };
      
      const result = await awsApiService.register(testUser);
      if (result.success) {
        updateResult('Registration', 'success', 'User registration working');
      } else {
        updateResult('Registration', 'error', 'Registration failed', result.error);
      }
    } catch (error) {
      updateResult('Registration', 'error', 'Registration test failed', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 5: User Login
    updateResult('Login', 'pending', 'Testing user login...');
    try {
      const result = await awsApiService.login({
        email: 'admin@example.com',
        password: 'admin123'
      });
      if (result.success) {
        updateResult('Login', 'success', 'User login working');
      } else {
        updateResult('Login', 'warning', 'Login test failed', 'Try creating a test user first');
      }
    } catch (error) {
      updateResult('Login', 'error', 'Login test failed', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 6: Document Operations
    updateResult('Documents', 'pending', 'Testing document operations...');
    try {
      const result = await awsApiService.getDocuments();
      if (result.success) {
        updateResult('Documents', 'success', 'Document operations working');
      } else {
        updateResult('Documents', 'warning', 'Document test failed', 'Authentication may be required');
      }
    } catch (error) {
      updateResult('Documents', 'error', 'Document test failed', error instanceof Error ? error.message : 'Unknown error');
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Deployment Test Suite</CardTitle>
          <CardDescription>
            Verify that your AWS deployment is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <Button onClick={runTests} disabled={testing}>
              {testing ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>

          <div className="space-y-3">
            {results.length === 0 && !testing && (
              <p className="text-gray-500 text-center py-8">Click "Run All Tests" to start testing your deployment</p>
            )}

            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{result.name}</h4>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">
                  ✅ Passed: {results.filter(r => r.status === 'success').length}
                </span>
                <span className="text-yellow-600">
                  ⚠️ Warnings: {results.filter(r => r.status === 'warning').length}
                </span>
                <span className="text-red-600">
                  ❌ Failed: {results.filter(r => r.status === 'error').length}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentTester;