import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ExternalLink, Code, Database, Globe, Shield } from 'lucide-react';

const AWSDeploymentGuide = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AWS Deployment Guide - Free Tier</h1>
        <p className="text-gray-600">Complete steps to deploy your document management system using AWS free tier services</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rds">RDS Setup</TabsTrigger>
          <TabsTrigger value="lambda">Lambda</TabsTrigger>
          <TabsTrigger value="api-gateway">API Gateway</TabsTrigger>
          <TabsTrigger value="s3">S3 Hosting</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Architecture Overview
              </CardTitle>
              <CardDescription>
                Your complete AWS infrastructure using free tier services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <Database className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold">RDS MySQL</h3>
                  <p className="text-sm text-gray-600">Database storage</p>
                  <Badge variant="secondary">db.t3.micro</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <Code className="h-8 w-8 text-orange-600 mb-2" />
                  <h3 className="font-semibold">Lambda</h3>
                  <p className="text-sm text-gray-600">API backend</p>
                  <Badge variant="secondary">Node.js 18.x</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <ExternalLink className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold">API Gateway</h3>
                  <p className="text-sm text-gray-600">REST API</p>
                  <Badge variant="secondary">REST API</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <Globe className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold">S3 + CloudFront</h3>
                  <p className="text-sm text-gray-600">Frontend hosting</p>
                  <Badge variant="secondary">Static Website</Badge>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Free Tier Limits (12 months)</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• RDS: 750 hours of db.t3.micro instances</li>
                  <li>• Lambda: 1M free requests + 400,000 GB-seconds compute time</li>
                  <li>• API Gateway: 1M API calls</li>
                  <li>• S3: 5GB storage + 20,000 GET requests</li>
                  <li>• CloudFront: 50GB data transfer + 2M requests</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                RDS MySQL Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 1: Create RDS Instance</h4>
                    <p className="text-sm text-gray-600 mb-2">Go to AWS RDS Console → Create Database</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Engine: MySQL 8.0</p>
                      <p>Instance Class: db.t3.micro (Free tier)</p>
                      <p>Storage: 20 GiB gp2 (Free tier)</p>
                      <p>DB Name: documentdb</p>
                      <p>Username: admin</p>
                      <p>Password: [Your secure password]</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 2: Configure Security Group</h4>
                    <p className="text-sm text-gray-600 mb-2">Allow Lambda access to RDS</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Type: MySQL/Aurora</p>
                      <p>Port: 3306</p>
                      <p>Source: Lambda Security Group ID</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 3: Create Database Schema</h4>
                    <p className="text-sm text-gray-600 mb-2">Connect and run this SQL:</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                      <pre>{`CREATE DATABASE IF NOT EXISTS documentdb;
USE documentdb;

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('user', 'processing-staff', 'deputy-director') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE documents (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content LONGTEXT,
    type VARCHAR(50),
    client_name VARCHAR(255),
    status ENUM('assigned', 'in-progress', 'completed') DEFAULT 'assigned',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    assigned_date DATE,
    deadline DATE,
    department VARCHAR(255),
    current_version INT DEFAULT 1,
    uploaded_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE document_versions (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    version INT NOT NULL,
    content LONGTEXT,
    modified_by VARCHAR(36),
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (modified_by) REFERENCES users(id)
);`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lambda">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Lambda Function Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 1: Create Lambda Function</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Runtime: Node.js 18.x</p>
                      <p>Architecture: x86_64</p>
                      <p>Function name: document-api</p>
                      <p>Timeout: 30 seconds</p>
                      <p>Memory: 512 MB</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 2: Environment Variables</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>DB_HOST: [Your RDS Endpoint]</p>
                      <p>DB_USER: admin</p>
                      <p>DB_PASSWORD: [Your RDS Password]</p>
                      <p>DB_NAME: documentdb</p>
                      <p>JWT_SECRET: [Your JWT Secret]</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 3: Package.json</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                      <pre>{`{
  "name": "document-api",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "mysql2": "^3.6.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  }
}`}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 4: Deploy Lambda Code</h4>
                    <p className="text-sm text-gray-600 mb-2">Create a ZIP file with index.js, package.json, and node_modules</p>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Run `npm install` locally, then zip the entire folder and upload to Lambda
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-gateway">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                API Gateway Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 1: Create REST API</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>API Type: REST API</p>
                      <p>API Name: document-management-api</p>
                      <p>Endpoint Type: Regional</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 2: Create Resources and Methods</h4>
                    <div className="space-y-2">
                      <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                        <p className="font-semibold">Resource: /auth</p>
                        <p>  └── /register (POST)</p>
                        <p>  └── /login (POST)</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                        <p className="font-semibold">Resource: /documents</p>
                        <p>  ├── GET (List all documents)</p>
                        <p>  ├── POST (Create document)</p>
                        <p>  └── /{`{id}`}</p>
                        <p>      ├── GET (Get document)</p>
                        <p>      ├── PUT (Update document)</p>
                        <p>      └── DELETE (Delete document)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 3: Enable CORS</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Access-Control-Allow-Origin: *</p>
                      <p>Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token</p>
                      <p>Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 4: Deploy API</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Stage Name: prod</p>
                      <p>Stage Description: Production deployment</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="s3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                S3 Static Website Hosting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 1: Create S3 Bucket</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Bucket Name: your-app-name-frontend</p>
                      <p>Region: us-east-1 (for CloudFront compatibility)</p>
                      <p>Block Public Access: OFF</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 2: Enable Static Website Hosting</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Index Document: index.html</p>
                      <p>Error Document: index.html (for SPA routing)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 3: Build and Upload</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <pre>{`# Build your React app
npm run build

# Upload dist folder contents to S3
aws s3 sync dist/ s3://your-app-name-frontend --delete`}</pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 4: CloudFront Distribution (Optional)</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>Origin: S3 bucket website endpoint</p>
                      <p>Price Class: Use Only US, Canada, Europe</p>
                      <p>Custom Error Pages: 404 → /index.html (for SPA)</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Final Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 1: Update Frontend Configuration</h4>
                    <p className="text-sm text-gray-600 mb-2">Update your AWS config with the deployed API Gateway URL</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                      <p>API_GATEWAY_URL: https://your-api-id.execute-api.region.amazonaws.com/prod</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 2: Test All Endpoints</h4>
                    <p className="text-sm text-gray-600 mb-2">Use the API Tester component to verify functionality</p>
                    <div className="space-y-1 text-sm">
                      <p>✓ User registration and login</p>
                      <p>✓ Document CRUD operations</p>
                      <p>✓ File upload and download</p>
                      <p>✓ Authentication with JWT tokens</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Step 3: Set up Monitoring</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p>• Enable CloudWatch Logs for Lambda</p>
                      <p>• Set up CloudWatch Alarms for error rates</p>
                      <p>• Monitor RDS performance metrics</p>
                      <p>• Track API Gateway usage</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">🎉 Deployment Complete!</h4>
                  <p className="text-sm text-green-800">
                    Your document management system is now fully deployed on AWS using free tier services. 
                    The application can handle user authentication, document management, and provides a 
                    professional interface for document processing workflows.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">💡 Free Tier Tips</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Monitor your usage in AWS Billing Dashboard</li>
                    <li>• Set up billing alerts to avoid unexpected charges</li>
                    <li>• Stop RDS instance when not in use (can save costs)</li>
                    <li>• Use CloudWatch to optimize Lambda performance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AWSDeploymentGuide;