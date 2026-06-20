const OpenAI = require('openai');

// AI provider abstraction.
// Every provider below implements the OpenAI Chat Completions API, so the same
// `openai` SDK drives all of them — only the base URL, API key, and model name
// differ. Switch providers with AI_PROVIDER in .env; no code change required.
const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

const PROVIDERS = {
  // Paid. gpt-4o handles text + vision.
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: undefined, // SDK default (api.openai.com)
    defaultModel: 'gpt-4o',
  },
  // FREE tier via Google AI Studio. gemini-2.0-flash handles text + vision,
  // so both the chatbot and disease detection work on it. Get a key (no card
  // required) at https://aistudio.google.com/apikey
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.0-flash',
  },
  // FREE tier via Groq. Very fast, but text-only — disease detection (vision)
  // is not supported here, only the chatbot.
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
  },
};

const config = PROVIDERS[provider] || PROVIDERS.openai;

// Warn loudly but DON'T crash the server when the key is missing — the SDK
// constructor throws on an empty key, so fall back to a placeholder. Real API
// calls then fail with a 401 that openaiError.js turns into a friendly message.
if (!config.apiKey) {
  console.warn(
    `[AI] No API key configured for AI_PROVIDER="${provider}". ` +
      'Set the matching key in server/.env (e.g. GEMINI_API_KEY) and restart. ' +
      'Chatbot and disease detection will return an error until then.'
  );
}

const client = new OpenAI({
  apiKey: config.apiKey || 'no-key-configured',
  baseURL: config.baseURL,
  // Retries are handled centrally in utils/aiRetry.js (with provider-aware
  // backoff), so disable the SDK's own retry to avoid double/nested backoff.
  maxRetries: 0,
  // Vision calls can be slow; fail with a clean error rather than hang forever.
  timeout: 60_000,
});

// AI_MODEL overrides the provider's default if set.
const model = process.env.AI_MODEL || config.defaultModel;

module.exports = { client, model, provider };
