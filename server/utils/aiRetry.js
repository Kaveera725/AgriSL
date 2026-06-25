// The free AI tiers this app runs on (Gemini for vision + chat, Groq for chat)
// enforce tight per-minute rate limits and occasionally report the model as
// "overloaded". Both surface as transient HTTP errors (429 / 5xx) that clear on
// their own within a few seconds. Without a retry, a single burst of traffic —
// or one farmer double-clicking "Detect Disease" — turns into a user-facing
// "AI service is busy (rate limited)" 503. Backing off and retrying a couple of
// times converts almost all of these into a slightly slower success.
//
// SDK auto-retry is disabled on the clients (maxRetries: 0) so this is the only
// layer that retries — no nested/duplicated backoff.

// HTTP statuses worth retrying. 429 is retried EXCEPT when it is a hard quota
// exhaustion (insufficient_quota), which will never clear by waiting.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function isRetryable(err) {
  const status = err?.status ?? err?.statusCode;
  if (
    status === 429 &&
    (err.code === 'insufficient_quota' || err.type === 'insufficient_quota')
  ) {
    return false;
  }
  if (status && RETRYABLE_STATUS.has(status)) return true;
  // Network-level hiccups (dropped connection, DNS, timeout) are transient too.
  return (
    ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'].includes(err?.code) ||
    err?.name === 'APIConnectionError' ||
    err?.name === 'APIConnectionTimeoutError'
  );
}

// Honor an explicit server hint when present: OpenAI/Groq send a `Retry-After`
// header (in seconds). Capped at 20s so a single retry can't hang the request
// forever; falls back to exponential backoff when absent.
function retryAfterMs(err) {
  const h = err?.headers;
  const raw = typeof h?.get === 'function' ? h.get('retry-after') : h?.['retry-after'];
  const secs = Number(raw);
  if (!Number.isFinite(secs) || secs <= 0) return null;
  return Math.min(20000, secs * 1000);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs `fn()` (one chat.completions.create) and retries on transient failures.
// Exponential backoff with jitter: ~1.5s, ~3.3s, ~7.3s (+ up to 40% jitter),
// each capped at 15s, so a request waits at most ~15-20s before giving up.
async function withAIRetry(fn, { retries = 3, label = 'AI' } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      if (attempt > retries || !isRetryable(err)) throw err;

      const backoff = Math.min(15000, 1500 * Math.pow(2.2, attempt - 1));
      const jittered = Math.round(backoff + backoff * 0.4 * Math.random());
      const delay = retryAfterMs(err) ?? jittered;

      console.warn(
        `[${label}] transient AI error (status ${err.status ?? err.code ?? '?'}); ` +
          `retry ${attempt}/${retries} in ${delay}ms`
      );
      await sleep(delay);
    }
  }
}

module.exports = { withAIRetry };
