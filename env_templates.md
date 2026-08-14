# Environment Variables Templates

## Backend `.env` (backend/.env)

```bash
# ============================================================================
# DATABASE
# ============================================================================
# Get from Supabase console after creating project
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.supabase.co:5432/postgres?sslmode=require

# ============================================================================
# LLM API KEYS
# ============================================================================
# Google Gemini (https://ai.google.dev/)
# Get free API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Mistral AI (fallback, https://mistral.ai/)
# Get from: https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here

# ============================================================================
# FILE STORAGE
# ============================================================================
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs

# ============================================================================
# SETTINGS
# ============================================================================
DEBUG=True  # Set to False in production
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=100  # Max PDF size in MB
```

## Frontend `.env` (frontend/.env)

```bash
# ============================================================================
# API CONFIGURATION
# ============================================================================
# Backend API URL
REACT_APP_API_URL=http://localhost:8000

# ============================================================================
# APP SETTINGS
# ============================================================================
REACT_APP_TITLE=Exam Grading System
REACT_APP_VERSION=1.0.0
```

---

# How to Set Up

## Step 1: Backend Environment

### Get Supabase Database URL

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free tier)
3. Create new project
4. Go to Settings → Database → Connection String
5. Copy PostgreSQL connection string
6. Replace `YOUR_PASSWORD` with your password
7. Paste into `DATABASE_URL=`

**Example:**
```bash
DATABASE_URL=postgresql://postgres:abcd1234@db.supabase.co:5432/postgres?sslmode=require
```

### Get Gemini API Key

1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create new API key
4. Copy and paste into `GEMINI_API_KEY=`

**Example:**
```bash
GEMINI_API_KEY=AIzaSyDrm_xxxxxxxxxxxxxx
```

### Create Backend `.env`

```bash
cd backend
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:your_password@db.supabase.co:5432/postgres?sslmode=require
GEMINI_API_KEY=AIzaSyDrm_xxxxxxxxxxxxxx
MISTRAL_API_KEY=optional_fallback_key
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
DEBUG=True
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=100
EOF
```

**Verify:**
```bash
cat .env  # Should show all variables filled in
```

## Step 2: Frontend Environment

```bash
cd frontend
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:8000
REACT_APP_TITLE=Exam Grading System
REACT_APP_VERSION=1.0.0
EOF
```

## Step 3: Verify

### Test Backend Connection

```bash
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('DATABASE_URL'))"
# Should print your Supabase connection string
```

### Test Database

```bash
cd backend
python -c "
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')
print(f'Connecting to: {db_url[:50]}...')

try:
    conn = psycopg2.connect(db_url)
    print('✓ Database connected successfully!')
    conn.close()
except Exception as e:
    print(f'✗ Connection failed: {e}')
"
```

### Test Gemini API

```bash
cd backend
python -c "
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print(f'API Key: {api_key[:20]}...')

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

try:
    response = model.generate_content('Say hello')
    print('✓ Gemini API working!')
    print(f'Response: {response.text[:50]}...')
except Exception as e:
    print(f'✗ API failed: {e}')
"
```

---

# .gitignore (Add to repo root)

```
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
__pycache__/
*.pyc
venv/
env/

# Build outputs
dist/
build/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads & Outputs
uploads/
outputs/

# Test coverage
.coverage
htmlcov/

# Logs
*.log
logs/

# Temp files
*.tmp
*.temp
```

---

# Quick Setup Script (run this)

```bash
#!/bin/bash
set -e

echo "🚀 AI Exam Grading System - Environment Setup"
echo ""

# Backend setup
echo "📝 Setting up backend environment..."
cd backend

echo "Enter Supabase Database URL (postgresql://...):"
read DB_URL

echo "Enter Gemini API Key (AIzaSy...):"
read GEMINI_KEY

cat > .env << EOF
DATABASE_URL=$DB_URL
GEMINI_API_KEY=$GEMINI_KEY
MISTRAL_API_KEY=optional
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
DEBUG=True
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=100
EOF

echo "✓ Backend .env created"

# Frontend setup
echo ""
echo "📝 Setting up frontend environment..."
cd ../frontend

cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:8000
REACT_APP_TITLE=Exam Grading System
REACT_APP_VERSION=1.0.0
EOF

echo "✓ Frontend .env created"

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p backend/uploads backend/outputs

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Backend: pip install -r requirements.txt"
echo "2. Backend: python -m alembic upgrade head  (if using migrations)"
echo "3. Backend: uvicorn app.main:app --reload"
echo "4. Frontend: npm install"
echo "5. Frontend: npm run dev"
```

Save as `setup_env.sh` and run:
```bash
chmod +x setup_env.sh
./setup_env.sh
```

---

# Troubleshooting

## "DATABASE_URL not found"
- Make sure .env file is in the correct directory
- Run: `echo $DATABASE_URL` to verify
- Make sure python-dotenv is installed: `pip install python-dotenv`

## "Gemini API Error: 403 Forbidden"
- API key might be invalid or revoked
- Generate new key from https://makersuite.google.com/app/apikey
- Check for typos in .env

## "Connection refused" (PostgreSQL)
- Verify Supabase project is running
- Check connection string (sslmode=require is important)
- Try connecting with psql CLI: `psql "your_connection_string"`

## Frontend can't reach backend
- Check backend is running: `curl http://localhost:8000/health`
- Check REACT_APP_API_URL in frontend .env
- Check CORS settings in FastAPI (should allow localhost:3000)

---

# Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` to GitHub (should be in .gitignore)
- Keep API keys secret
- Use strong database passwords
- Regenerate keys if compromised
- After hackathon, use secret management (GitHub Secrets, AWS Secrets Manager, etc.)

---

# Production Setup (Post-Hackathon)

When deploying to production:

### Backend (Vercel/Railway/Render)
```bash
DATABASE_URL=postgresql://...  # Use environment secrets
GEMINI_API_KEY=...             # Use environment secrets
DEBUG=False                    # Important!
LOG_LEVEL=WARNING
```

### Frontend (Vercel)
```bash
REACT_APP_API_URL=https://api.yourdomain.com  # Production backend
REACT_APP_VERSION=1.0.0
```

Use GitHub Secrets for CI/CD:
```yaml
# .github/workflows/deploy.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```
