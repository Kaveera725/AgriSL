// Mock the OpenAI SDK so chat never makes a real network call. The chat client
// constructs `new OpenAI(...)`; this replaces that constructor.
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content:
                  '{"disease_name_en":"Test Disease","disease_name_si":"පරීක්ෂණ රෝගය","confidence":"High","symptoms_en":"Test symptoms","symptoms_si":"පරීක්ෂණ රෝග ලක්ෂණ","treatment_en":"Test treatment","treatment_si":"පරීක්ෂණ ප්‍රතිකාර"}',
              },
            },
          ],
        }),
      },
    },
  }));
});

const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, pool, makeUser } = require('./setup');

setupTestDatabase();

describe('POST /api/chat/start', () => {
  test('authenticated → creates session', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ crop_type: 'Rice', district: 'Kandy', language: 'en' });

    expect(res.status).toBe(201);
    expect(res.body.session_id).toBeDefined();
    expect(res.body.crop_type).toBe('Rice');
  });

  test('unauthenticated → 401', async () => {
    const res = await request(app)
      .post('/api/chat/start')
      .send({ crop_type: 'Rice', district: 'Kandy', language: 'en' });

    expect(res.status).toBe(401);
  });

  test('missing crop_type → 400', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ district: 'Kandy', language: 'en' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/chat/message', () => {
  test('valid session → returns AI response', async () => {
    const farmer = await makeUser();
    const start = await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ crop_type: 'Tomato', district: 'Kandy', language: 'en' });

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ session_id: start.body.session_id, message: 'My leaves are turning yellow' });

    expect(res.status).toBe(200);
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  test("wrong user's session → 403", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();

    const start = await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ crop_type: 'Tomato', district: 'Kandy', language: 'en' });

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${intruder.token}`)
      .send({ session_id: start.body.session_id, message: 'Hello' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/chat/complete', () => {
  test("valid → status becomes 'completed', notification created", async () => {
    const farmer = await makeUser();
    const start = await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ crop_type: 'Rice', district: 'Galle', language: 'en' });
    const sessionId = start.body.session_id;

    const res = await request(app)
      .post('/api/chat/complete')
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ session_id: sessionId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [[session]] = await pool.query(
      'SELECT status FROM chat_sessions WHERE id = ?',
      [sessionId]
    );
    expect(session.status).toBe('completed');

    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'chat_complete' AND related_id = ?",
      [farmer.id, sessionId]
    );
    expect(notifications.length).toBe(1);
  });
});

describe('GET /api/chat/history', () => {
  test('returns sessions for the authenticated user only', async () => {
    const farmerA = await makeUser();
    const farmerB = await makeUser();

    await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${farmerA.token}`)
      .send({ crop_type: 'Rice', district: 'Kandy', language: 'en' });
    await request(app)
      .post('/api/chat/start')
      .set('Authorization', `Bearer ${farmerB.token}`)
      .send({ crop_type: 'Tea', district: 'Nuwara Eliya', language: 'en' });

    const res = await request(app)
      .get('/api/chat/history')
      .set('Authorization', `Bearer ${farmerA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.sessions.length).toBe(1);
    expect(res.body.sessions.every((s) => s.user_id === farmerA.id)).toBe(true);
  });
});
