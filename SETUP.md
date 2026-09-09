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

### Step 2.1 — Add MySQL to System PATH (Windows — do this once)

If `mysql` is not recognized in your terminal, add it to PATH first.

1. Press `Win + S` → search **"Environment Variables"** → click **Edit the system environment variables**
2. Click **Environment Variables** → under **System Variables**, select `Path` → click **Edit**
3. Click **New** and add:
   ```
   C:\Program Files\MySQL\MySQL Server 8.0\bin
   ```
4. Click **OK** on all dialogs
5. **Close and reopen your terminal** (PATH changes only apply to new windows)

Verify MySQL is now found:
```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell or CMD
mysql --version
```
Expected output:
```
mysql  Ver 8.0.xx Distrib 8.0.xx, for Win64 (x86_64)
```

---

### Step 2.2 — Start the MySQL Service

```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell (as Administrator)
net start MySQL80
```

Expected output:
```
The MySQL80 service is starting.
The MySQL80 service was started successfully.
```

> ℹ️ If you get "The service name is invalid", open `services.msc` (`Win + R` → type `services.msc`) and look for any service named **MySQL**. Use that name instead of `MySQL80`.

Verify MySQL is accepting connections:
```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell or CMD
mysql -u root -p --execute="SELECT 'MySQL is running!' AS status;"
```
Enter your root password when prompted. Expected output:
```
+---------------------+
| status              |
+---------------------+
| MySQL is running!   |
+---------------------+
```

---

### Step 2.3 — Create the `agrisl` Database User (Optional but Recommended)

By default the app connects as `root`. For better practice, create a dedicated user:

```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell or CMD
mysql -u root -p
```

Inside the MySQL prompt, run these commands one by one:

```sql
-- Create the database (safe to run even if it already exists)
CREATE DATABASE IF NOT EXISTS agrisl
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- (Optional) Create a dedicated app user instead of using root
-- Replace 'yourpassword' with a password of your choice
CREATE USER IF NOT EXISTS 'agrisl_user'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON agrisl.* TO 'agrisl_user'@'localhost';
FLUSH PRIVILEGES;

-- Confirm the database exists
SHOW DATABASES;

-- Exit the MySQL shell
EXIT;
```

> ℹ️ If you skip the dedicated user, keep using `root` and set `DB_USER=root` in your `.env`.
> If you created `agrisl_user`, set `DB_USER=agrisl_user` and `DB_PASS=yourpassword` in `.env`.

---

### Step 2.4 — Import the Developer Seed File

The file `server/db/agrisl_seed.sql` creates all 7 tables and inserts 3 official demo accounts.
**No real user data — safe to share with any developer.**

Choose the command that matches your terminal:

**▶ PowerShell (Windows — recommended):**
```powershell
# 📂 Run from: AgriSL/   |  Shell: PowerShell
# Using root:
Get-Content "server\db\agrisl_seed.sql" | mysql -u root -p

# Or using the dedicated user created above:
Get-Content "server\db\agrisl_seed.sql" | mysql -u agrisl_user -p
```

**▶ CMD (Windows):**
```cmd
REM  📂 Run from: AgriSL/   |  Shell: CMD
mysql -u root -p < server\db\agrisl_seed.sql
```

**▶ Git Bash / macOS / Linux:**
```bash
# 📂 Run from: AgriSL/   |  Shell: Bash
mysql -u root -p < server/db/agrisl_seed.sql
```

**▶ MySQL Workbench (GUI — no terminal needed):**
1. Open **MySQL Workbench** and connect to `localhost`
2. Go to **File → Open SQL Script**
3. Select `server/db/agrisl_seed.sql`
4. Press `Ctrl + Shift + Enter` (or click the ⚡ **Execute All** button)
5. Check the **Output** panel — all lines should show green ✅

Enter your password when prompted. You should see **no ERROR lines** in the output.

---

### Step 2.5 — Verify the Database is Ready

Connect to MySQL and run these verification queries:

```powershell
# 📂 Run from: anywhere  |  Shell: PowerShell or CMD
mysql -u root -p agrisl
```

Inside the MySQL prompt:

```sql
-- 1. Confirm you are in the right database
SELECT DATABASE();
-- Expected: agrisl

-- 2. List all tables (should be exactly 8 tables)
SHOW TABLES;
-- Expected output:
-- +-----------------------+
-- | Tables_in_agrisl      |
-- +-----------------------+
-- | advisory_articles     |
-- | article_ratings       |
-- | bookmarks             |
-- | chat_messages         |
-- | chat_sessions         |
-- | disease_reports       |
-- | notifications         |
-- | users                 |
-- +-----------------------+

-- 3. Confirm the 3 demo accounts exist
SELECT id, name, email, role FROM users;
-- Expected output:
-- +----+--------------+-------------------+---------+
-- | id | name         | email             | role    |
-- +----+--------------+-------------------+---------+
-- |  1 | Admin        | admin@agrisl.lk   | admin   |
-- |  2 | Test Farmer  | farmer@agrisl.lk  | farmer  |
-- |  3 | Test Officer | officer@agrisl.lk | officer |
-- +----+--------------+-------------------+---------+

-- 4. Exit the MySQL shell
EXIT;
```

If all 3 checks pass, your database is fully ready. ✅

---

### Step 2.6 — Test the Database Connection from Node.js

After setting up your `.env` in Step 3.2, you can test the connection with:

```bash
# 📂 Run from: AgriSL/server/   |  Shell: PowerShell, CMD, or Bash
node -e "require('./db/db').then ? require('./db/db').query('SELECT 1').then(()=>console.log('DB connected OK')).catch(e=>console.error('DB error:',e.message)) : console.log('Pool created')"
```

Or simply start the server (Step 3.3) — it will log `Database connected successfully` on startup.

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
