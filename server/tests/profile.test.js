const request = require('supertest');
const app = require('../server');
const pool = require('../db/db');
const bcrypt = require('bcryptjs');

describe('Enhanced Profile Editing API', () => {
  let farmerToken, officerToken, adminToken;
  let farmerId, officerId, adminId;

  beforeAll(async () => {
    // Clean test accounts
    await pool.query("DELETE FROM users WHERE email IN ('test_farmer_p@test.lk', 'test_officer_p@test.lk', 'test_admin_p@test.lk', 'test_admin_new@test.lk')");

    const passHash = await bcrypt.hash('Password123!', 10);

    // Create farmer
    const [fRes] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, district, is_approved) VALUES ('Farmer One', 'test_farmer_p@test.lk', ?, 'farmer', 'Kandy', 1)",
      [passHash]
    );
    farmerId = fRes.insertId;

    // Create officer
    const [oRes] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, district, designation, province, gov_service_id, is_approved) VALUES ('Officer One', 'test_officer_p@test.lk', ?, 'officer', 'Colombo', 'Field Officer', 'Western', 'GOV-1234', 1)",
      [passHash]
    );
    officerId = oRes.insertId;

    // Create admin
    const [aRes] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, district, is_approved) VALUES ('Admin One', 'test_admin_p@test.lk', ?, 'admin', 'Colombo', 1)",
      [passHash]
    );
    adminId = aRes.insertId;

    // Login each to get access tokens
    const fLogin = await request(app).post('/api/auth/login').send({ email: 'test_farmer_p@test.lk', password: 'Password123!' });
    farmerToken = fLogin.body.accessToken || fLogin.body.token;

    const oLogin = await request(app).post('/api/auth/login').send({ email: 'test_officer_p@test.lk', password: 'Password123!' });
    officerToken = oLogin.body.accessToken || oLogin.body.token;

    const aLogin = await request(app).post('/api/auth/login').send({ email: 'test_admin_p@test.lk', password: 'Password123!' });
    adminToken = aLogin.body.accessToken || aLogin.body.token;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email IN ('test_farmer_p@test.lk', 'test_officer_p@test.lk', 'test_admin_p@test.lk', 'test_admin_new@test.lk')");
  });

  describe('FARMER Role', () => {
    test('updates name, phone, district, preferred_language successfully', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${farmerToken}`)
        .field('name', 'Shamika Wijekoon')
        .field('phone', '0771234567')
        .field('district', 'Matale')
        .field('preferred_language', 'si');

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Shamika Wijekoon');
      expect(res.body.user.phone).toBe('0771234567');
      expect(res.body.user.district).toBe('Matale');
      expect(res.body.user.preferred_language).toBe('si');
    });

    test('rejects invalid Sri Lankan phone number', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${farmerToken}`)
        .field('phone', '12345');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid phone number/i);
    });

    test('rejects password change if current password is wrong', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${farmerToken}`)
        .field('current_password', 'WrongPassword123')
        .field('new_password', 'NewPassword999!')
        .field('confirm_password', 'NewPassword999!');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/incorrect/i);
    });

    test('successfully updates password with correct current password', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${farmerToken}`)
        .field('current_password', 'Password123!')
        .field('new_password', 'NewPassword999!')
        .field('confirm_password', 'NewPassword999!');

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Profile updated successfully/i);

      // Verify login with new password works
      const loginCheck = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_farmer_p@test.lk', password: 'NewPassword999!' });
      expect(loginCheck.status).toBe(200);
    });
  });

  describe('OFFICER Role', () => {
    test('updates officer designation, province, district, phone', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${officerToken}`)
        .field('name', 'Kamal Perera')
        .field('phone', '+94712345678')
        .field('designation', 'Agricultural Instructor')
        .field('province', 'Central')
        .field('district', 'Kandy');

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Kamal Perera');
      expect(res.body.user.phone).toBe('+94712345678');
      expect(res.body.user.designation).toBe('Agricultural Instructor');
      expect(res.body.user.province).toBe('Central');
      expect(res.body.user.gov_service_id).toBe('GOV-1234');
    });
  });

  describe('ADMIN Role', () => {
    test('requires current password to change email', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('email', 'test_admin_new@test.lk');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Current password required to change email/i);
    });

    test('rejects email change with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('email', 'test_admin_new@test.lk')
        .field('current_password', 'WrongPassword123');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Current password is incorrect/i);
    });

    test('successfully changes email with correct password', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('email', 'test_admin_new@test.lk')
        .field('current_password', 'Password123!');

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test_admin_new@test.lk');

      // Verify login with new email works
      const loginCheck = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test_admin_new@test.lk', password: 'Password123!' });
      expect(loginCheck.status).toBe(200);
    });
  });
});
