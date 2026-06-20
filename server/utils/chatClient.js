const OpenAI = require('openai');

// Dedicated text-only client for the chatbot.
// Always uses Groq (free, 30 RPM) so chat never competes with Gemini's
// vision quota used by disease detection.
// Falls back to the main AI provider if GROQ_API_KEY is not set.
if (!process.env.GROQ_API_KEY) {
  console.warn(
    '[AI] GROQ_API_KEY not set — chat will fall back to the main AI provider (may hit rate limits shared with disease detection).'
  );
}

const useGroq = !!process.env.GROQ_API_KEY;

const client = useGroq
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      // Retries handled centrally in utils/aiRetry.js — see openaiClient.js.
      maxRetries: 0,
      timeout: 60_000,
    })
  : // Fallback: reuse the already-configured main provider client.
    require('./openaiClient').client;

const model = useGroq
  ? (process.env.CHAT_AI_MODEL || 'llama-3.3-70b-versatile')
  : require('./openaiClient').model;

module.exports = { client, model };
