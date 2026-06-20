const request = require('supertest');
const app = require('../server');
const { setupTestDatabase, pool, makeUser } = require('./setup');

setupTestDatabase();

// Insert an article directly so tests that need existing content don't depend
// on the authoring endpoint (which is itself covered below).
async function insertArticle({
  officer_id,
  title_en = 'Article',
  content_en = 'Content body',
  category = 'general',
  status = 'published',
}) {
  const [r] = await pool.query(
    `INSERT INTO advisory_articles (officer_id, title_en, content_en, category, status)
     VALUES (?, ?, ?, ?, ?)`,
    [officer_id, title_en, content_en, category, status]
  );
  return r.insertId;
}

const officer = () => makeUser({ role: 'officer', is_approved: 1 });

describe('POST /api/advisory (authoring)', () => {
  test('as farmer → 403', async () => {
    const farmer = await makeUser();
    const res = await request(app)
      .post('/api/advisory')
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ title_en: 'Tips', content_en: 'Some content' });

    expect(res.status).toBe(403);
  });

  test("as officer → 201, status = 'draft'", async () => {
    const off = await officer();
    const res = await request(app)
      .post('/api/advisory')
      .set('Authorization', `Bearer ${off.token}`)
      .send({ title_en: 'Rice Care', content_en: 'How to care for rice' });

    expect(res.status).toBe(201);
    expect(res.body.article_id).toBeDefined();

    const [[article]] = await pool.query(
      'SELECT status FROM advisory_articles WHERE id = ?',
      [res.body.article_id]
    );
    expect(article.status).toBe('draft');
  });
});

describe('PUT /api/advisory/:id', () => {
  test('officer editing own article → 200', async () => {
    const off = await officer();
    const id = await insertArticle({ officer_id: off.id, status: 'draft' });

    const res = await request(app)
      .put(`/api/advisory/${id}`)
      .set('Authorization', `Bearer ${off.token}`)
      .send({ title_en: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.article.title_en).toBe('Updated Title');
  });

  test("officer editing another officer's article → 403", async () => {
    const officerA = await officer();
    const officerB = await officer();
    const id = await insertArticle({ officer_id: officerA.id });

    const res = await request(app)
      .put(`/api/advisory/${id}`)
      .set('Authorization', `Bearer ${officerB.token}`)
      .send({ title_en: 'Hijacked' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/advisory (public browsing)', () => {
  test('no auth → 200, only published articles', async () => {
    const off = await officer();
    const publishedId = await insertArticle({
      officer_id: off.id,
      title_en: 'Published Article',
      status: 'published',
    });
    const draftId = await insertArticle({
      officer_id: off.id,
      title_en: 'Draft Article',
      status: 'draft',
    });

    const res = await request(app).get('/api/advisory');

    expect(res.status).toBe(200);
    const ids = res.body.articles.map((a) => a.id);
    expect(ids).toContain(publishedId);
    expect(ids).not.toContain(draftId);
  });

  test('?category=pest_control → returns filtered results', async () => {
    const off = await officer();
    const pestId = await insertArticle({
      officer_id: off.id,
      title_en: 'Pest Control Guide',
      category: 'pest_control',
      status: 'published',
    });
    const cropId = await insertArticle({
      officer_id: off.id,
      title_en: 'Crop Management Guide',
      category: 'crop_management',
      status: 'published',
    });

    const res = await request(app).get('/api/advisory?category=pest_control');

    expect(res.status).toBe(200);
    const ids = res.body.articles.map((a) => a.id);
    expect(ids).toContain(pestId);
    expect(ids).not.toContain(cropId);
    expect(res.body.articles.every((a) => a.category === 'pest_control')).toBe(true);
  });
});

describe('POST /api/advisory/:id/rate', () => {
  test('user without any chat/disease history → 403', async () => {
    const off = await officer();
    const id = await insertArticle({ officer_id: off.id, status: 'published' });
    const farmer = await makeUser();

    const res = await request(app)
      .post(`/api/advisory/${id}/rate`)
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ rating: 5 });

    expect(res.status).toBe(403);
  });

  test('user with chat history → 200', async () => {
    const off = await officer();
    const id = await insertArticle({ officer_id: off.id, status: 'published' });
    const farmer = await makeUser();

    // Give the farmer a completed chat session to unlock rating.
    await pool.query(
      "INSERT INTO chat_sessions (user_id, crop_type, district, language, status) VALUES (?, 'Rice', 'Kandy', 'en', 'completed')",
      [farmer.id]
    );

    const res = await request(app)
      .post(`/api/advisory/${id}/rate`)
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({ rating: 4 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Bookmarks', () => {
  test('POST /api/advisory/:id/bookmark → 200', async () => {
    const off = await officer();
    const id = await insertArticle({ officer_id: off.id, status: 'published' });
    const farmer = await makeUser();

    const res = await request(app)
      .post(`/api/advisory/${id}/bookmark`)
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('DELETE /api/advisory/:id/bookmark → removes bookmark', async () => {
    const off = await officer();
    const id = await insertArticle({ officer_id: off.id, status: 'published' });
    const farmer = await makeUser();

    await request(app)
      .post(`/api/advisory/${id}/bookmark`)
      .set('Authorization', `Bearer ${farmer.token}`)
      .send({});

    const res = await request(app)
      .delete(`/api/advisory/${id}/bookmark`)
      .set('Authorization', `Bearer ${farmer.token}`);

    expect(res.status).toBe(200);

    const [rows] = await pool.query(
      'SELECT * FROM bookmarks WHERE user_id = ? AND article_id = ?',
      [farmer.id, id]
    );
    expect(rows.length).toBe(0);
  });
});
