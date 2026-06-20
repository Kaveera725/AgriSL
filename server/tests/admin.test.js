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
