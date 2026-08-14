# Quick Start Guide (5 Minutes to Running)

## Absolute Fastest Setup

```bash
# Terminal 1: Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# FILL IN .env FILE (DATABASE_URL, GEMINI_API_KEY)
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Database (one-time)
psql "your_database_url" < database_schema.sql
```

**Done!** Visit http://localhost:3000

---

## What If It's Broken?

Jump to the relevant section below:

### 💥 Backend won't start
→ [Backend Startup Issues](#backend-startup-issues)

### 💥 Frontend won't start
→ [Frontend Startup Issues](#frontend-startup-issues)

### 💥 Database connection fails
→ [Database Issues](#database-issues)

### 💥 API returns errors
→ [API Issues](#api-issues)

### 💥 OCR/LLM not working
→ [AI/ML Issues](#aiml-issues)

---

---

# Backend Startup Issues

## Error: "ModuleNotFoundError: No module named 'fastapi'"

**Cause:** Virtual environment not activated or dependencies not installed

**Fix:**
```bash
cd backend

# Activate venv
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install
pip install -r requirements.txt

# Verify
python -c "import fastapi; print('OK')"

# Try again
uvicorn app.main:app --reload
```

---

## Error: "Address already in use (:8000)"

**Cause:** Another process using port 8000

**Fix (macOS/Linux):**
```bash
# Find process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn app.main:app --reload --port 8001
```

**Fix (Windows):**
```bash
# Find process
netstat -ano | findstr :8000

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --reload --port 8001
```

---

## Error: "No module named 'paddleocr'"

**Cause:** PaddleOCR not installed

**Fix:**
```bash
pip install paddleocr==2.7.0.3 --no-cache-dir

# If still fails, install prereqs first
pip install paddlepaddle opencv-python pdf2image
pip install paddleocr

# Verify
python -c "from paddleocr import PaddleOCR; print('OK')"
```

---

## Error: "google.auth.exceptions.DefaultCredentialsError"

**Cause:** Gemini API key not set

**Fix:**
```bash
# Check .env
cat backend/.env | grep GEMINI_API_KEY

# Should print: GEMINI_API_KEY=AIzaSy...

# If blank, add your key:
echo "GEMINI_API_KEY=YOUR_API_KEY" >> backend/.env

# Restart server
# Ctrl+C to stop, then:
uvicorn app.main:app --reload
```

---

## Error: "AppRegistrationError: database_url required"

**Cause:** DATABASE_URL not set in .env

**Fix:**
```bash
# Check .env exists
ls -la backend/.env

# If missing:
cp backend/.env.example backend/.env

# Edit and add your Supabase connection string
# Then restart:
uvicorn app.main:app --reload
```

---

## Error: "Connection refused" (database)

**Cause:** PostgreSQL/Supabase not accessible

**Fix:**
```bash
# Test connection directly
psql "YOUR_DATABASE_URL"

# If fails:
# 1. Check connection string (use sslmode=require)
# 2. Verify Supabase dashboard (is project running?)
# 3. Check IP whitelist (Supabase settings)
# 4. Try different network (hotspot, etc.)
```

---

---

# Frontend Startup Issues

## Error: "command not found: npm"

**Cause:** Node.js not installed

**Fix:**
```bash
# Install Node.js
# Go to https://nodejs.org/ and download LTS version
# Verify installation:
node --version
npm --version

# Then try again:
npm install
npm run dev
```

---

## Error: "Port 3000 already in use"

**Cause:** Another app using port 3000

**Fix:**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3001
```

---

## Error: "VITE_API_URL is undefined"

**Cause:** .env file not set

**Fix:**
```bash
cd frontend

# Create .env
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# Restart dev server
# Ctrl+C to stop
npm run dev
```

---

## Error: "Module not found" (React/Axios)

**Cause:** node_modules not installed

**Fix:**
```bash
cd frontend

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify
npm run dev
```

---

## Error: "SyntaxError in component"

**Cause:** JSX syntax error in component

**Fix:**
1. Check browser console (F12 → Console tab)
2. Read error message carefully
3. Common issues:
   - Missing `import` statement
   - Unclosed `{` or `}`
   - Missing `return` in component
   - Typo in state name

**Example:**
```jsx
// ❌ Wrong (missing return)
function MyComponent() {
  <div>Hello</div>
}

// ✅ Correct
function MyComponent() {
  return <div>Hello</div>
}
```

---

---

# Database Issues

## Error: "psql: connection refused"

**Cause:** Can't reach PostgreSQL/Supabase

**Fix:**
```bash
# 1. Check connection string
echo $DATABASE_URL
# Should look like: postgresql://user:pass@host:5432/db?sslmode=require

# 2. Verify Supabase dashboard
# - Go to supabase.com → your project
# - Check if project is "Active"
# - Check IP whitelist (Settings → Database)

# 3. Try manual psql
psql "postgresql://postgres:password@db.supabase.co:5432/postgres?sslmode=require"

# 4. If still fails, try different network (hotspot/VPN)
```

---

## Error: "relation 'exams' does not exist"

**Cause:** Database schema not initialized

**Fix:**
```bash
# Run schema creation script
psql "$DATABASE_URL" < database_schema.sql

# Or paste SQL file directly in Supabase editor:
# Supabase Dashboard → SQL Editor → New Query → Paste database_schema.sql

# Verify
psql "$DATABASE_URL" -c "SELECT * FROM exams;"
```

---

## Error: "permission denied for schema public"

**Cause:** User doesn't have write permissions

**Fix:**
```bash
# Grant permissions (in psql)
psql "$DATABASE_URL" -c "GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;"

# Then try again
psql "$DATABASE_URL" -c "SELECT * FROM exams;"
```

---

## Data disappeared/reset

**Cause:** Accidental deletion or schema reset

**Fix:**
```bash
# Backup first (if you have data):
pg_dump "$DATABASE_URL" > backup.sql

# Then recreate schema:
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" < database_schema.sql

# Verify
psql "$DATABASE_URL" -c "SELECT * FROM exams;"
```

---

---

# API Issues

## Error: "CORS error" (frontend can't reach backend)

**Cause:** CORS not configured or backend not running

**Fix:**
1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok"}
   ```

2. **Check CORS config in FastAPI:**
   ```python
   # In backend/app/main.py
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],  # ← Add frontend URL
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

3. **Restart backend**

---

## Error: "POST /exam/create returns 422"

**Cause:** Request body validation failed

**Fix:**
1. **Check API docs:**
   ```
   Open http://localhost:8000/docs
   Find the endpoint
   Check "Request body" format
   ```

2. **Use correct JSON:**
   ```json
   {
     "exam_name": "Physics",
     "subject": "Science",
     "exam_structure": [...]
   }
   ```

3. **Test with curl:**
   ```bash
   curl -X POST http://localhost:8000/exam/create \
     -H "Content-Type: application/json" \
     -d '{"exam_name":"Physics","subject":"Science","exam_structure":[]}'
   ```

---

## Error: "500 Internal Server Error"

**Cause:** Backend crashed

**Fix:**
1. **Check backend terminal for error message**
2. **Common causes:**
   - Database connection failed
   - LLM API failed
   - Unhandled exception in code

3. **Restart backend:**
   ```bash
   # Ctrl+C to stop
   uvicorn app.main:app --reload
   ```

4. **Check logs:**
   ```bash
   # Add more verbose logging
   uvicorn app.main:app --reload --log-level debug
   ```

---

## Error: "API returns null or empty array"

**Cause:** Query returns no data

**Fix:**
1. **Verify data exists:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM exams;"
   # Should be > 0
   ```

2. **Check query in API:**
   ```python
   # In backend/app/routes/exams.py
   results = db.query(models.Exam).all()
   print(f"Found {len(results)} exams")  # Add logging
   ```

3. **Add test data:**
   ```bash
   psql "$DATABASE_URL" << EOF
   INSERT INTO exams (exam_name, subject, total_marks)
   VALUES ('Test Exam', 'Physics', 16);
   EOF
   ```

---

---

# AI/ML Issues

## Error: "403 Forbidden" (Gemini API)

**Cause:** API key invalid or quota exceeded

**Fix:**
```bash
# 1. Check API key
echo $GEMINI_API_KEY
# Should be: AIzaSy...

# 2. Verify API key in Google Cloud
# Go to: https://makersuite.google.com/app/apikey
# Check if key is active

# 3. Check quota
# If exceeded, wait or create new project

# 4. Test API manually:
python -c "
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')
response = model.generate_content('Say hello')
print(response.text)
"
```

---

## Error: "429 Too Many Requests"

**Cause:** Hit rate limit (60 req/min for free tier)

**Fix:**
```bash
# 1. Wait a minute, then retry
# 2. Reduce batch size:
#    Process 50 exams in batches of 30 (instead of all at once)
# 3. Add delay between requests:
import time
for exam in exams:
    process(exam)
    time.sleep(1)  # Wait 1 second between requests
```

---

## Error: "PaddleOCR hangs/times out"

**Cause:** Large PDF or slow system

**Fix:**
```bash
# 1. Process one page at a time
from pdf2image import convert_from_path
pages = convert_from_path('document.pdf', first_page=1, last_page=1)

# 2. Reduce image quality before OCR
import cv2
img = cv2.imread('page.jpg')
img = cv2.resize(img, (0, 0), fx=0.5, fy=0.5)  # 50% size

# 3. Install GPU version (if available)
# pip install paddlepaddle-gpu
```

---

## Error: "OCR output is garbage"

**Cause:** Handwriting too messy or low quality

**Fix:**
1. **Preprocess image:**
   ```python
   import cv2
   import numpy as np
   
   img = cv2.imread('page.jpg')
   # Increase contrast
   img = cv2.convertScaleAbs(img, alpha=1.5, beta=0)
   # Denoise
   img = cv2.fastNlMeansDenoising(img, h=10)
   # Threshold for binary
   gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
   _, img = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
   ```

2. **Flag low confidence for HITL**
3. **Use Tesseract as fallback** (for printed text)

---

## Error: "LLM returns garbage/hallucinations"

**Cause:** Prompt too complex or OCR text is bad

**Fix:**
1. **Simplify prompt:**
   ```python
   # ❌ Complex
   prompt = "Given this answer about photosynthesis, extract keywords..."
   
   # ✅ Simple
   prompt = "Extract keywords from this text. JSON only: [{'keyword': '...', 'confidence': 0.9}]"
   ```

2. **Add validation:**
   ```python
   try:
       keywords = json.loads(response.text)
       # Validate it's actually a list
       if not isinstance(keywords, list):
           return []
   except:
       return []  # Return empty if parsing fails
   ```

3. **Add confidence threshold:**
   ```python
   # Only use keywords with confidence >= 0.7
   keywords = [kw for kw in keywords if kw['confidence'] >= 0.7]
   ```

---

---

# General Debugging Tips

## Check What's Running

```bash
# What's on port 8000?
lsof -i :8000

# What's on port 3000?
lsof -i :3000

# What's on port 5432?
lsof -i :5432
```

## View Logs

```bash
# Backend logs (live)
# Just watch the terminal where uvicorn is running
# Look for red text = errors

# Frontend logs (live)
# Open browser DevTools: F12 or Cmd+Option+I
# Go to Console tab

# Database logs
# Log into Supabase dashboard
# Go to Logs tab
```

## Test API Manually

```bash
# Install Postman (free)
# Or use curl:

# Create exam
curl -X POST http://localhost:8000/exam/create \
  -H "Content-Type: application/json" \
  -d '{"exam_name":"Test","subject":"Physics","exam_structure":[]}'

# Get exams
curl http://localhost:8000/exam/1

# Upload PDF
curl -X POST http://localhost:8000/exam/1/submit-pdf \
  -F "roll_no=A001" \
  -F "file=@student.pdf"
```

## Reset Everything (Nuclear Option)

```bash
# Stop all services
# Ctrl+C on both terminal windows

# Clear databases
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" < database_schema.sql

# Clear Python cache
cd backend
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Reinstall
pip install --force-reinstall -r requirements.txt

# Restart
uvicorn app.main:app --reload
```

---

# When to Panic (and What to Do)

| Situation | Action |
|-----------|--------|
| **Backend won't start** | Check .env, reinstall deps, check Python version |
| **Frontend won't start** | Check Node, clear node_modules, check .env |
| **Database won't connect** | Check connection string, check Supabase dashboard, check IP |
| **API returns 500** | Check terminal for error, restart backend, check database |
| **OCR produces garbage** | Check PDF quality, preprocess image, flag for HITL |
| **LLM returns nonsense** | Simplify prompt, add validation, check API key |
| **Can't reach backend from frontend** | Check CORS, check backend running, check port |
| **Data disappeared** | Check if you accidentally deleted it, restore from backup |

---

# Quick Reference: Command Cheat Sheet

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux only
pip install -r requirements.txt
uvicorn app.main:app --reload
uvicorn app.main:app --reload --port 8001  # Different port

# Frontend
cd frontend
npm install
npm run dev
npm run dev -- --port 3001  # Different port

# Database
psql "$DATABASE_URL"  # Connect to database
psql "$DATABASE_URL" < database_schema.sql  # Import schema
psql "$DATABASE_URL" -c "SELECT * FROM exams;"  # Query

# Testing
curl http://localhost:8000/health  # Backend health
curl http://localhost:3000  # Frontend health
python -c "import fastapi; print('OK')"  # Check Python package
node --version  # Check Node version

# Cleanup
rm -rf backend/venv frontend/node_modules  # Delete installed packages
lsof -ti:8000 | xargs kill -9  # Kill port 8000 process
find . -name __pycache__ -type d -exec rm -rf {} +  # Clear Python cache
```

---

# Still Stuck?

1. **Read error message carefully** (first 3 lines are usually the answer)
2. **Search the error on Stack Overflow**
3. **Ask in team chat** (3 heads better than 1)
4. **Move to next task** (don't spend >30 min on one issue)
5. **Note it for post-hackathon** (you can fix it later)

---

**Remember:** The hackathon is 72 hours. You don't need to fix everything perfectly. Ship something that works, then iterate.

**Good luck! 🚀**
