# Dependencies & Requirements

## Backend: requirements.txt

Copy this to `backend/requirements.txt`:

```
# Core Framework
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1

# Environment
python-dotenv==1.0.0

# OCR & Computer Vision
paddleocr==2.7.0.3
opencv-python==4.8.1.78
pdf2image==1.16.3
Pillow==10.1.0

# AI/LLM
google-generativeai==0.3.0
requests==2.31.0

# Data Processing
numpy==1.24.3
pandas==2.1.3
openpyxl==3.11.0

# PDF Generation
reportlab==4.0.7
weasyprint==59.2

# Validation
pydantic==2.5.0
pydantic-settings==2.1.0

# Utilities
python-jose==3.3.0
bcrypt==4.1.1
cryptography==41.0.7

# Logging
python-json-logger==2.0.7

# Testing (optional)
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
```

## Frontend: package.json

Copy this to `frontend/package.json`:

```json
{
  "name": "exam-grading-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.4",
    "tailwindcss": "^3.3.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5"
  }
}
```

---

# Installation Instructions

## Backend Setup

### 1. Create Virtual Environment

```bash
cd backend

# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Verify Installation

```bash
# Check FastAPI
python -c "import fastapi; print(f'FastAPI {fastapi.__version__} ✓')"

# Check PaddleOCR
python -c "from paddleocr import PaddleOCR; print('PaddleOCR ✓')"

# Check Gemini
python -c "import google.generativeai; print('Gemini ✓')"
```

### 4. Create Required Directories

```bash
mkdir -p uploads outputs logs
```

### 5. Initialize Database

```bash
# Set DATABASE_URL in .env first!
# Then run:
python -m alembic upgrade head

# Or manually run schema:
psql "$DATABASE_URL" < ../database_schema.sql
```

### 6. Run Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: http://localhost:8000  
API Docs (Swagger): http://localhost:8000/docs

---

## Frontend Setup

### 1. Create React App

```bash
cd frontend

# Using npm (recommended for speed)
npm create vite@latest exam-grading-frontend -- --template react
cd exam-grading-frontend
```

Or if you already have the folder:

```bash
cd frontend
npm init
```

### 2. Install Dependencies

```bash
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Configure Tailwind

Update `frontend/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Create .env

```bash
cp .env.example .env
# Edit .env with REACT_APP_API_URL=http://localhost:8000
```

### 5. Run Frontend

```bash
npm run dev
```

App runs at: http://localhost:3000

---

# Full Setup Script (One Command)

Save this as `setup.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 AI Exam Grading System - Full Setup"
echo ""

# Backend
echo "📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate  # or . venv/Scripts/activate on Windows
pip install --upgrade pip
pip install -r requirements.txt
mkdir -p uploads outputs logs
echo "✓ Backend ready"

# Frontend
echo ""
echo "📦 Setting up frontend..."
cd ../frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
echo "✓ Frontend ready"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in .env files (DATABASE_URL, GEMINI_API_KEY)"
echo "2. Run database schema: psql \"\$DATABASE_URL\" < ../database_schema.sql"
echo "3. Terminal 1: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "4. Terminal 2: cd frontend && npm run dev"
echo "5. Open http://localhost:3000"
```

Run:
```bash
chmod +x setup.sh
./setup.sh
```

---

# Troubleshooting Installation

## Backend Issues

### PaddleOCR Installation Fails
```bash
# Try installing with specific version
pip install paddleocr==2.7.0.3 --no-cache-dir

# If still fails, install dependencies separately
pip install paddlepaddle
pip install paddleocr
```

### PostgreSQL Connection Error
```bash
# Test connection manually
psql "postgresql://postgres:password@db.supabase.co:5432/postgres"

# If fails, check:
# 1. Connection string correct
# 2. Network access enabled (Supabase settings)
# 3. Username/password correct
```

### Gemini API Import Error
```bash
# Reinstall
pip uninstall google-generativeai -y
pip install google-generativeai==0.3.0
```

### Virtual Environment Issues
```bash
# Delete and recreate venv
rm -rf backend/venv
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

---

## Frontend Issues

### Node/npm Not Found
```bash
# Install Node.js from https://nodejs.org/ (LTS recommended)
# Then verify:
node --version
npm --version
```

### Vite Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows

# Or use different port
npm run dev -- --port 3001
```

---

# Dependency Versions (Locked)

We've pinned versions to ensure compatibility:

**Critical:**
- FastAPI 0.104.1 (async, WebSocket support)
- React 18.2.0 (latest stable)
- SQLAlchemy 2.0.23 (ORM)
- PaddleOCR 2.7.0.3 (OCR engine)

**Can be upgraded after hackathon:**
- google-generativeai (bleeding edge, may change)
- Vite (build tool, minor upgrades safe)

**Do NOT upgrade:**
- psycopg2-binary (database driver, version-critical)
- paddleocr (OCR accuracy varies by version)

---

# Post-Hackathon Dependency Updates

After shipping, update to latest:

```bash
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm update
```

Check for breaking changes:
```bash
npm audit
pip check
```

---

# Docker Setup (Optional, for Deployment)

If deploying via Docker, add `Dockerfile`:

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

# Dependency Management Best Practices

### Lock Dependencies

```bash
# Backend (Python)
pip freeze > backend/requirements.lock
# Commit requirements.lock to git

# Frontend (Node)
# package-lock.json is auto-created, commit to git
```

### Update Safely

```bash
# Test before updating
git checkout -b feat/update-deps

pip install --upgrade [package-name]
# Run tests, verify working

# Then commit and merge
```

### Monitor for Vulnerabilities

```bash
# Backend
pip check

# Frontend
npm audit
```

---

# Summary

**Installation steps (TL;DR):**

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Fill in values
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

# Open http://localhost:3000
```

You're ready to code!
