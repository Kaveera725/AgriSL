const pool = require('../db/db');
const { client: openai, model: AI_MODEL } = require('../utils/chatClient');
const { openaiErrorResponse } = require('../utils/openaiError');
const { withAIRetry } = require('../utils/aiRetry');
const { getDistrictContext } = require('../utils/districtContext');
const { getCropContext } = require('../utils/cropContext');

const VALID_LANGUAGES = ['en', 'si'];

// Cleans raw markdown symbols (asterisks, hashtags, backticks) that render as unwanted symbols on the frontend
function cleanChatFormatting(text) {
  if (!text) return '';
  return text
    // Replace markdown headers (### Header) with a friendly marker
    .replace(/^#{1,6}\s*(.+)$/gm, '📌 $1')
    // Remove bold/italic markdown asterisks: **text** -> text, *text* -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    // Replace asterisk bullets with clean dot bullets
    .replace(/^\s*\*\s+/gm, '• ')
    // Remove markdown horizontal rules (--- or ___)
    .replace(/^[-_]{3,}\s*$/gm, '')
    // Remove backticks
    .replace(/`{1,3}/g, '')
    // Normalize excessive consecutive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Build the system prompt that locks the model to the right language and context.
function buildSystemPrompt(crop_type, district, language) {
  const disclaimer =
    language === 'si'
      ? 'වැදගත්: මෙය AI උපදෙස් වේ. වැදගත් තීරණ ගැනීමට කරුණාකර සුදුසුකම් ලත් කෘෂිකර්ම නිලධාරියෙකුගෙන් විමසන්න.'
      : 'Important: This is AI-generated advice. For important decisions please consult a qualified agricultural officer.';

  const primaryLanguage =
    language === 'si' ? 'Sinhala (සිංහල)' : 'English';

  const languageGuidance =
    language === 'si'
      ? `Respond primarily in ${primaryLanguage} using fluent, natural Sri Lankan Sinhala with correct grammar, spelling, and proper Unicode. Write the way agricultural officers and farmers speak in Sri Lanka. When a technical term is commonly used in English (e.g. fertilizer brand names like MOP/TSP, "pH", specific chemical or fungicide names), it is fine to keep it in English alongside Sinhala. If the farmer asks in a mix of Sinhala and English (Singlish or bilingual), reply naturally and clearly.`
      : `Respond primarily in ${primaryLanguage}. If the farmer writes in Sinhala or mixes languages, you may reply naturally in the same mix.`;

  const styleGuidance = `
You are AgriSL, an empathetic, highly knowledgeable agricultural advisor specifically dedicated to Sri Lankan farming communities.

Sri Lankan Agricultural Accuracy & Guidelines:
- Ground every piece of advice in official Sri Lankan agricultural practices from the Department of Agriculture (DOA), Coconut Research Institute (CRI), Tea Research Institute (TRI), Rubber Research Institute (RRISL), or Export Agriculture Department (DEA).
- Ground advice in the specific agro-ecological conditions of ${district} district (rainfall pattern, Maha/Yala seasons, soil types, irrigation sources).
- Recommend official Sri Lankan crop varieties (e.g. Bg/At varieties for paddy, MI varieties for chilli/maize, Vedalan for red onions, TRI clones for tea, CRIC for coconut, RRIC for rubber).
- Provide practical, locally accessible fertilizer recommendations (basal compost/cattle manure, Urea splits, TSP, MOP, Dolomite) and safe Integrated Pest Management (IPM).

Formatting Rules (STRICT - Prevent Unwanted Symbols):
- NEVER use asterisks for bolding (DO NOT write **word** or *word*). The user interface displays plain text, so markdown asterisks appear as ugly, broken symbols.
- NEVER use markdown hashtag headers (DO NOT write ### or ## or #).
- NEVER use asterisk bullets (DO NOT write * item). For lists, use neat bullet dots (•) or numbers (1., 2., 3.).
- NEVER use markdown horizontal rule lines (DO NOT write --- or ___).
- NEVER use markdown backticks or code blocks.

Tone & User-Friendly Emojis:
- Naturally use friendly, helpful agricultural and status emojis (e.g. 🌱, 🌾, 🚜, 💧, ☀️, 🍃, 🐛, 💡, 🩺, 🛡️, 🌧️, 📌) throughout your responses. This makes the chat welcoming, intuitive, and visually pleasant for farmers.
- Structure your response with clean line breaks and short, easy-to-read paragraphs suitable for mobile screens.`;

  const ctx = getDistrictContext(district);
  const districtSection = ctx
    ? `
District Agro-Ecological Profile for ${district}:
- Climatic Zone: ${ctx.zone}
- Annual Rainfall: ${ctx.rainfall}
- Elevation: ${ctx.elevation}
- Soil Types: ${ctx.soils}
- Main Local Crops: ${ctx.mainCrops.join(', ')}
- Cultivation Seasons: ${ctx.seasons}
- Key Local Agricultural Challenges: ${ctx.challenges}
- Irrigation Sources: ${ctx.irrigation}
- Local District Notes: ${ctx.notes}

Tailor all answers to ${district}'s specific climate, monsoon timing, soil characteristics, and water resources.`
    : '';

  const cropCtx = getCropContext(crop_type);
  const cropSection = cropCtx
    ? `
Crop / Plant Profile for ${crop_type} (${cropCtx.sinhalaName}):
- Responsible Research Institutes: ${cropCtx.institutes}
- Recommended Sri Lankan Varieties: ${JSON.stringify(cropCtx.recommendedVarieties)}
- Cultivation Seasons: ${cropCtx.seasons}
- Department of Agriculture Fertilizer Regimen: ${cropCtx.fertilizerDOA}
- Water & Irrigation Management: ${cropCtx.waterManagement}
- Pests & Disease Management (IPM): ${cropCtx.keyPestsAndDiseases}`
    : `Crop / Plant: ${crop_type} (Provide Sri Lanka Department of Agriculture standard advice for ${crop_type})`;

  return `You are AgriSL, an expert agricultural advisor for Sri Lanka. The farmer is asking about ${crop_type} cultivation in ${district} district.
${districtSection}
${cropSection}

${languageGuidance}
${styleGuidance}

End EVERY response with this disclaimer in the same language as your reply:
${disclaimer}`;
}

// POST /api/chat/start
async function startSession(req, res) {
  const { crop_type, district, language } = req.body;

  if (!crop_type || !district || !language) {
    return res
      .status(400)
      .json({ message: 'crop_type, district and language are required' });
  }
  if (!VALID_LANGUAGES.includes(language)) {
    return res.status(400).json({ message: "language must be 'en' or 'si'" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO chat_sessions (user_id, crop_type, district, language, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [req.user.id, crop_type, district, language]
    );

    return res.status(201).json({
      session_id: result.insertId,
      crop_type,
      district,
      language,
    });
  } catch (err) {
    console.error('startSession error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/chat/message
async function sendMessage(req, res) {
  const { session_id, message } = req.body;

  if (!session_id || !message || !message.trim()) {
    return res.status(400).json({ message: 'session_id and message are required' });
  }

  try {
    // Look the session up by id, then check ownership separately so a request
    // for someone else's session returns 403 (forbidden) rather than 404.
    const [sessions] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ?',
      [session_id]
    );
    const session = sessions[0];
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ message: 'This session has been completed' });
    }

    // Pull prior turns BEFORE inserting the new user message to avoid duplication.
    const [priorMessages] = await pool.query(
      'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC, id ASC',
      [session_id]
    );

    // Persist the incoming user message.
    await pool.query(
      "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
      [session_id, message]
    );

    const chatMessages = [
      {
        role: 'system',
        content: buildSystemPrompt(session.crop_type, session.district, session.language),
      },
      ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const completion = await withAIRetry(
      () =>
        openai.chat.completions.create({
          model: AI_MODEL,
          messages: chatMessages,
        }),
      { label: 'chat' }
    );

    const rawAssistantReply = completion.choices[0].message.content;
    const assistantReply = cleanChatFormatting(rawAssistantReply);

    // Persist the assistant reply.
    await pool.query(
      "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)",
      [session_id, assistantReply]
    );

    return res.json({ message: assistantReply, session_id });
  } catch (err) {
    console.error('sendMessage error:', err.status ?? '', err.code ?? '', err.message);
    const { status, message } = openaiErrorResponse(err, 'Could not get a response, please try again');
    return res.status(status).json({ message });
  }
}

// POST /api/chat/complete
async function completeSession(req, res) {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ message: 'session_id is required' });
  }

  try {
    const [sessions] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [session_id, req.user.id]
    );
    const session = sessions[0];
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await pool.query("UPDATE chat_sessions SET status = 'completed' WHERE id = ?", [
      session_id,
    ]);

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, related_id)
       VALUES (?, 'chat_complete', ?, ?)`,
      [
        req.user.id,
        `Your chat session about ${session.crop_type} in ${session.district} is complete and saved to your dashboard.`,
        session_id,
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('completeSession error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/chat/history
async function getHistory(req, res) {
  try {
    const [sessions] = await pool.query(
      `SELECT s.*, COUNT(m.id) AS message_count
       FROM chat_sessions s
       LEFT JOIN chat_messages m ON m.session_id = s.id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    return res.json({ sessions });
  } catch (err) {
    console.error('getHistory error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/chat/session/:id
async function getSession(req, res) {
  const sessionId = req.params.id;

  try {
    const [sessions] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.id]
    );
    const session = sessions[0];
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const [messages] = await pool.query(
      'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC, id ASC',
      [sessionId]
    );

    return res.json({ session, messages });
  } catch (err) {
    console.error('getSession error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  startSession,
  sendMessage,
  completeSession,
  getHistory,
  getSession,
};
