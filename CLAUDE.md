# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Prerequisites:** Node 22+, MySQL 8+ (or Docker for quick DB setup)

```bash
# Terminal 1: Server
cd server
npm run migrate    # One-time: creates tables and seeds test users
npm run dev        # Starts on http://localhost:5000

# Terminal 2: Client
cd client
npm run dev        # Starts on http://localhost:5173
```

**Instant DB** (no MySQL install needed):
```bash
docker run -d -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -p 3306:3306 mysql:8
```

**Test credentials after migration:**
- Admin: `admin@agrisl.lk` / `admin123` (role: admin)
- Farmer: `farmer@agrisl.lk` / `farmer123` (role: farmer)
- Officer: `officer@agrisl.lk` / `officer123` (role: officer, requires admin approval to activate)

## Architecture

**Monorepo Structure:**
- `server/` — Express.js + MySQL backend; handles auth, file uploads, AI chat, disease detection, advisory articles
- `client/` — React 19 + Vite SPA; Material UI (green primary `#2E7D32`, amber secondary `#F57F17`); supports Sinhala (Noto Sans Sinhala) + English

**Database Schema (8 tables):**
1. **users** — farmers, officers, admins; includes role-based access control, approval status for officers
2. **chat_sessions** — AI chatbot sessions (crop advice, language: en/si)
3. **chat_messages** — individual messages in a session (role: user/assistant)
4. **disease_reports** — crop disease detection (with image, AI confidence, treatments in both languages, officer assignment)
5. **advisory_articles** — articles authored by officers (bilingual, categories: crop management, pest control, seasonal planting, etc.)
6. **article_ratings** — user ratings (1-5) on articles (one per user per article)
7. **bookmarks** — user bookmarks of articles (one per user per article)
8. **notifications** — system notifications to users

**Authentication:**
- JWT tokens stored in `localStorage` as `agrisl_token`
- Bearer token attached to all API requests via axios interceptor (`client/src/api/axios.js`)
- Tokens issued on login, validated server-side

**File Uploads:**
- Multer configured; files stored in `server/uploads/`
- Served at `GET /uploads/<filename>`

## Server API Structure

- `routes/` — Endpoint definitions (auth, chat, disease detection, articles, etc.)
- `controllers/` — Business logic for each route
- `middleware/` — JWT auth/role guards (`auth.js`) and image-upload handling (`upload.js`)
- `db/` — Database connection pool (`db.js`), schema (`init.sql`), migration runner (`migrate.js`)
- `.env` — Database credentials, JWT secret, OpenAI API key, port

**Key env vars:**
```
DB_HOST=localhost
DB_USER=root
DB_PASS=<password>
DB_NAME=agrisl
JWT_SECRET=<random secret for signing JWTs>
AI_PROVIDER=gemini            # openai | gemini | groq
GEMINI_API_KEY=<free key from aistudio.google.com/apikey>
GROQ_API_KEY=<free key from console.groq.com — powers chat + Sinhala translation>
OPENAI_API_KEY=<only used when AI_PROVIDER=openai>
PLANTNET_API_KEY=<free key from my.plantnet.org — optional; grounds disease detection>
CROP_HEALTH_API_KEY=<free key from admin.kindwise.com — optional; PRIMARY disease detector>
PORT=5000
```

**Disease detection — two detectors (`/api/disease`):** The endpoint picks its
diagnosis engine at request time:
1. **Kindwise crop.health** (`server/utils/cropHealthClient.js`) — the PRIMARY,
   purpose-built crop-disease ML. Used whenever `CROP_HEALTH_API_KEY` is set (free
   key from https://admin.kindwise.com). It returns the crop species plus ranked
   disease suggestions + probabilities + treatment text (prevention / chemical /
   biological), in English, so detection no longer depends on the AI vision
   provider's free-tier quota — which was the cause of the 503 "AI service is
   busy" errors. Its English findings are translated to Sinhala with the free text
   model (Groq, separate quota); if translation fails, English is shown in the
   Sinhala fields. ("healthy" is one of crop.health's ranked suggestions — when it
   ranks top, the report shows "No disease detected".)
2. **AI vision model** (Gemini/OpenAI via `openaiClient.js`) — the FALLBACK, used
   when `CROP_HEALTH_API_KEY` is unset or the crop.health call returns nothing.
   This is the original hybrid pipeline (PlantNet species ID → vision prompt).

All AI calls go through `server/utils/aiRetry.js` (`withAIRetry`), which retries
transient 429/5xx rate-limit/overload errors with exponential backoff so brief
free-tier limits recover automatically instead of failing the request.

**PlantNet (species grounding):** Before the AI diagnosis, `/api/disease` calls
PlantNet (`server/utils/plantNetClient.js`) to identify the plant *species* from
the uploaded photo. PlantNet does **not** diagnose diseases — it returns the
species + a match score, which is (a) fed into the AI vision prompt to ground the
diagnosis on the correct plant and (b) stored on the report (`identified_species`)
and returned to the client as a `plantnet` object. It degrades gracefully: if
`PLANTNET_API_KEY` is unset, the plant can't be recognised, or the call fails,
`identifyPlant()` returns `null` and detection falls back to AI-only. PlantNet is
skipped entirely under `NODE_ENV=test`.

**AI provider switch:** `server/utils/openaiClient.js` selects the AI backend from
`AI_PROVIDER`. All providers speak the OpenAI Chat Completions API, so the same
`openai` SDK is reused — only base URL, key, and model differ. `gemini` (default)
is free and supports both chat and vision (disease detection); `groq` is free but
text-only (chat only); `openai` is paid. Override the model with `AI_MODEL`.

## Client Structure

- `src/main.jsx` — React root with BrowserRouter, MUI ThemeProvider
- `src/App.jsx` — Placeholder for main routing
- `src/api/axios.js` — Pre-configured axios instance (baseURL: `http://localhost:5000/api`, auth interceptor)
- `src/index.css`, `App.css` — Global styles
- Font imports: Roboto (en), Noto Sans Sinhala (si)

**Bilingual note:** App supports both English and Sinhala; the advisory articles and chat endpoints accept a `language` param (en/si). Font stack in theme ensures both render correctly.

## Common Commands

### Server

```bash
cd server

# Development
npm run dev          # Auto-reload with nodemon
npm run start        # Run once

# Database
npm run migrate      # Create tables + seed test users

# Package.json scripts
npm install <package>
```

### Client

```bash
cd client

# Development
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production bundle
npm run preview      # Preview built bundle locally
npm run lint         # ESLint
```

## Key Design Notes

1. **Separate concerns:** Server is API-only; client is a pure SPA (no server-side rendering). They communicate via REST + JSON.

2. **Officer approval flow:** Officers sign up with `is_approved=0` by default (see `users` table). Only admins can approve them. Farmers default to `is_approved=1`.

3. **Disease detection integration:** `/api/disease` runs a hybrid pipeline — PlantNet identifies the plant species (real ML, stored in `identified_species`), then the AI vision model uses that ID to fill `disease_name`, `confidence_level`, `symptoms`, and `treatment_*` in both languages. See the PlantNet note under *Server API Structure*.

4. **Chat sessions are language-scoped:** Each session has a `language` (en/si). Messages in a session should be in that language.

5. **Uploads are relative to `server/uploads/`:** Ensure `server/uploads/.gitkeep` exists so the folder is tracked by git. Actual uploads are in `.gitignore`.

6. **No static frontend serving from Express:** The client runs on its own dev server (`:5173`) during development. In production, the client would be built and served separately (or proxied via nginx, etc.).

## Database Tips

- **Idempotent migration:** `db/migrate.js` uses `INSERT ... ON DUPLICATE KEY UPDATE` for seeding, so re-running it is safe.
- **Promise-based queries:** `db/db.js` exports a promise pool. Use `const [[rows]] = await pool.query(sql, [params])` or `const [rows] = await pool.query(...)` depending on whether you expect a single row or multiple.
- **Foreign keys enabled:** All relationships use `ON DELETE CASCADE` or `ON DELETE SET NULL` for data integrity.

## Common Patterns

**Auth check in a route:**
```javascript
// Assume a middleware like:
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};
```

**Role-based checks:**
```javascript
const isOfficer = (req, res, next) => {
  if (req.user.role !== 'officer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Officers only' });
  }
  next();
};
```

**Client-side API call:**
```javascript
import api from './api/axios';

// Token is auto-attached by interceptor
const { data } = await api.post('/auth/login', { email, password });
localStorage.setItem('token', data.token);

// Subsequent calls include Authorization header
const { data: articles } = await api.get('/articles');
```

## Notes for Future Dev

- AI calls use the provider selected by `AI_PROVIDER` (default `gemini`, free). Chat (`/api/chat`) and disease detection (`/api/disease`) both go through `server/utils/openaiClient.js`; only `gemini`/`openai` support vision (disease detection).
- All major pages are implemented: Login, Register, Home, Chatbot (`/chatbot`), Disease Detection (`/disease`), Advisory browse/detail, and the Farmer, Officer, and Admin dashboards.
- **Bilingual UI (i18n):** a global `LanguageContext` (`client/src/context/LanguageContext.jsx`) + dictionary (`client/src/i18n/translations.js`) drive a persisted English/Sinhala toggle. The floating `<LanguageToggle/>` is rendered once in `App.jsx`. Use `const { t } = useLanguage()` and `t('area.key')` to translate a surface; the advisory pages read `lang` from the same context. This is separate from *content* language (chat/disease per-record, articles `*_en`/`*_si`).
- No tests are wired up yet; consider Jest + Supertest (server) and Vitest (client) when needed.
- The `.gitignore` excludes `.env` and `uploads/*` by design; check it before committing.
- Officers list is exposed at `GET /api/users/officers` (requireAuth); used by Disease Detection share dialog.
