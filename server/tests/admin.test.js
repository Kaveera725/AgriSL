const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, pool, makeUser } = require('./setup');

setupTestDatabase();

const admin = () => makeUser({ role: 'admin', is_approved: 1 });

describe('GET /api/admin/stats', () => {
  test('as admin → 200', async () => {
    const adminUser = await admin();
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_users');
    expect(res.body).toHaveProperty('total_farmers');
    expect(res.body).toHaveProperty('total_officers');
  });

  test('as farmer → 403', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${farmer.token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/users', () => {
  test('returns users without password_hash', async () => {
    const adminUser = await admin();
    await makeUser(); // ensure at least one extra user exists

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminUser.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
    for (const user of res.body.users) {
      expect(user).not.toHaveProperty('password_hash');
      expect(user).not.toHaveProperty('password');
    }
  });
});

describe('PATCH /api/admin/users/:id/approve', () => {
  test('approves officer and creates a notification', async () => {
    const adminUser = await admin();
    const pendingOfficer = await makeUser({ role: 'officer', is_approved: 0 });

    const res = await request(app)
      .patch(`/api/admin/users/${pendingOfficer.id}/approve`)
      .set('Authorization', `Bearer ${adminUser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [[user]] = await pool.query(
      'SELECT is_approved FROM users WHERE id = ?',
      [pendingOfficer.id]
    );
    expect(user.is_approved).toBe(1);

    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'account_approved'",
      [pendingOfficer.id]
    );
    expect(notifications.length).toBe(1);
  });
});

describe('PATCH /api/admin/users/:id/reject', () => {
  test('rejects officer with reason and creates a notification', async () => {
    const adminUser = await admin();
    const pendingOfficer = await makeUser({ role: 'officer', is_approved: 0 });

    const res = await request(app)
      .patch(`/api/admin/users/${pendingOfficer.id}/reject`)
      .set('Authorization', `Bearer ${adminUser.token}`)
      .send({ reason: 'Could not verify the submitted credential.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [[user]] = await pool.query(
      'SELECT is_approved, rejection_reason FROM users WHERE id = ?',
      [pendingOfficer.id]
    );
    expect(user.is_approved).toBe(2);
    expect(user.rejection_reason).toBe('Could not verify the submitted credential.');

    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'account_rejected'",
      [pendingOfficer.id]
    );
    expect(notifications.length).toBe(1);
  });

  test('missing reason → 400', async () => {
    const adminUser = await admin();
    const pendingOfficer = await makeUser({ role: 'officer', is_approved: 0 });

    const res = await request(app)
      .patch(`/api/admin/users/${pendingOfficer.id}/reject`)
      .set('Authorization', `Bearer ${adminUser.token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/admin/users/:id/deactivate', () => {
  test('deactivates user with reason, stores it and notifies them', async () => {
    const adminUser = await admin();
    const officer = await makeUser({ role: 'officer', is_approved: 1 });

    const res = await request(app)
      .patch(`/api/admin/users/${officer.id}/deactivate`)
      .set('Authorization', `Bearer ${adminUser.token}`)
      .send({ reason: 'Account suspended for policy violation.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [[user]] = await pool.query(
      'SELECT role, is_approved, is_active, deactivation_reason FROM users WHERE id = ?',
      [officer.id]
    );
    expect(user.role).toBe('farmer');
    expect(user.is_approved).toBe(0);
    expect(user.is_active).toBe(0);
    expect(user.deactivation_reason).toBe('Account suspended for policy violation.');

    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'account_deactivated'",
      [officer.id]
    );
    expect(notifications.length).toBe(1);
  });

  test('deactivated user can no longer log in → 403', async () => {
    const adminUser = await admin();
    // makeUser seeds the password 'password123'.
    const target = await makeUser({ role: 'farmer', is_approved: 1 });

    // Sanity check: login works before deactivation.
    const before = await request(app)
      .post('/api/auth/login')
      .send({ email: target.email, password: 'password123' });
    expect(before.status).toBe(200);

    await request(app)
      .patch(`/api/admin/users/${target.id}/deactivate`)
      .set('Authorization', `Bearer ${adminUser.token}`)
      .send({ reason: 'Account suspended for policy violation.' });

    const after = await request(app)
      .post('/api/auth/login')
      .send({ email: target.email, password: 'password123' });
    expect(after.status).toBe(403);
    expect(after.body.message).toMatch(/deactivated/i);
  });

  test('missing reason → 400', async () => {
    const adminUser = await admin();
    const target = await makeUser({ role: 'farmer', is_approved: 1 });

    const res = await request(app)
      .patch(`/api/admin/users/${target.id}/deactivate`)
      .set('Authorization', `Bearer ${adminUser.token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
