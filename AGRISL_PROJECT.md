# AGRISL_PROJECT.md
# AgriSL — AI-Based Bilingual Farming Support Platform
# This file is the single source of truth for Claude Code.
# Read this file before touching any code in this project.

---

## 1. PROJECT IDENTITY

| Field | Value |
|-------|-------|
| Project Name | AgriSL |
| Full Title | AI-Based Bilingual Farming Support Web Platform for Sri Lanka |
| Student | W.M. Akash Shamika Wijekoon |
| Student ID | E195569 / K2635762 |
| Supervisor | Ms. Indumini |
| Institution | Kingston University — Top-Up Degree Programme |
| Submission Date | May 15, 2026 |
| Development Timeline | 3 weeks / 19 days / 10 sprints |

---

## 2. PROJECT PURPOSE

AgriSL solves a real problem: Sri Lankan farmers cannot get farming advice in their own language (Sinhala). Over 75% of rural farmers do not speak English fluently, yet all government agricultural resources are English-only. AgriSL fills this gap with:

- An AI chatbot that answers farming questions in Sinhala or English
- A crop disease detector that identifies plant diseases from photos
- An expert advisory portal where qualified agricultural officers publish bilingual guides
- A notification system and dashboards for all user types

---

## 3. TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Component UI, fast reload, Sinhala Unicode rendering |
| Frontend | Material UI (MUI) | Pre-built components, responsive layout, theming |
| Backend | Node.js + Express.js | REST API, routing, middleware |
| Database | MySQL 8 | Relational storage for all data |
| AI — Chatbot | OpenAI API (gpt-4o) | Bilingual EN/SI farming advice generation |
| AI — Disease | OpenAI API (gpt-4o Vision) | Crop disease identification from photos |
| Auth | JWT + bcrypt | Stateless auth, password hashing, role-based access |
| Fonts | Google Noto Sans Sinhala | Sinhala script rendering in browser |
| Version Control | Git + GitHub | Source control throughout development |
| Deployment | Localhost / Vercel | Dev on localhost, demo on Vercel |

**DO NOT** use TensorFlow.js or PlantNet API. Use GPT-4o Vision for disease detection instead — simpler and more accurate.

---

## 4. THEME & DESIGN CONSTANTS

```javascript
// MUI Theme — use these values everywhere, never deviate
primaryColor:   '#2E7D32'   // Green — main brand color
secondaryColor: '#F57F17'   // Amber — accent color
errorColor:     '#C62828'   // Red — errors and disease alerts
fontFamily:     'Roboto, Noto Sans Sinhala, sans-serif'

// Sinhala text — apply this font to ALL Sinhala content
sinhalaFont: "'Noto Sans Sinhala', Roboto, sans-serif"
```

Load in index.html:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
```

---

## 5. USER ROLES & PERMISSIONS

There are exactly 3 roles. Every route and UI element must respect this matrix.

| Feature | Farmer | Officer | Admin |
|---------|--------|---------|-------|
| Register account | ✅ auto-approved | ✅ pending approval | — |
| Login | ✅ | ✅ only if is_approved=1 | ✅ |
| Use AI chatbot | ✅ | ❌ | ❌ |
| Upload disease photo | ✅ | ❌ | ❌ |
| Browse advisory (public) | ✅ no login needed | ✅ | ✅ |
| Rate advisory articles | ✅ only after 1+ chat or disease session | ❌ | ❌ |
| Bookmark articles | ✅ | ❌ | ❌ |
| Share disease report with officer | ✅ | ❌ | ❌ |
| Create/edit advisory articles | ❌ | ✅ own articles only | ❌ |
| Review shared disease reports | ❌ | ✅ assigned reports | ❌ |
| View farmer dashboard | ✅ | ❌ | ✅ |
| View officer dashboard | ❌ | ✅ | ✅ |
| Approve officer accounts | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| View all platform data | ❌ | ❌ | ✅ |

**is_approved field rules:**
- Farmer registers → is_approved = 1 (immediate access)
- Officer registers → is_approved = 0 (blocked until admin approves)
- Admin approves officer → is_approved = 1, notification sent to officer
- Unapproved officer tries to login → 403 with message "Account pending admin approval"

---

## 6. DATABASE SCHEMA

All 8 tables. Never add or remove columns without updating this file.

```sql
-- Table 1: users
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('farmer','officer','admin') DEFAULT 'farmer',
  district VARCHAR(100) NOT NULL,
  is_approved TINYINT DEFAULT 1,  -- officers default 0
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: chat_sessions
CREATE TABLE chat_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  language ENUM('en','si') NOT NULL,
  status ENUM('active','completed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table 3: chat_messages
CREATE TABLE chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- Table 4: disease_reports
CREATE TABLE disease_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  disease_name VARCHAR(200),
  confidence_level VARCHAR(50),
  symptoms TEXT,
  treatment_en TEXT,
  treatment_si TEXT,
  shared_with_officer TINYINT DEFAULT 0,
  officer_id INT NULL,
  status ENUM('pending','reviewed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (officer_id) REFERENCES users(id)
);

-- Table 5: advisory_articles
CREATE TABLE advisory_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  officer_id INT NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_si VARCHAR(255),
  content_en LONGTEXT NOT NULL,
  content_si LONGTEXT,
  category ENUM('crop_management','pest_control','seasonal_planting','disease_treatment','market_advice','general') NOT NULL,
  tags VARCHAR(255),
  status ENUM('draft','published','archived') DEFAULT 'draft',
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (officer_id) REFERENCES users(id)
);

-- Table 6: article_ratings
CREATE TABLE article_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  article_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (article_id) REFERENCES advisory_articles(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_rating (article_id, user_id)
);

-- Table 7: notifications
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT DEFAULT 0,
  related_id INT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table 8: bookmarks
CREATE TABLE bookmarks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  article_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (article_id) REFERENCES advisory_articles(id),
  UNIQUE KEY unique_bookmark (user_id, article_id)
);
```

**Seed accounts (created by migrate.js):**

| Role | Email | Password | is_approved |
|------|-------|----------|-------------|
| admin | admin@agrisl.lk | admin123 | 1 |
| farmer | farmer@agrisl.lk | farmer123 | 1 |
| officer | officer@agrisl.lk | officer123 | 1 |

---

## 7. PROJECT FOLDER STRUCTURE

```
agrisl/
├── AGRISL_PROJECT.md          ← THIS FILE — read before coding
│
├── server/                    ← Node.js + Express backend
│   ├── server.js              ← Entry point, middleware, route registration
│   ├── .env                   ← Real env vars (git-ignored)
│   ├── .env.example           ← Template for env vars
│   ├── package.json
│   │
│   ├── db/
│   │   ├── db.js              ← MySQL2 pool, promise wrapper
│   │   ├── init.sql           ← All 8 CREATE TABLE statements + seeds
│   │   └── migrate.js         ← Runs init.sql, seeds test accounts
│   │
│   ├── middleware/
│   │   ├── auth.js            ← requireAuth, requireOfficer, requireAdmin
│   │   └── upload.js          ← Multer config (MIME filter, 5MB limit)
│   │
│   ├── controllers/
│   │   ├── authController.js       ← register, login, getMe, updateProfile
│   │   ├── chatController.js       ← startSession, sendMessage, completeSession, getHistory, getSession
│   │   ├── diseaseController.js    ← detect, shareWithOfficer, getHistory, getReport, markReviewed
│   │   ├── advisoryController.js   ← createArticle, updateArticle, deleteArticle, getArticles, getArticle, getOfficerArticles, bookmarkArticle, removeBookmark, rateArticle
│   │   ├── notificationController.js ← getNotifications, markRead, markAllRead
│   │   ├── dashboardController.js  ← getFarmerDashboard
│   │   └── adminController.js      ← getStats, getUsers, approveOfficer, changeUserRole, getAllArticles, getAllReports, deleteUser
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── diseaseRoutes.js
│   │   ├── advisoryRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── adminRoutes.js
│   │   └── userRoutes.js      ← GET /officers (public list of approved officers)
│   │
│   ├── uploads/               ← Disease report images (git-ignored)
│   └── tests/
│       ├── setup.js
│       ├── auth.test.js
│       ├── chat.test.js
│       ├── disease.test.js
│       ├── advisory.test.js
│       └── admin.test.js
│
├── client/                    ← React 18 + Vite frontend
│   ├── index.html             ← Noto Sans Sinhala font link here
│   ├── vite.config.js
│   ├── package.json
│   │
│   └── src/
│       ├── main.jsx           ← BrowserRouter + MUI ThemeProvider
│       ├── App.jsx            ← All routes defined here
│       │
│       ├── api/
│       │   └── axios.js       ← Axios instance, JWT interceptor
│       │
│       ├── context/
│       │   └── AuthContext.jsx ← user, token, login(), logout(), isAuthenticated
│       │
│       ├── components/
│       │   ├── Navbar.jsx          ← Role-based nav, bell icon, hamburger mobile
│       │   ├── ProtectedRoute.jsx  ← Auth guard, role guard, pending officer page
│       │   └── ChatMessage.jsx     ← Single chat bubble component
│       │
│       └── pages/
│           ├── Home.jsx               ← Landing page (public)
│           ├── Login.jsx              ← Login form
│           ├── Register.jsx           ← Register form
│           ├── NotFound.jsx           ← 404 page
│           ├── Chatbot.jsx            ← AI chatbot (farmer only)
│           ├── DiseaseDetection.jsx   ← Disease photo upload (farmer only)
│           ├── AdvisoryBrowse.jsx     ← Article list (public)
│           ├── AdvisoryDetail.jsx     ← Single article (public)
│           ├── farmer/
│           │   ├── FarmerDashboard.jsx    ← Chat history, disease reports, bookmarks
│           │   └── SessionView.jsx        ← Read-only chat session view
│           ├── officer/
│           │   ├── OfficerDashboard.jsx   ← Article management, disease reports
│           │   └── ArticleEditor.jsx      ← Create/edit bilingual articles
│           └── admin/
│               └── AdminDashboard.jsx     ← Stats, user management, all data
│
└── docs/
    ├── API.md                 ← All endpoints documented
    ├── ARCHITECTURE.md        ← Folder structure, DB schema, MVC pattern
    └── UAT_TEMPLATE.md        ← User acceptance testing template
```

---

## 8. ALL API ENDPOINTS

### Auth — /api/auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /register | None | Register farmer or officer |
| POST | /login | None | Login, returns JWT |
| GET | /me | requireAuth | Get current user from token |
| PUT | /profile | requireAuth | Update name and district |

### Chat — /api/chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /start | requireAuth | Create new chat session |
| POST | /message | requireAuth | Send message, get AI response |
| POST | /complete | requireAuth | Mark session completed, trigger notification |
| GET | /history | requireAuth | All sessions for current user |
| GET | /session/:id | requireAuth | One session + all messages (verify ownership) |

### Disease — /api/disease
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | / | requireAuth + multer | Upload image, get AI diagnosis |
| POST | /share | requireAuth | Share report with an officer |
| GET | /history | requireAuth | All reports for current user |
| GET | /:id | requireAuth | One report (owner or assigned officer) |
| PATCH | /:id/reviewed | requireOfficer | Officer marks report reviewed |

### Advisory — /api/advisory
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | / | None (public) | List published articles, search+filter |
| GET | /:id | None (public) | Single article, increments views |
| POST | / | requireOfficer | Create article |
| PUT | /:id | requireOfficer | Edit own article |
| DELETE | /:id | requireOfficer | Archive own article (soft delete) |
| GET | /officer/mine | requireOfficer | Officer's own articles all statuses |
| POST | /:id/bookmark | requireAuth | Bookmark article |
| DELETE | /:id/bookmark | requireAuth | Remove bookmark |
| POST | /:id/rate | requireAuth | Rate article (must have 1+ interaction) |

### Notifications — /api/notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | / | requireAuth | All notifications + unread count |
| PATCH | /:id/read | requireAuth | Mark one as read |
| PATCH | /read-all | requireAuth | Mark all as read |

### Dashboard — /api/dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /farmer | requireAuth | All farmer data in one call |

### Users — /api/users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /officers | None | List approved officers (id, name, district only) |

### Admin — /api/admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /stats | requireAdmin | Platform statistics |
| GET | /users | requireAdmin | All users paginated, searchable |
| PATCH | /users/:id/approve | requireAdmin | Approve officer account |
| PATCH | /users/:id/role | requireAdmin | Change user role |
| GET | /articles | requireAdmin | All articles all statuses |
| GET | /reports | requireAdmin | All disease reports |
| PATCH | /users/:id/deactivate | requireAdmin | Deactivate user |

---

## 9. NOTIFICATION TRIGGERS

Every notification event is listed here. If code creates a notification not on this list, it is wrong.

| Event | Recipient | type value | Message |
|-------|-----------|-----------|---------|
| Chat session completed | Farmer | chat_complete | "Your chat session about {crop_type} in {district} is complete and saved to your dashboard." |
| Disease detection done | Farmer | disease_result | "Disease detection complete: {disease_name} identified in your {crop_type}." |
| Farmer shares disease report | Officer | disease_shared | "A farmer shared a disease report for {crop_type} in {district} for your review." |
| Officer marks report reviewed | Farmer | report_reviewed | "Your {crop_type} disease report has been reviewed by an agricultural officer." |
| Officer publishes article | All farmers | new_article | "New advisory: {title_en} published by an agricultural officer." |
| Admin approves officer | Officer | account_approved | "Your AgriSL agricultural officer account has been approved. You can now log in and publish advisory content." |

---

## 10. OPENAI INTEGRATION DETAILS

### Chatbot System Prompt Template
```javascript
const systemPrompt = `You are AgriSL, an expert agricultural advisor for Sri Lanka. 
The farmer is asking about ${crop_type} cultivation in ${district} district. 
Always respond ONLY in ${language === 'si' ? 'Sinhala language (සිංහල)' : 'English'}.
Be specific to Sri Lankan farming conditions and climate.
Keep responses practical and actionable.
End EVERY response with this disclaimer in the same language: ${
  language === 'si' 
    ? 'වැදගත්: මෙය AI උපදෙස් වේ. වැදගත් තීරණ ගැනීමට කරුණාකර සුදුසුකම් ලත් කෘෂිකර්ම නිලධාරියෙකුගෙන් විමසන්න.' 
    : 'Important: This is AI-generated advice. For important decisions please consult a qualified agricultural officer.'
}`;
```

### Disease Detection Prompt Template
```javascript
const detectionPrompt = `You are an expert plant pathologist advising Sri Lankan farmers. 
Analyze this image of a ${crop_type} plant from ${district} district, Sri Lanka.
Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "disease_name_en": "disease name in English or 'No disease detected'",
  "disease_name_si": "disease name in Sinhala or 'රෝගයක් හඳුනාගත නොහැකි විය'",
  "confidence": "High/Medium/Low",
  "symptoms_en": "observed symptoms in English",
  "symptoms_si": "observed symptoms in Sinhala",
  "treatment_en": "detailed treatment recommendations in English",
  "treatment_si": "detailed treatment in Sinhala"
}`;
```

**OpenAI model:** Always use `gpt-4o` (not gpt-4, not gpt-3.5).
**max_tokens:** 800 for chatbot, 1200 for disease detection.

---

## 11. SECURITY RULES

These must be implemented exactly. Do not skip or weaken any of them.

1. **Passwords:** bcrypt with salt rounds = 10. Never store plaintext.
2. **JWT:** Signed with JWT_SECRET from .env. Expiry = 7 days. Payload: `{id, email, role, name, district, is_approved}`.
3. **File uploads:** Multer must reject non-image files (only image/jpeg and image/png) with 400 error. Max size 5MB. Store in /uploads/.
4. **SQL injection:** Never concatenate user input into SQL strings. Always use parameterized queries with mysql2 `?` placeholders.
5. **Input validation:** All POST/PUT endpoints validate required fields server-side. Return 400 with descriptive message if validation fails.
6. **Ownership checks:** Before any update/delete/read of user data, verify `WHERE id = ? AND user_id = req.user.id`.
7. **Role routes:** requireOfficer checks BOTH `role === 'officer'` AND `is_approved === 1`. requireAdmin checks `role === 'admin'`.
8. **Password excluded:** Never return `password_hash` in any API response. Explicitly exclude it in all SELECT queries.
9. **CORS:** Allow only localhost:5173 in development.
10. **Uploads folder:** Git-ignore the /uploads folder. Never commit uploaded images.

---

## 12. SRI LANKA DISTRICTS (All 25)

Use this exact list everywhere — in DB seeds, frontend Select dropdowns, and any hardcoded references:

```javascript
const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];
```

---

## 13. CROP TYPES (Use in chatbot and disease detection)

```javascript
const CROP_TYPES = [
  { en: 'Rice', si: 'වී' },
  { en: 'Tea', si: 'තේ' },
  { en: 'Coconut', si: 'පොල්' },
  { en: 'Rubber', si: 'රබර්' },
  { en: 'Vegetables', si: 'එළවළු' },
  { en: 'Fruits', si: 'පලතුරු' },
  { en: 'Spices', si: 'කුළුබඩු' },
  { en: 'Maize', si: 'ඉරිඟු' },
  { en: 'Onions', si: 'ළූණු' },
  { en: 'Chilli', si: 'මිරිස්' },
  { en: 'Other', si: 'වෙනත්' }
];
```

---

## 14. ARTICLE CATEGORIES

```javascript
const ARTICLE_CATEGORIES = [
  { value: 'crop_management', label: 'Crop Management' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'seasonal_planting', label: 'Seasonal Planting' },
  { value: 'disease_treatment', label: 'Disease Treatment' },
  { value: 'market_advice', label: 'Market Advice' },
  { value: 'general', label: 'General' }
];
```

---

## 15. ENVIRONMENT VARIABLES

```env
# server/.env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=agrisl
JWT_SECRET=agrisl_jwt_secret_change_in_production
OPENAI_API_KEY=sk-your-openai-key-here
PORT=5000
```

Client connects to: `http://localhost:5000/api`

---

## 16. SPRINT PLAN — 10 SPRINTS / 19 DAYS

| Sprint | Days | What Gets Built | Done When |
|--------|------|-----------------|-----------|
| S1 | Day 1 | Project scaffold, DB schema (8 tables), seeded accounts, Express server, Vite client | `node db/migrate.js` runs with no errors |
| S2 | Days 2–3 | Full auth: register, login, JWT middleware, role guards, Login/Register pages, AuthContext, ProtectedRoute | All 10 auth test cases pass |
| S3 | Days 4–5 | AI chatbot: startSession, sendMessage (OpenAI), completeSession, chat UI with bilingual support | Farmer can complete a full chat in EN and SI |
| S4 | Days 6–7 | Disease detection: image upload, GPT-4o Vision, bilingual result, share with officer feature | Farmer can upload photo and get bilingual diagnosis |
| S5 | Days 8–10 | Expert advisory portal: article CRUD (officer), public browse, ratings, bookmarks | Officer can publish article, farmer can browse and rate |
| S6 | Days 11–12 | Notifications (all 6 triggers) + Navbar bell + Farmer dashboard (3 tabs) | All notification events fire correctly |
| S7 | Days 13–14 | Admin panel: stats, user management, officer approval, all data tables | Admin can approve officer, view all platform data |
| S8 | Day 15 | Landing page, UI polish, loading skeletons, error handling, Sinhala font everywhere, 404 page | App builds with no console errors |
| S9 | Days 16–17 | Jest + Supertest tests for all modules, mock OpenAI, run and fix all failures | All tests pass: `npm test` green |
| S10 | Days 18–19 | README, API.md, ARCHITECTURE.md, JSDoc comments, UAT template | Documentation complete |

---

## 17. CODING PATTERNS — ALWAYS FOLLOW THESE

### Backend controller pattern
```javascript
// Every controller function follows this shape
export const functionName = async (req, res) => {
  try {
    // 1. Validate inputs
    // 2. Check ownership/permissions
    // 3. Query database with parameterized queries
    // 4. Return response
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('functionName error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

### Database query pattern
```javascript
// Always use parameterized queries — never string concatenation
const [rows] = await pool.query(
  'SELECT id, name, email FROM users WHERE id = ? AND role = ?',
  [userId, 'farmer']  // Values always in array, never in string
);
```

### Notification helper
```javascript
// Use this helper in every controller that creates notifications
const createNotification = async (userId, type, message, relatedId = null) => {
  await pool.query(
    'INSERT INTO notifications (user_id, type, message, related_id) VALUES (?, ?, ?, ?)',
    [userId, type, message, relatedId]
  );
};
```

### Frontend API call pattern
```javascript
// All API calls use the axios instance from src/api/axios.js
// The interceptor automatically attaches the JWT token
import api from '../api/axios';

const fetchData = async () => {
  try {
    setLoading(true);
    const { data } = await api.get('/endpoint');
    setData(data);
  } catch (error) {
    setError(error.response?.data?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};
```

### Sinhala text rendering
```jsx
// Apply this style to any container that may show Sinhala text
<Typography sx={{ fontFamily: "'Noto Sans Sinhala', Roboto, sans-serif" }}>
  {sinhalaContent}
</Typography>
```

---

## 18. COMMON MISTAKES TO AVOID

1. **Do not return password_hash in any response** — always exclude it explicitly
2. **Do not allow farmers to access /api/chat from officer accounts** — chatbot is farmer-only
3. **Do not allow ratings without prior interaction** — check chat_sessions or disease_reports count
4. **Do not send new_article notifications on draft save** — only when status becomes 'published'
5. **Do not use WidthType.PERCENTAGE in any MUI table** — use fixed widths
6. **Do not forget multer middleware on POST /api/disease** — route must include upload.single('image')
7. **Do not serve uploads folder before configuring it** — ensure `app.use('/uploads', express.static('uploads'))` is in server.js
8. **Do not let officers edit other officers' articles** — always check `officer_id = req.user.id`
9. **Do not skip the disclaimer in OpenAI chatbot responses** — it is required by the proposal
10. **Do not redirect admin to /dashboard** — admin goes to /admin after login

---

## 19. TEST ACCOUNTS (For Manual Testing)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@agrisl.lk | admin123 | Can access /admin |
| Farmer | farmer@agrisl.lk | farmer123 | Can use chatbot + disease detection |
| Officer | officer@agrisl.lk | officer123 | Can publish articles (pre-approved) |

To create a new unapproved officer for testing admin approval flow:
Register a new account with role = officer → login as admin → approve from /admin Users tab.

---

## 20. ROUTE STRUCTURE IN App.jsx

```jsx
// All routes — copy this exactly into App.jsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/advisory" element={<AdvisoryBrowse />} />
  <Route path="/advisory/:id" element={<AdvisoryDetail />} />

  {/* Farmer routes */}
  <Route path="/chatbot" element={<ProtectedRoute element={<Chatbot />} allowedRoles={['farmer','admin']} />} />
  <Route path="/chatbot/session/:id" element={<ProtectedRoute element={<SessionView />} allowedRoles={['farmer','admin']} />} />
  <Route path="/disease" element={<ProtectedRoute element={<DiseaseDetection />} allowedRoles={['farmer','admin']} />} />
  <Route path="/dashboard" element={<ProtectedRoute element={<FarmerDashboard />} allowedRoles={['farmer','admin']} />} />

  {/* Officer routes */}
  <Route path="/officer/dashboard" element={<ProtectedRoute element={<OfficerDashboard />} allowedRoles={['officer','admin']} />} />
  <Route path="/officer/articles/new" element={<ProtectedRoute element={<ArticleEditor />} allowedRoles={['officer','admin']} />} />
  <Route path="/officer/articles/:id/edit" element={<ProtectedRoute element={<ArticleEditor />} allowedRoles={['officer','admin']} />} />

  {/* Admin routes */}
  <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />} />

  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## 21. SERVER.JS STRUCTURE

```javascript
// server/server.js — register all routes in this order
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import diseaseRoutes from './routes/diseaseRoutes.js';
import advisoryRoutes from './routes/advisoryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));  // Serve uploaded images

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/disease', diseaseRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`AgriSL server running on port ${process.env.PORT || 5000}`);
});
```

---

## 22. ETHICAL & LEGAL REQUIREMENTS (Must be in the code)

From the project proposal — these are not optional:

1. **AI disclaimer in chatbot:** Every AI response must end with the disclaimer text (see Section 10). This is a proposal requirement.
2. **Disease detection disclaimer:** The DiseaseDetection.jsx result card must include the text: "This is a suggested diagnosis only. Please verify with a qualified agricultural officer before acting."
3. **Data minimisation:** Only collect name, email, district, password. No phone numbers, financial data, or location tracking.
4. **PDPA compliance note:** Registration form must include: "Your data is collected only for agricultural advisory purposes and will not be shared with third parties."
5. **Officer-only content:** Only accounts with role='officer' AND is_approved=1 can publish advisory content.

---

*End of AGRISL_PROJECT.md — This file covers everything Claude Code needs to build the complete system correctly.*