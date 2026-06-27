const pool = require('../db/db');
const { client: openai, model: AI_MODEL } = require('../utils/chatClient');
const { openaiErrorResponse } = require('../utils/openaiError');
const { withAIRetry } = require('../utils/aiRetry');
const { getDistrictContext } = require('../utils/districtContext');

const VALID_LANGUAGES = ['en', 'si'];

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
      ? `Respond primarily in ${primaryLanguage} using fluent, natural Sri Lankan Sinhala with correct grammar, spelling, and proper Unicode. Avoid stiff literal translations; write the way people actually speak. When a technical term is commonly used in English (e.g. fertilizer brand names, "pH", "fungicide"), it is fine to keep it in English rather than forcing an awkward Sinhala translation. If the farmer mixes Sinhala and English, you may reply naturally in both.`
      : `Respond primarily in ${primaryLanguage}. If the farmer writes in Sinhala or mixes languages, you may reply naturally in the same mix.`;

  const styleGuidance = `
Communicate like a modern AI assistant such as ChatGPT: natural, professional, friendly, and easy to read.

Answer directly first, then explain only when it adds value. Avoid robotic phrasing and repetitive openings. Be accurate and factual, ask a clarifying question when the request is unclear, never invent information, and say so plainly when you are unsure.

Keep formatting minimal and let clean paragraphs carry the answer:
- Before replying, decide whether any Markdown is actually needed. If plain text reads well, use plain text.
- Prefer short, readable paragraphs with spacing between them. Avoid large walls of text. Keep replies mobile-friendly.
- Use a bullet or numbered list only for genuine steps, comparisons, features, or recommendations, never to break up ordinary sentences.
- Avoid bold. Use **bold** only for a rare critical warning, key term, or short section title, never for whole paragraphs or many words per sentence.
- Avoid headings (#, ##, ###). Add a short heading only when a long answer truly needs sections.
- Keep any code blocks unchanged and explain them in simple language. Use a table only when it genuinely improves understanding.

Priorities, in order: accuracy and usefulness, natural Sinhala/English communication, readability, minimal but effective formatting, and a professional user experience. Do not over-format.`;

  const ctx = getDistrictContext(district);
  const districtSection = ctx
    ? `
## ${district} District — Local Agricultural Context
- Zone: ${ctx.zone}
- Annual rainfall: ${ctx.rainfall}
- Elevation: ${ctx.elevation}
- Soils: ${ctx.soils}
- Main crops grown here: ${ctx.mainCrops.join(', ')}
- Growing seasons: ${ctx.seasons}
- Key local challenges: ${ctx.challenges}
- Irrigation: ${ctx.irrigation}
- Notes: ${ctx.notes}

Use this district data to give precise, locally relevant advice. Do not give generic Sri Lanka advice when district-specific guidance is possible. Tailor fertiliser schedules, pest warnings, irrigation advice, and variety recommendations to ${district}'s actual climate, soils, and seasons.`
    : '';

  return `You are AgriSL, an expert agricultural advisor for Sri Lanka. The farmer is asking about ${crop_type} cultivation in ${district} district.
${districtSection}

${languageGuidance}
${styleGuidance}

End EVERY response with this disclaimer in the same language as your reply: ${disclaimer}`;
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

    const assistantReply = completion.choices[0].message.content;

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
