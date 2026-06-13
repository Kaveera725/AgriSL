// Maps an OpenAI SDK error to an HTTP status + user-facing message.
// `fallback` is returned for non-OpenAI errors (DB failures, JSON parse, etc.).
function openaiErrorResponse(err, fallback) {
  const status = err.status ?? err.statusCode;

  if (status === 401 || status === 403) {
    return {
      status: 500,
      message:
        'AI service authentication failed — check your AI API key in .env (AI_PROVIDER and the matching *_API_KEY) and restart the server.',
    };
  }

  if (status === 429) {
    // insufficient_quota is a billing problem, not a transient rate limit —
    // retrying will not help, so say so clearly.
    if (err.code === 'insufficient_quota' || err.type === 'insufficient_quota') {
      return {
        status: 503,
        message:
          'AI service unavailable: the OpenAI account has no remaining quota. Add billing/credits at platform.openai.com to enable AI features.',
      };
    }
    return {
      status: 503,
      message: 'AI service is busy (rate limited). Please try again in a moment.',
    };
  }

  if (status === 404) {
    return {
      status: 500,
      message: 'AI model not found — verify your OpenAI account has access to gpt-4o.',
    };
  }

  return { status: 500, message: fallback };
}

module.exports = { openaiErrorResponse };
