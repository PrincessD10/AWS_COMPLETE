import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Code, Database, Globe, Settings } from 'lucide-react';

const PostDeploymentSteps = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Post-Deployment Configuration</h1>
        <p className="text-gray-600">Essential steps to make your AWS deployed API fully functional</p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="frontend">Frontend</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Update API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 1: Get Your API Gateway URL</h4>
                    <p className="text-sm text-gray-600 mb-2">After deploying your Lambda and API Gateway:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>1. Go to AWS API Gateway Console</p>
                      <p>2. Select your API: "document-management-api"</p>
                      <p>3. Go to Stages → prod</p>
                      <p>4. Copy the Invoke URL</p>
                      <p>Example: https://abcd1234.execute-api.us-east-1.amazonaws.com/prod</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 2: Update AWS Configuration</h4>
                    <p className="text-sm text-gray-600 mb-2">Replace the placeholder URL in your config:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                      <pre>{`// In src/config/aws.ts
export const AWS_CONFIG = {
  API_GATEWAY_URL: 'https://YOUR-ACTUAL-API-ID.execute-api.us-east-1.amazonaws.com/prod',
  ENDPOINTS: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    DOCUMENTS: '/documents',
    DOCUMENT_BY_ID: '/documents'
  }
};`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Setup Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Verify RDS Connection</h4>
                    <p className="text-sm text-gray-600 mb-2">Ensure your Lambda can connect to RDS:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>1. Lambda and RDS must be in the same VPC</p>
                      <p>2. Lambda security group has outbound rule for port 3306</p>
                      <p>3. RDS security group allows inbound from Lambda security group</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Test Database Connection</h4>
                    <p className="text-sm text-gray-600 mb-2">Add this test endpoint to your Lambda:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                      <pre>{`// Add to your Lambda index.js
async function handleHealthCheck() {
  const connection = await createConnection();
  try {
    await connection.execute('SELECT 1');
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: 'Database connection failed',
        details: error.message
      })
    };
  } finally {
    await connection.end();
  }
}

// Add to your route handler
if (resource === 'health' && httpMethod === 'GET') {
  response = await handleHealthCheck();
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frontend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Frontend Deployment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Build Production Version</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <pre>{`# 1. Update your API URL in src/config/aws.ts
# 2. Build the project
npm run build

# 3. Test the build locally (optional)
npm run preview`}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Upload to S3</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <pre>{`# Using AWS CLI
aws s3 sync dist/ s3://your-bucket-name --delete

# Or manually upload the dist/ folder contents to your S3 bucket
# Make sure to set the bucket for static website hosting`}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Configure S3 Bucket Policy</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                      <pre>{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Environment Variables</h4>
                    <p className="text-sm text-gray-600 mb-2">Set these in Lambda Configuration → Environment variables:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>DB_HOST: your-rds-endpoint.region.rds.amazonaws.com</p>
                      <p>DB_USER: admin</p>
                      <p>DB_PASSWORD: your-secure-password</p>
                      <p>DB_NAME: documentdb</p>
                      <p>JWT_SECRET: your-jwt-secret-key-here</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">IAM Permissions</h4>
                    <p className="text-sm text-gray-600 mb-2">Ensure Lambda execution role has:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p>• AWSLambdaVPCAccessExecutionRole (if using VPC)</p>
                      <p>• CloudWatch Logs permissions</p>
                      <p>• RDS access (if needed)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">CORS Configuration</h4>
                    <p className="text-sm text-gray-600 mb-2">In API Gateway, enable CORS with:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Access-Control-Allow-Origin: *</p>
                      <p>Access-Control-Allow-Headers: Content-Type,Authorization</p>
                      <p>Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Testing & Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Test API Endpoints</h4>
                    <p className="text-sm text-gray-600 mb-2">Use curl or Postman to test:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <pre>{`# Test health check
curl https://your-api-url.com/prod/health

# Test user registration
curl -X POST https://your-api-url.com/prod/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST https://your-api-url.com/prod/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"test123"}'`}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Monitor CloudWatch Logs</h4>
                    <p className="text-sm text-gray-600 mb-2">Check for any errors in:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p>• CloudWatch → Log groups → /aws/lambda/your-function-name</p>
                      <p>• Look for connection errors, authentication issues</p>
                      <p>• Monitor API Gateway logs for CORS issues</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Frontend Testing</h4>
                    <p className="text-sm text-gray-600 mb-2">Verify your deployed frontend:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p>• Can register new users</p>
                      <p>• Can login with registered users</p>
                      <p>• Can upload and manage documents</p>
                      <p>• No CORS errors in browser console</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">✅ Success Checklist</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>□ API Gateway URL updated in frontend config</li>
            <li>□ Lambda can connect to RDS database</li>
            <li>□ All environment variables set</li>
            <li>□ CORS properly configured</li>
            <li>□ Frontend built and uploaded to S3</li>
            <li>□ User registration/login working</li>
            <li>□ Document operations functional</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Cost Monitoring</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Set up billing alerts in AWS</li>
            <li>• Monitor free tier usage</li>
            <li>• Stop RDS when not testing</li>
            <li>• Use CloudWatch to optimize Lambda</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PostDeploymentSteps;