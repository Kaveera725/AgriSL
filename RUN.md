### Server (Terminal 1)

```bash
cd server
npm install
# Database
npm run migrate     # Create tables + seed 3 demo accounts

# Development
npm run dev          # Auto-reload with nodemon → http://localhost:5000
npm run start        # Run once (no auto-reload)   

# Verify server health
curl http://localhost:5000/api/health
# Expected: {"status":"ok","service":"AgriSL API"}
```

### Client (Terminal 2)

```bash
cd client
npm install

# Development
npm run dev          # Vite dev server → http://localhost:5173


npm run build        # Production bundle (outputs to client/dist/)
npm run preview      # Preview production build locally
npm run lint         # ESLint check
```

### ML Microservice (Terminal 3)

The Python FastAPI microservice lives in `ml-service/`. It loads the trained
MobileNetV2 Keras model (`ml-service/model/disease_model.keras`) and serves
image predictions at `POST /predict`.

```bash
cd ml-service

# ── First-time setup ──────────────────────────────────────────
# Requires Python 3.10+. Check version:
python --version
# or on some systems:
python3 --version

# (Recommended) Create an isolated virtual environment:
python -m venv venv

# Activate the virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
venv\Scripts\activate.bat


# macOS / Linux:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# ── Run the microservice ──────────────────────────────────────
uvicorn main:app --host 127.0.0.1 --port 8000
# → API:  http://127.0.0.1:8000
# → Docs: http://127.0.0.1:8000/docs  (Swagger UI — test /predict here)
# → Health check: http://127.0.0.1:8000/health

# Auto-reload during development (reloads on file save):
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# ── Verify the service is running ────────────────────────────
curl http://127.0.0.1:8000/health
# Expected: {"status":"ok"}

# ── Stop the service ─────────────────────────────────────────
# Press Ctrl+C in Terminal 3
```