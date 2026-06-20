// Mock the OpenAI SDK so disease detection returns a deterministic JSON result
// instead of calling the vision model.
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

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, makeUser } = require('./setup');

setupTestDatabase();

// Minimal valid-looking JPEG bytes (SOI ... EOI). multer only inspects the
// declared mimetype, and the model is mocked, so the content is irrelevant.
const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);

const uploadsDir = path.join(__dirname, '..', 'uploads');
const createdFiles = [];

// Remember any file the detect endpoint actually stored so we can delete it.
function trackUpload(res) {
  const url = res.body && res.body.image_url;
  if (url) createdFiles.push(url.split('/uploads/')[1]);
}

afterAll(() => {
  for (const file of createdFiles) {
    if (!file) continue;
    const full = path.join(uploadsDir, file);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
});

describe('POST /api/disease', () => {
  test('no image → 400', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .post('/api/disease')
      .set('Authorization', `Bearer ${farmer.token}`)
      .field('crop_type', 'Tomato')
      .field('district', 'Kandy');

    expect(res.status).toBe(400);
  });

  test('non-image file → 400', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .post('/api/disease')
      .set('Authorization', `Bearer ${farmer.token}`)
      .field('crop_type', 'Tomato')
      .field('district', 'Kandy')
      .attach('image', Buffer.from('this is not an image'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
  });

  test('missing crop_type → 400', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .post('/api/disease')
      .set('Authorization', `Bearer ${farmer.token}`)
      .field('district', 'Kandy');

    expect(res.status).toBe(400);
  });

  test('valid jpg image → 200', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .post('/api/disease')
      .set('Authorization', `Bearer ${farmer.token}`)
      .field('crop_type', 'Tomato')
      .field('district', 'Kandy')
      .attach('image', JPEG_BUFFER, {
        filename: 'leaf.jpg',
        contentType: 'image/jpeg',
      });
    trackUpload(res);

    expect(res.status).toBe(200);
    expect(res.body.report_id).toBeDefined();
    expect(res.body.disease_name_en).toBe('Test Disease');
    expect(res.body.confidence).toBe('High');
  });
});

describe('GET /api/disease/history', () => {
  test("returns only the requesting user's reports", async () => {
    const farmerA = await makeUser();
    const farmerB = await makeUser();

    const a = await request(app)
      .post('/api/disease')
      .set('Authorization', `Bearer ${farmerA.token}`)
      .field('crop_type', 'Rice')
      .field('district', 'Kandy')
      .attach('image', JPEG_BUFFER, { filename: 'a.jpg', contentType: 'image/jpeg' });
    trackUpload(a);

    const b = await request(app)
      .post('/api/disease')
      .set('Authorization', `Bearer ${farmerB.token}`)
      .field('crop_type', 'Tea')
      .field('district', 'Galle')
      .attach('image', JPEG_BUFFER, { filename: 'b.jpg', contentType: 'image/jpeg' });
    trackUpload(b);

    const res = await request(app)
      .get('/api/disease/history')
      .set('Authorization', `Bearer ${farmerA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.reports.length).toBe(1);
    expect(res.body.reports.every((r) => r.user_id === farmerA.id)).toBe(true);
  });
});
