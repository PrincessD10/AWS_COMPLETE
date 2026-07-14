const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// MySQL configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
};

// Create DB connection
async function createConnection() {
  return await mysql.createConnection(dbConfig);
}

// Verify JWT token
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
};

// Lambda handler
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const { path, httpMethod, body, headers } = event;
    const parsedBody = body ? JSON.parse(body) : {};
    const segments = path.split('/').filter(Boolean);
    const [resource, action, id] = segments;

    let token = headers.Authorization?.replace('Bearer ', '');
    let response;

    // AUTH routes
    if (resource === 'auth') {
      if (action === 'register' && httpMethod === 'POST') {
        response = await register(parsedBody);
      } else if (action === 'login' && httpMethod === 'POST') {
        response = await login(parsedBody);
      }
    }

    // DOCUMENT routes
    else if (resource === 'documents') {
      if (!token) return unauthorized('Missing token');
      if (httpMethod === 'GET' && !action) response = await getDocuments(token);
      else if (httpMethod === 'POST' && !action) response = await createDocument(parsedBody, token);
      else if (httpMethod === 'GET' && action === 'pending') response = await getPendingDocuments(token);
      else if (httpMethod === 'GET' && action) response = await getDocumentById(action, token);
      else if (httpMethod === 'PUT' && action) response = await updateDocument(action, parsedBody, token);
      else if (httpMethod === 'DELETE' && action) response = await deleteDocument(action, token);
    }

    // DEPARTMENTS
    else if (resource === 'departments' && httpMethod === 'GET') {
      if (!token) return unauthorized();
      response = await getDepartments(token);
    }

    // STAFF
    else if (resource === 'staff' && httpMethod === 'GET') {
      if (!token) return unauthorized();
      response = await getStaff(token);
    }

    else {
      response = notFound();
    }

    return { ...response, headers: { ...corsHeaders, 'Content-Type': 'application/json' } };

  } catch (err) {
    console.error('Lambda Error:', err.message);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Internal server error', details: err.message })
    };
  }
};

async function register({ email, password, firstName, lastName, role, department, organization }) {
  if (!email || !password || !firstName || !lastName) return badRequest('Missing fields');
  const conn = await createConnection();
  try {
    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return badRequest('User already exists');

    const userId = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    await conn.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, department, organization)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, hash, firstName, lastName, role || 'user', department || null, organization || null]
    );

    return created({ userId, email, role: role || 'user' });
  } finally {
    await conn.end();
  }
}

async function login({ email, password }) {
  if (!email || !password) return badRequest('Missing credentials');
  const conn = await createConnection();
  try {
    const [users] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return unauthorized('Invalid credentials');
    const user = users[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return unauthorized('Invalid credentials');

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return ok({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } finally {
    await conn.end();
  }
}

// ──────────── DOCUMENT HANDLERS ────────────

async function getDocuments(token) {
  verifyToken(token);
  const conn = await createConnection();
  try {
    const [docs] = await conn.execute(`
      SELECT d.*, u.email AS uploaded_by_email
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.created_at DESC
    `);
    return ok({ documents: docs });
  } finally {
    await conn.end();
  }
}

async function createDocument(data, token) {
  const decoded = verifyToken(token);
  const { name, content, clientName, department, priority, deadline } = data;
  if (!name || !content || !clientName || !department || !priority || !deadline) {
    return badRequest('Missing fields');
  }

  const id = uuidv4();
  const conn = await createConnection();
  try {
    await conn.execute(
      `INSERT INTO documents (id, name, content, type, client_name, status, priority,
        assigned_date, deadline, department, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, content, 'pdf', clientName, 'assigned', priority,
        new Date().toISOString().split('T')[0], deadline, department, decoded.userId
      ]
    );
    return created({ id });
  } finally {
    await conn.end();
  }
}

async function getDocumentById(id, token) {
  verifyToken(token);
  const conn = await createConnection();
  try {
    const [docs] = await conn.execute(`SELECT * FROM documents WHERE id = ?`, [id]);
    if (!docs.length) return notFound('Document not found');
    return ok(docs[0]);
  } finally {
    await conn.end();
  }
}

async function updateDocument(id, updates, token) {
  verifyToken(token);
  const { name, content, status, priority } = updates;
  const conn = await createConnection();
  try {
    await conn.execute(`
      UPDATE documents SET name = ?, content = ?, status = ?, priority = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, content, status, priority, id]);
    return ok({ message: 'Document updated' });
  } finally {
    await conn.end();
  }
}

async function deleteDocument(id, token) {
  verifyToken(token);
  const conn = await createConnection();
  try {
    await conn.execute('DELETE FROM documents WHERE id = ?', [id]);
    return ok({ message: 'Document deleted' });
  } finally {
    await conn.end();
  }
}

async function getPendingDocuments(token) {
  verifyToken(token);
  const conn = await createConnection();
  try {
    const [docs] = await conn.execute(`
      SELECT * FROM documents WHERE status != 'completed'
      ORDER BY created_at DESC
    `);
    return ok({ pendingDocuments: docs });
  } finally {
    await conn.end();
  }
}

// ──────────── STAFF & DEPARTMENTS ────────────

async function getDepartments(token) {
  verifyToken(token);
  const conn = await createConnection();
  try {
    const [rows] = await conn.execute(`SELECT DISTINCT department FROM documents WHERE department IS NOT NULL`);
    return ok({ departments: rows.map(r => r.department) });
  } finally {
    await conn.end();
  }
}

async function getStaff(token) {
  verifyToken(token);
  const conn = await createConnection();
  try {
    const [staff] = await conn.execute(`
      SELECT first_name, last_name FROM users WHERE role = 'processing-staff'
    `);
    return ok({ staff: staff.map(s => `${s.first_name} ${s.last_name}`) });
  } finally {
    await conn.end();
  }
}

// ──────────── UTIL RESPONSES ────────────

const ok = data => ({ statusCode: 200, body: JSON.stringify({ success: true, data }) });
const created = data => ({ statusCode: 201, body: JSON.stringify({ success: true, data }) });
const badRequest = msg => ({ statusCode: 400, body: JSON.stringify({ success: false, error: msg }) });
const unauthorized = msg => ({ statusCode: 401, body: JSON.stringify({ success: false, error: msg }) });
const notFound = msg => ({ statusCode: 404, body: JSON.stringify({ success: false, error: msg }) });
