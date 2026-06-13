const pool = require('../db/db');
const { client: openai, model: AI_MODEL } = require('../utils/openaiClient');
const { openaiErrorResponse } = require('../utils/openaiError');

const VALID_LANGUAGES = ['en', 'si'];

// Build the system prompt that locks the model to the right language and context.
function buildSystemPrompt(crop_type, district, language) {
  const disclaimer =
    language === 'si'
      ? 'වැදගත්: මෙය AI උපදෙස් වේ. වැදගත් තීරණ ගැනීමට කරුණාකර සුදුසුකම් ලත් කෘෂිකර්ම නිලධාරියෙකුගෙන් විමසන්න.'
      : 'Important: This is AI-generated advice. For important decisions please consult a qualified agricultural officer.';

  return `You are AgriSL, an expert agricultural advisor for Sri Lanka. The farmer is asking about ${crop_type} cultivation in ${district} district. Always respond ONLY in ${
    language === 'si' ? 'Sinhala language (සිංහල)' : 'English'
  }. Be specific to Sri Lankan farming conditions. End EVERY response with this disclaimer in the same language: ${disclaimer}`;
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
    // Verify the session belongs to this user and is still active.
    const [sessions] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [session_id, req.user.id]
    );
    const session = sessions[0];
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
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

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 800,
      messages: chatMessages,
    });

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
