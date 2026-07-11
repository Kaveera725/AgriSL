const pool = require('../db/db');

// Valid category enum values (must match advisory_articles.category in init.sql).
const VALID_CATEGORIES = [
  'crop_management',
  'pest_control',
  'seasonal_planting',
  'disease_treatment',
  'market_advice',
  'general',
];

const VALID_STATUSES = ['draft', 'published', 'archived'];

// Send a "new_article" notification to every farmer in one statement.
async function notifyFarmers(titleEn, articleId) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, related_id)
     SELECT id, 'new_article', ?, ? FROM users WHERE role = 'farmer'`,
    [`New advisory: ${titleEn} published by an agricultural officer.`, articleId]
  );
}

// POST /api/advisory  (requireOfficer)
async function createArticle(req, res) {
  const { title_en, title_si, content_en, content_si, category, tags, status } = req.body;

  // An article is valid if it has a complete title+content pair in at least one
  // language, so officers can publish English-only, Sinhala-only, or bilingual.
  const hasEn = Boolean(title_en && title_en.trim() && content_en && content_en.trim());
  const hasSi = Boolean(title_si && title_si.trim() && content_si && content_si.trim());
  if (!hasEn && !hasSi) {
    return res.status(400).json({
      message: 'A complete title and content in at least one language (English or Sinhala) are required',
    });
  }

  const cat = VALID_CATEGORIES.includes(category) ? category : 'general';
  // Accept any recognised status; default to 'draft' for unrecognised values.
  const articleStatus = VALID_STATUSES.includes(status) ? status : 'draft';

  try {
    const [result] = await pool.query(
      `INSERT INTO advisory_articles
       (officer_id, title_en, title_si, content_en, content_si, category, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title_en,
        title_si || null,
        content_en,
        content_si || null,
        cat,
        tags || null,
        articleStatus,
      ]
    );

    // Only notify farmers when the article goes live, never on a draft.
    if (articleStatus === 'published') {
      await notifyFarmers(title_en || title_si, result.insertId);
    }

    return res.status(201).json({
      article_id: result.insertId,
      message:
        articleStatus === 'published'
          ? 'Article published successfully'
          : articleStatus === 'archived'
          ? 'Article saved as archived'
          : 'Article saved as draft',
    });
  } catch (err) {
    console.error('createArticle error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/advisory/:id  (requireOfficer, own articles only)
async function updateArticle(req, res) {
  const articleId = req.params.id;

  try {
    const [rows] = await pool.query('SELECT * FROM advisory_articles WHERE id = ?', [
      articleId,
    ]);
    const article = rows[0];
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    if (article.officer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own articles' });
    }

    // Build the SET clause only from fields that were actually provided.
    const fields = [];
    const values = [];
    const body = req.body;

    // Resolve the article's language fields *after* this update (provided value
    // wins, otherwise keep the stored value) so we can enforce that at least one
    // complete language pair survives — English-only, Sinhala-only, or both.
    const trimOrNull = (v) => (v && v.trim() ? v.trim() : null);
    const nextTitleEn =
      body.title_en !== undefined ? trimOrNull(body.title_en) : article.title_en;
    const nextTitleSi =
      body.title_si !== undefined ? trimOrNull(body.title_si) : article.title_si;
    const nextContentEn =
      body.content_en !== undefined ? trimOrNull(body.content_en) : article.content_en;
    const nextContentSi =
      body.content_si !== undefined ? trimOrNull(body.content_si) : article.content_si;

    const hasEn = Boolean(nextTitleEn && nextContentEn);
    const hasSi = Boolean(nextTitleSi && nextContentSi);
    if (!hasEn && !hasSi) {
      return res.status(400).json({
        message: 'A complete title and content in at least one language (English or Sinhala) are required',
      });
    }

    if (body.title_en !== undefined) {
      fields.push('title_en = ?');
      values.push(nextTitleEn);
    }
    if (body.title_si !== undefined) {
      fields.push('title_si = ?');
      values.push(nextTitleSi);
    }
    if (body.content_en !== undefined) {
      fields.push('content_en = ?');
      values.push(nextContentEn);
    }
    if (body.content_si !== undefined) {
      fields.push('content_si = ?');
      values.push(nextContentSi);
    }
    if (body.category !== undefined) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      fields.push('category = ?');
      values.push(body.category);
    }
    if (body.tags !== undefined) {
      fields.push('tags = ?');
      values.push(body.tags || null);
    }

    let willPublish = false;
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      // Notify farmers only on the draft -> published transition.
      willPublish = body.status === 'published' && article.status === 'draft';
      fields.push('status = ?');
      values.push(body.status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    fields.push('updated_at = NOW()');
    values.push(articleId);

    await pool.query(
      `UPDATE advisory_articles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (willPublish) {
      await notifyFarmers(nextTitleEn || nextTitleSi, articleId);
    }

    const [updated] = await pool.query('SELECT * FROM advisory_articles WHERE id = ?', [
      articleId,
    ]);
    return res.json({ article: updated[0] });
  } catch (err) {
    console.error('updateArticle error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/advisory/:id  (requireOfficer, own articles or admin) — soft delete for officers, hard delete for admins.
async function deleteArticle(req, res) {
  const articleId = req.params.id;

  try {
    const [rows] = await pool.query(
      'SELECT officer_id FROM advisory_articles WHERE id = ?',
      [articleId]
    );
    const article = rows[0];
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    if (req.user.role !== 'admin' && article.officer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own articles' });
    }

    if (req.user.role === 'admin') {
      await pool.query('DELETE FROM advisory_articles WHERE id = ?', [articleId]);
    } else {
      await pool.query(
        "UPDATE advisory_articles SET status = 'archived', updated_at = NOW() WHERE id = ?",
        [articleId]
      );
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteArticle error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/advisory  (public) — list published articles with rating + officer name.
async function getArticles(req, res) {
  const { category, search } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  try {
    const where = ["a.status = 'published'"];
    const params = [];

    if (category && VALID_CATEGORIES.includes(category)) {
      where.push('a.category = ?');
      params.push(category);
    }
    if (search && search.trim()) {
      where.push('(a.title_en LIKE ? OR a.title_si LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const whereClause = where.join(' AND ');

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM advisory_articles a WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // limit/offset are validated integers, safe to interpolate.
    const [articles] = await pool.query(
      `SELECT a.id, a.title_en, a.title_si, a.category, a.tags, a.views, a.created_at,
              u.name AS officer_name, u.district AS officer_district,
              (SELECT ROUND(AVG(r.rating), 1) FROM article_ratings r WHERE r.article_id = a.id) AS average_rating,
              (SELECT COUNT(*) FROM article_ratings r WHERE r.article_id = a.id) AS total_ratings
       FROM advisory_articles a
       JOIN users u ON u.id = a.officer_id
       WHERE ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      articles,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('getArticles error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/advisory/:id  (public) — full article, increments views.
async function getArticle(req, res) {
  const articleId = req.params.id;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name AS officer_name, u.district AS officer_district,
              (SELECT ROUND(AVG(r.rating), 1) FROM article_ratings r WHERE r.article_id = a.id) AS average_rating,
              (SELECT COUNT(*) FROM article_ratings r WHERE r.article_id = a.id) AS total_ratings
       FROM advisory_articles a
       JOIN users u ON u.id = a.officer_id
       WHERE a.id = ?`,
      [articleId]
    );
    const article = rows[0];
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await pool.query('UPDATE advisory_articles SET views = views + 1 WHERE id = ?', [
      articleId,
    ]);
    article.views += 1;

    return res.json({ article });
  } catch (err) {
    console.error('getArticle error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/advisory/officer/mine  (requireOfficer) — own articles, all statuses.
async function getOfficerArticles(req, res) {
  try {
    const [articles] = await pool.query(
      `SELECT a.*,
              (SELECT ROUND(AVG(r.rating), 1) FROM article_ratings r WHERE r.article_id = a.id) AS average_rating,
              (SELECT COUNT(*) FROM article_ratings r WHERE r.article_id = a.id) AS total_ratings
       FROM advisory_articles a
       WHERE a.officer_id = ?
       ORDER BY a.updated_at DESC`,
      [req.user.id]
    );
    return res.json({ articles });
  } catch (err) {
    console.error('getOfficerArticles error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/advisory/:id/bookmark  (requireAuth)
async function bookmarkArticle(req, res) {
  const articleId = req.params.id || req.body.article_id;
  if (!articleId) {
    return res.status(400).json({ message: 'article_id is required' });
  }

  try {
    await pool.query(
      'INSERT IGNORE INTO bookmarks (user_id, article_id) VALUES (?, ?)',
      [req.user.id, articleId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('bookmarkArticle error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/advisory/:id/bookmark  (requireAuth)
async function removeBookmark(req, res) {
  const articleId = req.params.id || req.body.article_id;
  if (!articleId) {
    return res.status(400).json({ message: 'article_id is required' });
  }

  try {
    await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?', [
      req.user.id,
      articleId,
    ]);
    return res.json({ success: true });
  } catch (err) {
    console.error('removeBookmark error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/advisory/:id/rate  (requireAuth)
async function rateArticle(req, res) {
  const articleId = req.params.id || req.body.article_id;
  const rating = parseInt(req.body.rating, 10);

  if (!articleId) {
    return res.status(400).json({ message: 'article_id is required' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating must be between 1 and 5' });
  }

  try {
    // Gate ratings behind real platform usage: a completed chat or a disease report.
    const [[{ chat_count }]] = await pool.query(
      "SELECT COUNT(*) AS chat_count FROM chat_sessions WHERE user_id = ? AND status = 'completed'",
      [req.user.id]
    );
    const [[{ disease_count }]] = await pool.query(
      'SELECT COUNT(*) AS disease_count FROM disease_reports WHERE user_id = ?',
      [req.user.id]
    );

    if (chat_count === 0 && disease_count === 0) {
      return res.status(403).json({
        message: 'You must use the chatbot or disease detection before rating articles',
      });
    }

    // Confirm the article exists before recording a rating against it.
    const [articleRows] = await pool.query(
      'SELECT id FROM advisory_articles WHERE id = ?',
      [articleId]
    );
    if (!articleRows[0]) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await pool.query(
      `INSERT INTO article_ratings (article_id, user_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [articleId, req.user.id, rating]
    );

    const [[{ new_average }]] = await pool.query(
      'SELECT ROUND(AVG(rating), 1) AS new_average FROM article_ratings WHERE article_id = ?',
      [articleId]
    );

    return res.json({ success: true, new_average });
  } catch (err) {
    console.error('rateArticle error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/advisory/officer/pending-reports  (requireOfficer)
// Disease reports shared with this officer and still awaiting review. Lives here
// (rather than under /api/disease) to keep this feature fully additive.
async function getOfficerPendingReports(req, res) {
  try {
    const [reports] = await pool.query(
      `SELECT r.id, r.crop_type, r.district, r.image_path, r.disease_name,
              r.confidence_level, r.created_at, u.name AS farmer_name
       FROM disease_reports r
       JOIN users u ON u.id = r.user_id
       WHERE r.officer_id = ? AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const base = `${req.protocol}://${req.get('host')}/uploads/`;
    const withUrls = reports.map((r) => ({
      ...r,
      image_url: r.image_path ? base + r.image_path : null,
    }));

    return res.json({ reports: withUrls });
  } catch (err) {
    console.error('getOfficerPendingReports error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticles,
  getArticle,
  getOfficerArticles,
  getOfficerPendingReports,
  bookmarkArticle,
  removeBookmark,
  rateArticle,
};
