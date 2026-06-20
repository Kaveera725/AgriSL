const fs = require('fs');
const path = require('path');
const pool = require('../db/db');
const { client: openai, model: AI_MODEL } = require('../utils/openaiClient');
// Free, text-only model (Groq) for translating crop.health's English findings into
// Sinhala — separate quota from the vision model, so it never reintroduces the
// 503 bottleneck.
const { client: textClient, model: TEXT_MODEL } = require('../utils/chatClient');
const { openaiErrorResponse } = require('../utils/openaiError');
const { withAIRetry } = require('../utils/aiRetry');
const { identifyPlant } = require('../utils/plantNetClient');
const { assessHealth, enabled: cropHealthEnabled } = require('../utils/cropHealthClient');

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

// Map crop.health's 0–1 probability to the High/Medium/Low scale the UI expects.
function toConfidence(probability) {
  if (probability == null) return 'Medium';
  if (probability >= 0.65) return 'High';
  if (probability >= 0.4) return 'Medium';
  return 'Low';
}

// --- Detector A: AI vision model (Gemini/OpenAI) ---------------------------
// The original pipeline. Grounds the diagnosis on PlantNet's species ID and
// returns the parsed bilingual JSON. Used as the fallback when crop.health is not
// configured or its call fails.
async function detectWithAI(req, plant, crop_type, district) {
  const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });

  const plantNetHint = plant
    ? `\n      An automated plant-identification system (PlantNet) recognised this plant as ${plant.scientificName || plant.commonName}${plant.commonName ? ` (commonly "${plant.commonName}")` : ''}${plant.organ ? `, photographed organ: ${plant.organ}` : ''}, with a ${plant.scorePct}% match. Take this identification into account. If it clearly conflicts with the farmer-selected crop "${crop_type}", trust the visual evidence and mention the discrepancy in the symptoms.`
    : '';

  const completion = await withAIRetry(
    () =>
      openai.chat.completions.create({
        model: AI_MODEL,
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
                text: `You are an expert plant pathologist advising Sri Lankan farmers. Analyze this image of a ${crop_type} plant from ${district} district, Sri Lanka.${plantNetHint}
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
      }),
    { label: 'disease' }
  );

  return parseModelJson(completion.choices[0].message.content);
}

// crop.health replies in English only. Translate its findings to Sinhala with the
// free text model so the bilingual UI keeps working. Best-effort — the caller
// falls back to showing English in the Sinhala fields if this throws.
async function translateToSinhala({ disease_name_en, symptoms_en, treatment_en }) {
  const prompt = `Translate the following plant-disease information into natural, fluent Sri Lankan Sinhala.
Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{"disease_name_si":"...","symptoms_si":"...","treatment_si":"..."}

disease_name: ${disease_name_en}
symptoms: ${symptoms_en}
treatment: ${treatment_en}`;

  const completion = await withAIRetry(
    () =>
      textClient.chat.completions.create({
        model: TEXT_MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
    { label: 'disease-translate' }
  );

  return parseModelJson(completion.choices[0].message.content);
}

// --- Detector B: Kindwise crop.health --------------------------------------
// Turns a crop.health result into the same bilingual shape the rest of the
// pipeline (DB insert + client) already expects.
async function buildResultFromCropHealth(health) {
  const disease_name_en = health.isHealthy
    ? 'No disease detected'
    : health.name || 'Unknown condition';
  const symptoms_en =
    health.symptoms ||
    (health.isHealthy ? 'No visible signs of disease were detected.' : '');
  const treatment_en =
    health.treatment ||
    (health.isHealthy
      ? 'No treatment needed. Continue good agricultural practices.'
      : 'Consult a local agricultural officer for a treatment plan.');

  // English defaults for the Sinhala fields; replaced by a translation when one
  // is available, so a rate-limited translator never fails the whole request.
  let disease_name_si = health.isHealthy ? 'රෝගයක් හඳුනාගත නොහැකි විය' : disease_name_en;
  let symptoms_si = symptoms_en;
  let treatment_si = treatment_en;

  try {
    const si = await translateToSinhala({ disease_name_en, symptoms_en, treatment_en });
    disease_name_si = si.disease_name_si || disease_name_si;
    symptoms_si = si.symptoms_si || symptoms_si;
    treatment_si = si.treatment_si || treatment_si;
  } catch (err) {
    console.warn('[crop.health] Sinhala translation failed, using English fallback:', err.message);
  }

  return {
    disease_name_en,
    disease_name_si,
    confidence: toConfidence(health.probability),
    symptoms_en,
    symptoms_si,
    treatment_en,
    treatment_si,
  };
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
    // Identify the plant species with PlantNet (real ML) for the on-screen
    // identification chip and to ground the AI fallback. Null when disabled or
    // unrecognised.
    const plant = await identifyPlant(req.file.path, req.file.mimetype);

    // Disease diagnosis. Prefer crop.health (purpose-built crop-disease ML on
    // its own quota) when a key is configured, so detection no longer depends on
    // the AI vision provider that was returning 503s. Fall back to the AI vision
    // model when crop.health is not configured or returns no usable result.
    let result = null;
    if (cropHealthEnabled()) {
      const health = await assessHealth(req.file.path, req.file.mimetype);
      if (health) result = await buildResultFromCropHealth(health);
    }
    if (!result) {
      result = await detectWithAI(req, plant, crop_type, district);
    }

    // Persisted, human-readable PlantNet identification, e.g.
    // "Coconut palm (Cocos nucifera) — 56% match". Null when not identified.
    const identifiedSpecies = plant
      ? `${plant.label}${plant.scorePct != null ? ` — ${plant.scorePct}% match` : ''}`
      : null;

    const [insert] = await pool.query(
      `INSERT INTO disease_reports
       (user_id, crop_type, district, image_path, identified_species, disease_name, confidence_level, symptoms, treatment_en, treatment_si)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        crop_type,
        district,
        req.file.filename,
        identifiedSpecies,
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
      plantnet: plant, // { commonName, scientificName, organ, scorePct, label } | null
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
