const fs = require('fs');
const path = require('path');
const pool = require('../db/db');
const { client: openai, model: AI_MODEL } = require('../utils/openaiClient');
const { openaiErrorResponse } = require('../utils/openaiError');

// Build an absolute URL to a stored upload so clients can render the image.
function imageUrl(req, filename) {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

// Strip markdown fences in case the model wraps its JSON despite instructions.
function parseModelJson(raw) {
  let text = (raw || '').trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  return JSON.parse(text);
}

// POST /api/disease
async function detect(req, res) {
  const { crop_type, district } = req.body;

  if (!crop_type || !district) {
    return res.status(400).json({ message: 'crop_type and district are required' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'An image file is required' });
  }

  try {
    const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` },
            },
            {
              type: 'text',
              text: `You are an expert plant pathologist advising Sri Lankan farmers. Analyze this image of a ${crop_type} plant from ${district} district, Sri Lanka.
      Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
      {
        "disease_name_en": "disease name in English or 'No disease detected'",
        "disease_name_si": "disease name in Sinhala or 'රෝගයක් හඳුනාගත නොහැකි විය'",
        "confidence": "High/Medium/Low",
        "symptoms_en": "observed symptoms description in English",
        "symptoms_si": "observed symptoms in Sinhala",
        "treatment_en": "detailed treatment recommendations in English",
        "treatment_si": "detailed treatment in Sinhala"
      }`,
            },
          ],
        },
      ],
    });

    let result;
    try {
      result = parseModelJson(completion.choices[0].message.content);
    } catch (parseErr) {
      console.error('detect parse error:', parseErr.message);
      return res.status(500).json({ message: 'Could not analyze image, please try again' });
    }

    const [insert] = await pool.query(
      `INSERT INTO disease_reports
       (user_id, crop_type, district, image_path, disease_name, confidence_level, symptoms, treatment_en, treatment_si)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        crop_type,
        district,
        req.file.filename,
        result.disease_name_en,
        result.confidence,
        result.symptoms_en,
        result.treatment_en,
        result.treatment_si,
      ]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_id)
       VALUES (?, 'disease_result', ?, ?)`,
      [
        req.user.id,
        `Disease detection complete: ${result.disease_name_en} identified in your ${crop_type}.`,
        insert.insertId,
      ]
    );

    return res.json({
      report_id: insert.insertId,
      image_url: imageUrl(req, req.file.filename),
      ...result,
    });
  } catch (err) {
    console.error('detect error:', err.status ?? '', err.code ?? '', err.message);
    const { status, message } = openaiErrorResponse(err, 'Could not analyze image, please try again');
    return res.status(status).json({ message });
  }
}

// POST /api/disease/share
async function shareWithOfficer(req, res) {
  const { report_id, officer_id } = req.body;

  if (!report_id || !officer_id) {
    return res.status(400).json({ message: 'report_id and officer_id are required' });
  }

  try {
    const [reports] = await pool.query(
      'SELECT * FROM disease_reports WHERE id = ? AND user_id = ?',
      [report_id, req.user.id]
    );
    const report = reports[0];
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await pool.query(
      'UPDATE disease_reports SET shared_with_officer = 1, officer_id = ? WHERE id = ?',
      [officer_id, report_id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_id)
       VALUES (?, 'disease_shared', ?, ?)`,
      [
        officer_id,
        `A farmer shared a disease report for ${report.crop_type} in ${report.district} for your review.`,
        report_id,
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('shareWithOfficer error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/disease/history
async function getHistory(req, res) {
  try {
    const [reports] = await pool.query(
      'SELECT * FROM disease_reports WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const withUrls = reports.map((r) => ({ ...r, image_url: imageUrl(req, r.image_path) }));
    return res.json({ reports: withUrls });
  } catch (err) {
    console.error('getHistory error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/disease/:id
async function getReport(req, res) {
  const reportId = req.params.id;

  try {
    const [reports] = await pool.query('SELECT * FROM disease_reports WHERE id = ?', [
      reportId,
    ]);
    const report = reports[0];
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Accessible by the owner, or the officer the report was shared with.
    const isOwner = report.user_id === req.user.id;
    const isAssignedOfficer = report.officer_id === req.user.id;
    if (!isOwner && !isAssignedOfficer) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({ report: { ...report, image_url: imageUrl(req, report.image_path) } });
  } catch (err) {
    console.error('getReport error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/disease/:id/reviewed  (officer only)
async function markReviewed(req, res) {
  const reportId = req.params.id;

  try {
    const [reports] = await pool.query('SELECT * FROM disease_reports WHERE id = ?', [
      reportId,
    ]);
    const report = reports[0];
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.officer_id !== req.user.id) {
      return res.status(403).json({ message: 'This report was not shared with you' });
    }

    await pool.query("UPDATE disease_reports SET status = 'reviewed' WHERE id = ?", [
      reportId,
    ]);

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_id)
       VALUES (?, 'disease_reviewed', ?, ?)`,
      [
        report.user_id,
        `An officer reviewed your disease report for ${report.crop_type}.`,
        reportId,
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('markReviewed error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  detect,
  shareWithOfficer,
  getHistory,
  getReport,
  markReviewed,
};
