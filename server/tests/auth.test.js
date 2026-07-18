const request = require('supertest');
const app = require('../server');
const { setupTestDatabase } = require('./setup');

setupTestDatabase();

// Each test uses a unique email so the file's tests stay independent.
function uniqueEmail(prefix = 'user') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.lk`;
}

const validFarmer = () => ({
  name: 'Nimal Farmer',
  email: uniqueEmail('farmer'),
  password: 'password123',
  district: 'Kandy',
  role: 'farmer',
});

// Officers register via multipart form data (certification fields + a document).
// Returns the email used so callers can log in afterwards.
function registerOfficer(overrides = {}) {
  const email = overrides.email || uniqueEmail('officer');
  const req = request(app)
    .post('/api/auth/register')
    .field('name', overrides.name || 'Nimal Officer')
    .field('email', email)
    .field('password', overrides.password || 'password123')
    .field('district', overrides.district || 'Kandy')
    .field('role', 'officer')
    .field('designation', overrides.designation || 'Field Officer')
    .field('province', overrides.province || 'Central');
  if (!overrides.noDocument) {
    req.attach('cert_document', Buffer.from('%PDF-1.4 fake certificate'), 'cert.pdf');
  }
  return { req, email };
}

describe('POST /api/auth/register', () => {
  test('valid farmer → 201, returns user without password', async () => {
    const res = await request(app).post('/api/auth/register').send(validFarmer());

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('farmer');
    expect(res.body.user.is_approved).toBe(1);
    // Never leak password material.
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  test('duplicate email → 409', async () => {
    const farmer = validFarmer();
    const first = await request(app).post('/api/auth/register').send(farmer);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/auth/register').send(farmer);
    expect(second.status).toBe(409);
  });

  test('missing required field → 400', async () => {
    const { password, ...withoutPassword } = validFarmer();
    const res = await request(app).post('/api/auth/register').send(withoutPassword);

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('as officer with certification → 201, is_approved = 0', async () => {
    const { req } = registerOfficer();
    const res = await req;

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('officer');
    expect(res.body.user.is_approved).toBe(0);
  });

  test('officer without certification document → 400', async () => {
    const { req } = registerOfficer({ noDocument: true });
    const res = await req;

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  test('valid credentials → 200 with token', async () => {
    const farmer = validFarmer();
    await request(app).post('/api/auth/register').send(farmer);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: farmer.email, password: farmer.password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body.user.email).toBe(farmer.email);
  });

  test('wrong password → 401', async () => {
    const farmer = validFarmer();
    await request(app).post('/api/auth/register').send(farmer);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: farmer.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('unapproved officer → 403', async () => {
    const { req, email } = registerOfficer();
    await req;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  test('valid token → 200', async () => {
    const farmer = validFarmer();
    await request(app).post('/api/auth/register').send(farmer);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: farmer.email, password: farmer.password });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(farmer.email);
  });

  test('no token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('invalid token → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');

    expect(res.status).toBe(401);
  });
});
