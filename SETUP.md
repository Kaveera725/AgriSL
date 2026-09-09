# AgriSL — Complete Developer Setup Guide

This guide walks you through setting up and running the **AgriSL** full-stack platform on a new developer computer from scratch.
Follow every numbered step in order — do not skip any step.

---

## 📋 System Prerequisites

Install the following tools **before** running any commands:

| # | Tool | Version | Download |
|---|------|---------|----------|
| 1 | **Git** | Any | [git-scm.com](https://git-scm.com/downloads) |
| 2 | **Node.js** | v20+ or v22 LTS | [nodejs.org](https://nodejs.org/) |
| 3 | **MySQL Server** | 8.0+ | [MySQL Installer (Windows)](https://dev.mysql.com/downloads/installer/) |
| 4 | **Code Editor** | — | VS Code (recommended) |

> To verify installations, open a terminal and run:
> ```bash
> git --version       # e.g. git version 2.44.0
> node --version      # e.g. v22.3.0
> npm --version       # e.g. 10.8.0
> mysql --version     # e.g. mysql  Ver 8.0.x
> ```

---

## Step 1 — Get the Project

Open a terminal (PowerShell, CMD, or Git Bash) and run:

```bash
# 📂 Run from: anywhere you want the project folder
git clone <YOUR_GITHUB_REPO_URL>
cd AgriSL
```

> If you already have the project as a ZIP, extract it and open a terminal inside the `AgriSL/` folder.

---

## Step 2 — Database Setup

### Step 2.1 — Start MySQL

Make sure MySQL is running before continuing.

**Windows:**
```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell (as Administrator)
net start MySQL80
```

Expected output:
```
The MySQL80 service is starting.
The MySQL80 service was started successfully.
```

> If the service name is different, open Windows **Services** (`Win + R` → `services.msc`) and find the MySQL entry.

---

### Step 2.2 — Restore the Developer Seed Database

The file `server/db/agrisl_seed.sql` contains the full schema + 3 official demo accounts.
**No real user data is included — it is safe to share.**

Choose the command that matches your terminal:

**▶ PowerShell (Windows — recommended):**
```powershell
# 📂 Run from: AgriSL/   |  Shell: PowerShell
Get-Content "server\db\agrisl_seed.sql" | mysql -u root -p
```

**▶ CMD / Git Bash / macOS / Linux:**
```bash
# 📂 Run from: AgriSL/   |  Shell: CMD or Bash
mysql -u root -p < server/db/agrisl_seed.sql
```

**▶ MySQL Workbench (GUI — no terminal needed):**
1. Open **MySQL Workbench** → connect to your local server
2. Go to **File → Open SQL Script**
3. Select `server/db/agrisl_seed.sql`
4. Click the ⚡ **Execute** button (or press `Ctrl+Shift+Enter`)

After the import, enter your password when prompted. You should see no errors.

---

### Step 2.3 — Verify the Database

Connect to MySQL and confirm everything was created:

```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell or CMD
mysql -u root -p
```

Then inside the MySQL prompt, run:

```sql
SHOW DATABASES;
-- Expected: 'agrisl' appears in the list

USE agrisl;

SHOW TABLES;
-- Expected: 7 tables listed:
--   advisory_articles, article_ratings, bookmarks,
--   chat_messages, chat_sessions, disease_reports,
--   notifications, users

SELECT id, name, email, role FROM users;
-- Expected: exactly 3 rows (admin, farmer, officer)
```

Type `exit` to leave the MySQL prompt.

---

## Step 3 — Backend (Server) Setup

> Open a **new terminal** in the `AgriSL/` root directory for all backend steps.

### Step 3.1 — Install Backend Dependencies

```bash
# 📂 Run from: AgriSL/   |  Shell: PowerShell, CMD, or Bash
cd server
npm install
```

Expected output ends with something like:
```
added 312 packages in 15s
```

---

### Step 3.2 — Create the Environment File

```powershell
# 📂 Run from: AgriSL/server/   |  Shell: PowerShell or CMD
copy .env.example .env
```

```bash
# 📂 Run from: AgriSL/server/   |  Shell: Bash / macOS / Linux
cp .env.example .env
```

Now open `server/.env` in your code editor and fill in your values:

```env
# ── Database ──────────────────────────────────────────────
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_root_password_here   # e.g. admin106
DB_NAME=agrisl

# ── JWT Secret (any random string) ────────────────────────
JWT_SECRET=agrisl_jwt_super_secret_key_2026

# ── AI Provider: gemini | groq | openai ───────────────────
AI_PROVIDER=gemini

# ── Google Gemini API Key (free, recommended) ─────────────
# Get yours at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# ── Optional providers ────────────────────────────────────
GROQ_API_KEY=
OPENAI_API_KEY=

# ── Server Port ───────────────────────────────────────────
PORT=5000
```

> ✅ At minimum, set `DB_PASS` and `GEMINI_API_KEY`. The app will not start correctly without these.

---

### Step 3.3 — Start the Backend Server

```bash
# 📂 Run from: AgriSL/server/   |  Shell: PowerShell, CMD, or Bash
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
Server running on port 5000
Database connected successfully
```

Verify it's working — open your browser and go to:
```
http://localhost:5000/api/health
```
Expected response: `{"status":"ok","service":"AgriSL API"}`

> **Keep this terminal open.** The backend must stay running while you use the app.

---

## Step 4 — Frontend (Client) Setup

> Open a **second, separate terminal** in the `AgriSL/` root directory. Do NOT close the backend terminal.

### Step 4.1 — Install Frontend Dependencies

```bash
# 📂 Run from: AgriSL/   |  Shell: PowerShell, CMD, or Bash
cd client
npm install
```

---

### Step 4.2 — Start the Frontend Dev Server

```bash
# 📂 Run from: AgriSL/client/   |  Shell: PowerShell, CMD, or Bash
npm run dev
```

Expected output:
```
  VITE v8.0.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and go to: **`http://localhost:5173`**

> **Keep this terminal open too.** You now have two running terminals — one for the server, one for the client.

---

## Step 5 — Demo Accounts

Log in immediately using any of these pre-seeded accounts:

| Role | Email | Password | What you can do |
|------|-------|----------|-----------------|
| **Admin** | `admin@agrisl.lk` | `admin123` | Full dashboard, manage users, approve officers, view stats |
| **Agricultural Officer** | `officer@agrisl.lk` | `officer123` | Write & publish advisory articles, review disease reports |
| **Farmer** | `farmer@agrisl.lk` | `farmer123` | Bilingual AI chatbot, crop disease detection, bookmark articles |

> All activity tables (chat history, disease reports, notifications…) start **empty**.
> Generate your own data by using the app normally after logging in.

---

## Step 6 — Test Key Features

| Feature | How to test |
|---------|-------------|
| **Language Switch** | Click **EN / සිං** toggle in the navbar |
| **AI Chatbot** | Login as farmer → `/chat` → select crop & district → send a message |
| **Disease Detection** | Login as farmer → `/disease-detection` → upload a leaf photo |
| **Advisory Articles** | Login as officer → create & publish an article |
| **Admin Panel** | Login as admin → view user list, approve/reject officer accounts |

---

## Step 7 — Troubleshooting

### ❌ `ER_ACCESS_DENIED_ERROR` (database connection refused)
- Open `server/.env` and verify `DB_PASS` matches your MySQL root password exactly (case-sensitive).
- Test connection manually:
  ```powershell
  mysql -u root -p
  ```

### ❌ `ECONNREFUSED 127.0.0.1:3306` (MySQL not running)
```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell (as Administrator)
net start MySQL80
```

### ❌ `The '<' operator is reserved for future use` (PowerShell seed import)
PowerShell does not support `<` for redirecting files into commands. Use the pipe instead:
```powershell
# 📂 Run from: AgriSL/   |  Shell: PowerShell
Get-Content "server\db\agrisl_seed.sql" | mysql -u root -p
```

### ❌ Port 5000 or 5173 already in use
- Backend port: change `PORT=5001` in `server/.env`, then restart the backend.
- Frontend port: Vite will automatically suggest the next free port (e.g. 5174).

### ❌ PowerShell script execution blocked
```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### ❌ `mysql` command not found
Add MySQL to your system PATH:
1. Search **"Environment Variables"** in the Windows Start menu
2. Under **System Variables**, find `Path` → click **Edit**
3. Click **New** and add: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
4. Click OK and **restart your terminal**

---

## Step 8 — Daily Development Commands

Once setup is done, use these two commands every day to start the project:

```powershell
# Terminal 1 — Backend
# 📂 Run from: AgriSL/server/   |  Shell: any
npm run dev
```

```powershell
# Terminal 2 — Frontend
# 📂 Run from: AgriSL/client/   |  Shell: any
npm run dev
```

Then open: **`http://localhost:5173`**
