const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
};

// Helper function to create database connection
async function createConnection() {
  return await mysql.createConnection(dbConfig);
}

// Helper function to verify JWT token
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, path, body, headers } = event;
    const parsedBody = body ? JSON.parse(body) : {};
    
    // Extract path parameters
    const pathSegments = path.split('/').filter(segment => segment !== '');
    const resource = pathSegments[0];
    const action = pathSegments[1];
    const id = pathSegments[2];

    console.log('Processing:', { httpMethod, resource, action, id });

    let response;

    // Route requests
    if (resource === 'auth') {
      if (action === 'register' && httpMethod === 'POST') {
        response = await handleRegister(parsedBody);
      } else if (action === 'login' && httpMethod === 'POST') {
        response = await handleLogin(parsedBody);
      }
    } else if (resource === 'documents') {
      const token = headers.Authorization?.replace('Bearer ', '');
      
      if (httpMethod === 'GET' && !action) {
        response = await handleGetDocuments(token);
      } else if (httpMethod === 'POST' && !action) {
        response = await handleCreateDocument(parsedBody, token);
      } else if (httpMethod === 'GET' && action) {
        response = await handleGetDocument(action, token);
      } else if (httpMethod === 'PUT' && action) {
        response = await handleUpdateDocument(action, parsedBody, token);
      } else if (httpMethod === 'DELETE' && action) {
        response = await handleDeleteDocument(action, token);
      }
    }

    if (!response) {
      response = {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Route not found' })
      };
    }

    return {
      ...response,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

// Auth handlers
async function handleRegister({ email, password, firstName, lastName, role }) {
  const connection = await createConnection();
  
  try {
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'User already exists' })
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Insert new user
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, firstName, lastName, role || 'user']
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ 
        success: true, 
        message: 'User registered successfully',
        data: { id: userId, email, firstName, lastName, role: role || 'user' }
      })
    };

  } finally {
    await connection.end();
  }
}

async function handleLogin({ email, password }) {
  const connection = await createConnection();
  
  try {
    // Get user
    const [users] = await connection.execute(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Invalid credentials' })
      };
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Invalid credentials' })
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          },
          token
        }
      })
    };

  } finally {
    await connection.end();
  }
}

// Document handlers
async function handleGetDocuments(token) {
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'No token provided' })
    };
  }

  try {
    const decoded = verifyToken(token);
    const connection = await createConnection();
    
    try {
      const [documents] = await connection.execute(`
        SELECT d.*, u.email as uploaded_by_email
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        ORDER BY d.created_at DESC
      `);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          data: documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            content: doc.content,
            type: doc.type,
            clientName: doc.client_name,
            status: doc.status,
            priority: doc.priority,
            assignedDate: doc.assigned_date,
            deadline: doc.deadline,
            department: doc.department,
            currentVersion: doc.current_version,
            uploadedBy: doc.uploaded_by_email,
            lastModified: doc.updated_at
          }))
        })
      };

    } finally {
      await connection.end();
    }

  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Invalid token' })
    };
  }
}

async function handleCreateDocument(documentData, token) {
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'No token provided' })
    };
  }

  try {
    const decoded = verifyToken(token);
    const connection = await createConnection();
    
    try {
      const documentId = uuidv4();
      const { name, content, clientName, department, priority, deadline } = documentData;

      await connection.execute(`
        INSERT INTO documents (
          id, name, content, type, client_name, status, priority,
          assigned_date, deadline, department, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        documentId, name, content, 'pdf', clientName, 'assigned', priority,
        new Date().toISOString().split('T')[0], deadline, department, decoded.userId
      ]);

      return {
        statusCode: 201,
        body: JSON.stringify({ 
          success: true,
          data: { id: documentId, ...documentData }
        })
      };

    } finally {
      await connection.end();
    }

  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Invalid token' })
    };
  }
}

async function handleUpdateDocument(documentId, updates, token) {
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'No token provided' })
    };
  }

  try {
    const decoded = verifyToken(token);
    const connection = await createConnection();
    
    try {
      const { name, content, status, priority } = updates;
      
      await connection.execute(`
        UPDATE documents 
        SET name = ?, content = ?, status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, content, status, priority, documentId]);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'Document updated successfully'
        })
      };

    } finally {
      await connection.end();
    }

  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Invalid token' })
    };
  }
}

async function handleDeleteDocument(documentId, token) {
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'No token provided' })
    };
  }

  try {
    const decoded = verifyToken(token);
    const connection = await createConnection();
    
    try {
      await connection.execute('DELETE FROM documents WHERE id = ?', [documentId]);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'Document deleted successfully'
        })
      };

    } finally {
      await connection.end();
    }

  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Invalid token' })
    };
  }
}

async function handleGetDocument(documentId, token) {
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'No token provided' })
    };
  }

  try {
    const decoded = verifyToken(token);
    const connection = await createConnection();
    
    try {
      const [documents] = await connection.execute(`
        SELECT d.*, u.email as uploaded_by_email
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = ?
      `, [documentId]);

      if (documents.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, error: 'Document not found' })
        };
      }

      const doc = documents[0];

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          data: {
            id: doc.id,
            name: doc.name,
            content: doc.content,
            type: doc.type,
            clientName: doc.client_name,
            status: doc.status,
            priority: doc.priority,
            assignedDate: doc.assigned_date,
            deadline: doc.deadline,
            department: doc.department,
            currentVersion: doc.current_version,
            uploadedBy: doc.uploaded_by_email,
            lastModified: doc.updated_at
          }
        })
      };

    } finally {
      await connection.end();
    }

  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Invalid token' })
    };
  }
}