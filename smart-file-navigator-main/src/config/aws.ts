// src/config/aws.ts
export const AWS_CONFIG = {
  // IMPORTANT: Replace this URL with your actual AWS API Gateway URL
  // This should point to your deployed Lambda function via API Gateway
  // Example: 'https://abc123def4.execute-api.us-east-1.amazonaws.com/prod'
  API_GATEWAY_URL: 'https://o9yvaapcgi.execute-api.eu-north-1.amazonaws.com/prod',


  ENDPOINTS: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    DOCUMENTS: '/documents',
    DOCUMENT_BY_ID: '/documents',
    DEPARTMENTS: '/departments',
    STAFF: '/staff',
    NOTIFICATIONS: '/notifications',
    REPORTS: '/reports',
    HEALTH: '/health'
  },

  // AWS Free Tier Limitations - Monitor your usage to stay within limits
  FREE_TIER_LIMITS: {
    LAMBDA_REQUESTS: 1000000, // 1M requests per month
    LAMBDA_COMPUTE_TIME: 400000, // 400,000 GB-seconds per month
    API_GATEWAY_CALLS: 1000000, // 1M API calls per month
    DYNAMODB_READS: 25, // 25 read capacity units
    DYNAMODB_WRITES: 25, // 25 write capacity units
    S3_STORAGE: 5, // 5 GB storage
    S3_REQUESTS: 20000 // 20,000 GET requests, 2,000 PUT requests
  }
};

export const getApiUrl = (endpoint: string, id?: string): string => {
  const baseUrl = AWS_CONFIG.API_GATEWAY_URL;

  // Validate that the API Gateway URL has been configured
  if (baseUrl.includes('your-api-gateway-id')) {
    console.warn('AWS API Gateway URL not configured! Please update AWS_CONFIG.API_GATEWAY_URL with your actual endpoint.');
  }

  if (id && endpoint === AWS_CONFIG.ENDPOINTS.DOCUMENT_BY_ID) {
    return `${baseUrl}${endpoint}/${id}`;
  }
  return `${baseUrl}${endpoint}`;
};

// Health check function to test API connectivity
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    console.log('Checking AWS API health at:', getApiUrl(AWS_CONFIG.ENDPOINTS.HEALTH));
    const response = await fetch(getApiUrl(AWS_CONFIG.ENDPOINTS.HEALTH), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const isHealthy = response.ok;
    console.log('AWS API health check result:', isHealthy ? 'HEALTHY' : 'UNHEALTHY');

    if (!isHealthy) {
      console.error('AWS API health check failed with status:', response.status);
    }

    return isHealthy;
  } catch (error) {
    console.error('AWS API health check failed with error:', error);
    return false;
  }
};

// Function to validate API configuration
export const validateApiConfiguration = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!AWS_CONFIG.API_GATEWAY_URL || AWS_CONFIG.API_GATEWAY_URL.includes('your-api-gateway-id')) {
    errors.push('API Gateway URL is not configured. Please update AWS_CONFIG.API_GATEWAY_URL');
  }

  if (!AWS_CONFIG.API_GATEWAY_URL.startsWith('https://')) {
    errors.push('API Gateway URL should use HTTPS');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};