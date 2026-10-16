# AgriSL — ZIP Export, Friend's GitHub Push & Run Guide

This complete guide explains how to:
1. **Create a clean ZIP of the project on your computer (excluding the `.git` folder)**
2. **Push the project into your friend's GitHub repository directly from their computer**
3. **Set up and run the entire application (Database, Backend, Frontend, and ML service)**

---

## 📦 PART 1: Create a Clean ZIP (On Your Computer)

You must exclude the `.git/` folder (as well as heavy folders like `node_modules` and `.venv`) so the ZIP file is clean, small, and fast to transfer.

### Option A: Using `git archive` (Fastest & Recommended)
This creates a ZIP of all project files without `.git`, `node_modules`, or virtual environments:

1. Open PowerShell in your project folder (`AgriSL`):
   ```powershell
   # First stage and commit all latest changes
   git add .
   git commit -m "Prepare project for friend's repository"

   # Export to AgriSL-project.zip in your project directory
   git archive --format=zip HEAD -o AgriSL-project.zip
   ```
2. Your clean zip file `AgriSL-project.zip` is now created in your `AgriSL` root folder.

### Option B: PowerShell Command (If you have uncommitted files)
Run this command from your `AgriSL` folder in PowerShell:
```powershell
Compress-Archive -Path * -Exclude ".git*", "node_modules*", ".venv*" -DestinationPath "..\AgriSL-project.zip" -Force
```
*(This creates `AgriSL-project.zip` in the parent directory).*

---

### 📤 Transfer the ZIP to Your Friend
Send `AgriSL-project.zip` to your friend via:
* USB Flash Drive
* Google Drive / OneDrive
* WhatsApp / Telegram / WeTransfer

---

## 🚀 PART 2: Push to Friend's GitHub (On Friend's Computer)

Since you are doing this on your friend's computer, it will automatically use their GitHub login and account.

### Step 1: Create an Empty Repository on Friend's GitHub
1. On your friend's computer, log into their GitHub account at [github.com](https://github.com).
2. Click the **`+`** icon (top-right) → **New repository**.
3. Name the repository: e.g. `AgriSL`.
4. Choose **Public** or **Private**.
5. ⚠️ **CRITICAL:** **Do NOT check** "Add a README file", "Add .gitignore", or "Choose a license". Keep it completely empty!
6. Click **Create repository**.
7. Copy their repository URL:
   ```text
   https://github.com/<FRIEND_USERNAME>/<REPO_NAME>.git
   ```

---

### Step 2: Extract the ZIP
1. Extract `AgriSL-project.zip` into a folder on your friend's computer (e.g. `C:\Users\<Friend>\Projects\AgriSL`).
2. Make sure when you open the folder, you see:
   - `client/`
   - `server/`
   - `ml-service/`
   - `package.json` / documentation files

---

### Step 3: Initialize Git & Push to Friend's GitHub
1. Open **PowerShell** or **Git Bash** inside the extracted `AgriSL` folder.
2. Run these commands one by one:

```powershell
# 1. Initialize a brand new git repository
git init

# 2. Add all files to staging
git add .

# 3. Create your first commit
git commit -m "Initial commit of AgriSL platform"

# 4. Set default branch to main
git branch -M main

# 5. Link to your friend's GitHub repository
# (Replace with your friend's actual GitHub repo URL)
git remote add origin https://github.com/<FRIEND_USERNAME>/<REPO_NAME>.git

# 6. Push the project to GitHub
git push -u origin main
```

3. When prompted by GitHub:
   - A browser window or credential manager will pop up asking to authorize Git.
   - Click **Authorize / Sign in with Browser** using your friend's GitHub account.
4. Once completed, refresh your friend's GitHub repository page. The full project code is now uploaded and stored! 🎉

---

## 💻 PART 3: Complete Project Running Instructions

Follow these steps on your friend's computer (or any machine) to run the full application.

---

### 📋 Prerequisites Checklist
Ensure the following are installed:
1. **Node.js** (v20+ or v22 LTS): [Download Node.js](https://nodejs.org/)
2. **MySQL Server** (8.0+): [Download MySQL Installer](https://dev.mysql.com/downloads/installer/)
3. **Python** (3.10+): [Download Python](https://www.python.org/downloads/) *(Check "Add Python to PATH" during install)*
4. **Git**: [Download Git](https://git-scm.com/downloads)

Check them in terminal:
```powershell
node --version
npm --version
python --version
mysql --version
```

---

### Step 1: Database Setup (MySQL)

#### 1.1 Start MySQL Service
Open PowerShell as Administrator:
```powershell
net start MySQL80
```
*(If the service name is different on their PC, check in `services.msc` for the MySQL service name).*

#### 1.2 Import Database & Seed Data
From the root of `AgriSL`, run in PowerShell:
```powershell
Get-Content "server\db\agrisl_seed.sql" | mysql -u root -p
```
*(Enter the MySQL root password when prompted)*

If using Command Prompt (CMD):
```cmd
mysql -u root -p < server\db\agrisl_seed.sql
```

#### 1.3 Verify Database
```powershell
mysql -u root -p -e "USE agrisl; SHOW TABLES; SELECT id, name, email, role FROM users;"
```
You should see 8 tables and the 3 official demo accounts.

---

### Step 2: Start Backend Server (Terminal 1)

1. Open a terminal in `AgriSL/server`:
   ```powershell
   cd server
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create `.env` file:
   ```powershell
   cp .env.example .env
   ```

4. Open `server/.env` and update:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=agrisl
   PORT=5000

   # JWT Secrets
   JWT_SECRET=agrisl_jwt_secret_dev_key_12345
   JWT_ACCESS_SECRET=agrisl_access_secret_change_in_production
   JWT_REFRESH_SECRET=agrisl_refresh_secret_must_be_different
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d

   # AI Provider (gemini | openai | groq)
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here

   # ML Service URL
   ML_SERVICE_URL=http://localhost:8000
   ```

5. Run the backend:
   ```powershell
   npm run dev
   ```
   * Runs at: **`http://localhost:5000`**
   * Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Step 3: Start Frontend Client (Terminal 2)

1. Open a **new terminal** in `AgriSL/client`:
   ```powershell
   cd client
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Run the development server:
   ```powershell
   npm run dev
   ```
   * Open browser at: **`http://localhost:5173`**

---

### Step 4: (Optional) Start Python ML Microservice (Terminal 3)

The ML service handles disease classification using MobileNetV2.

1. Open a **third terminal** in `AgriSL/ml-service`:
   ```powershell
   cd ml-service
   ```

2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   *(If you get a script execution policy error in PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and then run the activate command again).*

3. Install requirements:
   ```powershell
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```powershell
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * ML Service: **`http://127.0.0.1:8000`**
   * Interactive API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🔑 Demo User Credentials

The database comes pre-loaded with these demo login accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@agrisl.lk` | `admin123` |
| **Farmer** | `farmer@agrisl.lk` | `farmer123` |
| **Officer** | `officer@agrisl.lk` | `officer123` |

---

## 🛠️ Summary of Services & Ports

| Service | Directory | Command | URL |
|---|---|---|---|
| **Backend API** | `server/` | `npm run dev` | `http://localhost:5000` |
| **Frontend UI** | `client/` | `npm run dev` | `http://localhost:5173` |
| **ML Microservice** | `ml-service/` | `uvicorn main:app ...` | `http://127.0.0.1:8000` |
| **MySQL Database** | — | `net start MySQL80` | `localhost:3306` |
