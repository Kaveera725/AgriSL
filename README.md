# AgriSL — AI-Based Bilingual Farming Support Platform for Sri Lanka

AgriSL is a web platform that gives Sinhala- and English-speaking Sri Lankan
farmers a single place to get **AI farming advice**, **crop-disease detection
from a photo**, and **verified expert advisory articles** — all bilingual
(English / සිංහල).

> Academic project — Kingston University Top-Up Degree Programme.
> Student: W.M. Akash Shamika Wijekoon (E195569 / K2635762).

---

## Features

| Module | What it does |
|--------|--------------|
| 🔐 **Auth & roles** | JWT login/registration, bcrypt password hashing, three roles (farmer / officer / admin), officer accounts require admin approval |
| 🌱 **AI bilingual chatbot** | Farmer supplies crop type + district + language; the AI answers in the chosen language and the full session is saved to history |
| 📷 **Crop disease detection** | Upload a crop photo → AI vision diagnosis with bilingual symptoms + treatment; reports can be shared with an officer for review |
| 📚 **Expert advisory portal** | Officers create/edit/publish bilingual articles (categories, tags, draft/published/archived); public browse with search, filter, pagination, ratings & bookmarks |
| 🔔 **Notifications** | In-app bell with unread badge and dropdown; fired on chat completion, disease results, shares/reviews, new articles, and officer approval |
| 📊 **Dashboards** | Farmer (history, saved results, bookmarks, profile), Officer (article management + pending review queue), Admin (platform stats, user/officer management, all articles & reports) |
| 🌐 **Bilingual UI toggle** | Global English / සිංහල switcher, persisted in `localStorage`, present on every page |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Material UI, React Router |
| Backend | Node.js, Express.js (MVC) |
| Database | MySQL 8 (`mysql2` promise pool) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| AI | OpenAI-compatible Chat Completions API — **Gemini** (free, default, text+vision), **Groq** (free, text only), or **OpenAI** (paid). Switchable via `AI_PROVIDER`. |
| Uploads | Multer (stored in `server/uploads/`) |
| Fonts | Roboto (English) + Noto Sans Sinhala (Sinhala) via Google Fonts |

> **Note on disease detection:** the proposal named TensorFlow.js / PlantNet, but
> the implementation uses an AI vision model (Gemini/OpenAI) through the same
> chat API. This delivers the same outcome — image → bilingual diagnosis +
> treatment — without training or hosting a separate model, and gives native
> Sinhala output.

---

## Project structure

```
AgriSL/
├── server/                 # Express API (API-only, no SSR)
│   ├── controllers/        # Business logic per module
│   ├── routes/             # Endpoint definitions
│   ├── middleware/         # requireAuth / requireOfficer / requireAdmin, upload
│   ├── db/                 # db.js pool, init.sql schema, migrate.js seeder
│   ├── utils/              # openaiClient.js (provider switch), error mapping
│   └── uploads/            # Uploaded crop images
└── client/                 # React + Vite SPA
    └── src/
        ├── pages/          # Home, Login, Register, Chatbot, DiseaseDetection,
        │                   #   Advisory*, farmer/ officer/ admin/ dashboards
        ├── components/     # Navbar, LanguageToggle, ProtectedRoute, ChatMessage
        ├── context/        # AuthContext, LanguageContext
        ├── i18n/           # translations.js (EN/SI UI dictionary)
        └── api/            # axios instance with auth interceptor
```

---

## Quick start

**Prerequisites:** Node 22+, MySQL 8+ (or Docker for an instant DB).

```bash
# 1. Server
cd server
cp .env.example .env        # then fill in DB creds, JWT secret, and an AI key
npm install
npm run migrate             # creates tables + seeds test users (idempotent)
npm run dev                 # http://localhost:5000

# 2. Client (separate terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

**Instant DB with Docker (no MySQL install):**
```bash
docker run -d -e MYSQL_ALLOW_EMPTY_PASSWORD=1 -p 3306:3306 mysql:8
```

**Seeded test accounts (after `npm run migrate`):**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@agrisl.lk` | `admin123` |
| Farmer | `farmer@agrisl.lk` | `farmer123` |
| Officer | `officer@agrisl.lk` | `officer123` |

---

## Environment variables (`server/.env`)

```
DB_HOST=localhost
DB_USER=root
DB_PASS=<your password>
DB_NAME=agrisl
JWT_SECRET=<random secret for signing JWTs>
AI_PROVIDER=gemini          # gemini | groq | openai
GEMINI_API_KEY=<free key from https://aistudio.google.com/apikey>
GROQ_API_KEY=<only when AI_PROVIDER=groq>
OPENAI_API_KEY=<only when AI_PROVIDER=openai>
AI_MODEL=                   # optional: override the provider default model
PORT=5000
```

---

## Bilingual / internationalisation

Two independent layers of bilingual support:

1. **UI chrome** — a global `LanguageContext` (`client/src/context/LanguageContext.jsx`)
   holds the active interface language and persists it to `localStorage`
   (`agrisl_lang`). The floating `LanguageToggle` (EN / සිං) appears on every page
   and updates navigation, the landing page, auth forms, and the advisory browser
   via the `t()` translator backed by `client/src/i18n/translations.js`.
2. **Content** — chat sessions and disease reports carry their own per-record
   language, and advisory articles store both `*_en` and `*_si` fields. The UI
   toggle decides which version a reader sees.

To translate another surface: import `useLanguage()`, add keys to
`i18n/translations.js`, and render `t('your.key')`.

---

## API overview

All protected routes expect `Authorization: Bearer <token>`.

| Area | Base path | Notable endpoints |
|------|-----------|-------------------|
| Auth | `/api/auth` | `register`, `login`, `me`, `profile` |
| Chat | `/api/chat` | `start`, `message`, `complete`, `history`, `session/:id` |
| Disease | `/api/disease` | `POST /` (upload), `share`, `history`, `:id`, `:id/reviewed` |
| Advisory | `/api/advisory` | CRUD, `:id/rate`, `:id/bookmark`, `officer/mine`, `officer/pending-reports` |
| Notifications | `/api/notifications` | list, `:id/read`, `read-all` |
| Dashboard | `/api/dashboard` | `farmer` |
| Admin | `/api/admin` | `stats`, `users`, `users/:id/approve`, `users/:id/role`, `articles`, `reports` |

---

## Project status

Mapped to the 11 phases of the project proposal:

| Phase | Status |
|-------|--------|
| 1. Project setup & DB schema | ✅ Complete |
| 2. Authentication & roles | ✅ Complete |
| 3. AI bilingual chatbot | ✅ Complete |
| 4. Crop disease detection | ✅ Complete (AI vision; see note above) |
| 5. Expert advisory portal | ✅ Complete |
| 6. Notification system | ✅ Complete |
| 7. Farmer dashboard | ✅ Complete |
| 8. Officer dashboard (+ admin panel) | ✅ Complete |
| 9. UI polish & bilingual toggle | ✅ Complete |
| 10. System-wide testing & UAT | ⏳ Pending (no automated tests / UAT yet) |
| 11. Documentation | 🟢 In progress (this README + inline docs; academic report pending) |

---

## License / academic note

Developed for Sri Lankan farmers as an academic project. Not affiliated with the
Sri Lanka Department of Agriculture. AI-generated advice is informational and is
**not** a substitute for a qualified agricultural officer — disclaimers to this
effect are built into the chatbot and disease-detection flows.
