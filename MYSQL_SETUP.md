# MySQL Local Setup Guide for AgriSL

## Step 1 — Install MySQL 8

1. Download the **MySQL Installer** from: https://dev.mysql.com/downloads/installer/
2. Run the installer and choose **"Developer Default"**
3. During setup set a **root password** (or leave blank — blank is fine for local dev)
4. Complete the installation. MySQL Server and MySQL Workbench will be installed.

---

## Step 2 — Verify MySQL is Running

Open **Command Prompt** and run:

```bash
mysql -u root -p
```

Enter your root password when prompted. You should see the `mysql>` prompt. Type `exit` to quit.

If `mysql` is not recognised, add MySQL to your PATH:
- Search **"Environment Variables"** in Windows Start
- Under **System Variables → Path**, add: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
- Restart your terminal

---

## Step 3 — Configure the Server `.env`

Open `server/.env` (copy from `server/.env.example` if it doesn't exist):

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_root_password_here
DB_NAME=agrisl
JWT_SECRET=pick_any_long_random_string_here
OPENAI_API_KEY=your_key_here
PORT=5000
```

- If you left the root password **blank** during install, set `DB_PASS=`
- `JWT_SECRET` can be any random string, e.g. `agrisl_jwt_secret_2026`

---

## Step 4 — Run the Migration

This creates the `agrisl` database, all 8 tables, and seeds 3 test users.

```bash
cd server
npm run migrate
```

Expected output:

```
Running schema from init.sql...
Schema created.
Seeded user: admin@agrisl.lk (admin)
Seeded user: farmer@agrisl.lk (farmer)
Seeded user: officer@agrisl.lk (officer)

Migration complete. Seed credentials:
  admin@agrisl.lk / admin123
  farmer@agrisl.lk / farmer123
  officer@agrisl.lk / officer123
```

---

## Step 5 — Start the Project

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

Open your browser at **http://localhost:5173**

---

## Test Credentials

| Role    | Email                  | Password   | Notes                        |
|---------|------------------------|------------|------------------------------|
| Admin   | admin@agrisl.lk        | admin123   | Full access                  |
| Farmer  | farmer@agrisl.lk       | farmer123  | Farmer dashboard access      |
| Officer | officer@agrisl.lk      | officer123 | Officer dashboard access     |

---

## Troubleshooting

**`ECONNREFUSED` error when running migrate:**
- MySQL service is not running. Open **Services** (Win+R → `services.msc`), find **MySQL80**, right-click → **Start**
- Or from Command Prompt (as Admin): `net start MySQL80`

**`Access denied for user 'root'`:**
- Wrong password in `.env`. Reset it in MySQL Workbench or run:
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
  ```

**`Unknown database 'agrisl'`:**
- Migration hasn't run yet. Run `npm run migrate` from the `server/` folder.

**Port 3306 already in use:**
- Another MySQL instance is running. Check via: `netstat -ano | findstr :3306`

**`npm run migrate` runs but login still gives Server error:**
- Restart the server after migration: stop with `Ctrl+C` then `npm run dev` again.
