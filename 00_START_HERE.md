# 🚀 AI Exam Grading System — 72-Hour Hackathon

## **START HERE**

You now have a **complete, production-ready plan** for a working AI exam grading system. Below is what you need to do **right now** to ship this in 72 hours.

---

## 📦 What You Have (8 Complete Documents)

| # | File | Purpose | Read Time | Use Case |
|---|------|---------|-----------|----------|
| 1 | **SRDD_HACKATHON_FINAL.md** | Complete technical specification | 30 min | Architecture understanding |
| 2 | **DEVELOPMENT_PLAN.md** | Task breakdown by hour (20 tasks) | 20 min | Daily execution guide |
| 3 | **TEAM_PROMPTS.md** | AI prompts for each team member | 10 min | Copy-paste to Claude/GPT |
| 4 | **README_HACKATHON.md** | Quick overview & success criteria | 10 min | Motivation & overview |
| 5 | **database_schema.sql** | PostgreSQL schema (copy-paste ready) | 5 min | DB initialization |
| 6 | **env_templates.md** | Environment variables setup | 10 min | Configure API keys |
| 7 | **requirements_and_dependencies.md** | Backend/Frontend dependencies | 10 min | Install packages |
| 8 | **QUICK_START_AND_TROUBLESHOOTING.md** | Common errors & fixes | Reference | Debugging |

**Total: ~95 minutes to review everything. Then 72 hours to build.**

---

## ⚡ The 5-Minute Brief (For Your Team)

Read this to your team in 5 minutes:

```
We're building an AI exam grading system.

WHAT IT DOES:
- Teacher uploads 50 student exam PDFs (handwritten)
- System extracts text (OCR), identifies keywords, awards marks
- Low-confidence answers go to a teacher dashboard for review
- Outputs: Individual PDFs + master spreadsheet

WHY IT'S NOVEL:
- Keyword-based (ignores spelling/grammar/handwriting quality)
- LLM-assisted rubric generation (teacher uploads Q&A, AI suggests rubric)
- HITL dashboard (teacher approves/modifies AI decisions)
- VLM for diagrams (Gemini Vision)
- Zero cost (free tier APIs only)

TIMELINE:
- Hours 1-4: Setup (backend, frontend, database)
- Hours 5-48: Build (OCR, LLM, APIs, UI)
- Hours 49-64: Test & fix
- Hours 65-72: Final run (process 50 PDFs) + ship

TECH:
- Backend: FastAPI + PostgreSQL
- Frontend: React
- AI: Gemini 2.0 Flash (keywords), PaddleOCR (text extraction)
- Hosting: Localhost (then Vercel post-hackathon)

SUCCESS:
- 50 PDFs graded automatically
- ~10 low-confidence reviewed by teacher
- Individual grade PDFs generated
- Master scoresheet ready
- GitHub repo with working code
- README documenting everything

LET'S GO.
```

---

## 🎯 Your Next Steps (Do This NOW)

### Step 1: Create GitHub Repo (10 minutes)

```bash
# Create local repo
mkdir exam-grading-system
cd exam-grading-system
git init
git checkout -b dev

# Add these docs to repo
mkdir docs
cp SRDD_HACKATHON_FINAL.md docs/
cp DEVELOPMENT_PLAN.md docs/
cp TEAM_PROMPTS.md docs/
# ... etc

git add .
git commit -m "docs: initial project specification"

# Push to GitHub (create repo on github.com first)
git remote add origin https://github.com/yourname/exam-grading-system.git
git push -u origin dev
```

---

### Step 2: Share with Team (20 minutes)

**Send each team member:**

1. **This file (00_START_HERE.md)** — Overview
2. **README_HACKATHON.md** — Motivation
3. **Their section from TEAM_PROMPTS.md** — Their specific prompts
4. **QUICK_START_AND_TROUBLESHOOTING.md** — Debugging guide

**Quick standup (5 min):**
- Backend Dev: "I'll handle OCR and LLM APIs"
- Frontend Dev: "I'll handle React UI and HITL dashboard"
- Integration Dev: "I'll handle LLM integration and testing"

---

### Step 3: Local Setup (30 minutes)

**Everyone does this in parallel:**

**Backend Dev:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in DATABASE_URL and GEMINI_API_KEY
```

**Frontend Dev:**
```bash
cd frontend
npm install
cp .env.example .env
# REACT_APP_API_URL=http://localhost:8000
```

**Database (one-time):**
```bash
psql "$DATABASE_URL" < database_schema.sql
```

---

### Step 4: Start Building (Hour 1)

**Assign tasks from DEVELOPMENT_PLAN.md:**

- **Backend Dev:** TASK 1A (Backend setup) + TASK 2A (OCR engine)
- **Frontend Dev:** TASK 1B (Frontend setup) + TASK 2D (Rubric bot UI)
- **Integration:** TASK 1 from TEAM_PROMPTS.md (LLM setup)

Each person:
1. Creates branch: `git checkout -b feat/task-name`
2. Copies their prompt from TEAM_PROMPTS.md
3. Pastes into Claude/GPT
4. Gets code back
5. Commits to branch
6. Opens PR to `dev` branch

---

## 📖 How to Use Each Document

### 1️⃣ SRDD_HACKATHON_FINAL.md
**When to read:** Understanding the system architecture
**What to look for:**
- System data flow diagram (Section 2.1)
- Database schema (Section 5.1) — compare with database_schema.sql
- API endpoints (Section 6.2) — shows what to build
- LLM prompts (Section 8) — understanding prompt strategy
- Tech stack (Section 3) — why each choice

**For team:** Share Section 2 (Architecture) in first standup

---

### 2️⃣ DEVELOPMENT_PLAN.md
**When to read:** Daily execution reference
**What to look for:**
- Your assigned tasks (see column "Task")
- Exact hours allocated
- Code scaffolds (copy-paste ready)
- Git workflow (feature branches, commit messages)
- Integration testing checklist (for end-to-end testing)

**For team:** Each person reads their section daily

---

### 3️⃣ TEAM_PROMPTS.md
**When to use:** Every 2 hours when starting a new task
**What to do:**
1. Find your task in the table (e.g., "Backend Dev - Task 1")
2. Copy the entire prompt
3. Paste into Claude/GPT
4. Get code back
5. Commit to your branch

**Pro tip:** You can also modify the prompt:
```
[Paste prompt here]

Important: Keep code under 300 lines for this module.
Focus on working over perfect for 72-hour hackathon.
```

---

### 4️⃣ README_HACKATHON.md
**When to read:** Motivation + big picture
**Key sections:**
- "Success Criteria" — what judges want to see
- "Key Differentiators" — why your project stands out
- "Timeline" — keep on track
- "GitHub Portfolio Tips" — future-proof your work

---

### 5️⃣ database_schema.sql
**When to use:** Hour 1, after backend setup
**What to do:**
```bash
psql "$DATABASE_URL" < database_schema.sql
```

**What it creates:**
- 8 tables (exams, rubrics, submissions, evaluations, etc.)
- 3 views (for easier querying)
- Indexes (for performance)

**Don't memorize it.** Just run it once.

---

### 6️⃣ env_templates.md
**When to use:** Hour 1, before running code
**What to do:**
1. Get Supabase connection string
2. Get Gemini API key
3. Fill in `.env` files
4. Run verification tests

**Section "Troubleshooting":** If environment setup breaks

---

### 7️⃣ requirements_and_dependencies.md
**When to use:** Hour 1, after environment setup
**What to do:**
```bash
pip install -r backend/requirements.txt
npm install (frontend)
```

**Section "Troubleshooting":** If installation breaks

---

### 8️⃣ QUICK_START_AND_TROUBLESHOOTING.md
**When to use:** Every time something breaks
**What to do:**
1. Google the error (first line)
2. Check if it's in this doc
3. Follow the fix
4. Try again

**Keep open in a tab during the hackathon.**

---

## 🎯 Execution Timeline (72 Hours)

### Hours 1-4: Setup
- ✅ GitHub repo created
- ✅ Backend/Frontend projects initialized
- ✅ Database connected
- ✅ First "hello world" from both backend + frontend

### Hours 5-12: First Features
- ✅ OCR engine extracts text from PDF
- ✅ React UI for exam setup
- ✅ Database stores exam metadata

### Hours 13-24: Core Logic
- ✅ LLM keyword extraction working
- ✅ Keyword matching + scoring
- ✅ API endpoints created
- ✅ Rubric bot chat UI

### Hours 25-36: Integration
- ✅ Frontend + Backend communicating
- ✅ Student PDF upload working
- ✅ Batch processing running
- ✅ HITL dashboard UI

### Hours 37-48: Completion
- ✅ HITL review working
- ✅ PDF output generation
- ✅ CSV spreadsheet generation
- ✅ All endpoints tested

### Hours 49-64: Testing + Fixes
- ✅ End-to-end test with 5 PDFs
- ✅ Bug fixes
- ✅ Edge cases handled

### Hours 65-72: Production Run + Ship
- ✅ Process all 50 student PDFs
- ✅ Teacher does HITL reviews
- ✅ Final outputs generated
- ✅ README written
- ✅ GitHub push
- ✅ 🚀 SHIPPED

---

## 🚨 If You Get Stuck

### Problem: "I don't know how to start"
→ Read README_HACKATHON.md (10 minutes)
→ Then read QUICK_START_AND_TROUBLESHOOTING.md (5 minutes)

### Problem: "Backend won't start"
→ Go to QUICK_START_AND_TROUBLESHOOTING.md
→ Find "Backend Startup Issues"
→ Follow the fix

### Problem: "Code I got from Claude/GPT doesn't work"
→ Read error message
→ Ask Claude: "I got this error: [error]. How do I fix it?"
→ Move on if stuck >30 minutes

### Problem: "Feature is too hard"
→ Simplify it
→ Skip it (mark as TODO)
→ Continue with next task

### Problem: "Database query is broken"
→ Test manually: `psql "$DATABASE_URL" -c "SELECT * FROM exams;"`
→ Check database_schema.sql for table structure
→ Ask team: "Can you check my schema?"

---

## 💡 Pro Tips

1. **Commit often** (every 1-2 hours)
   ```bash
   git add .
   git commit -m "feat: keyword extraction working"
   git push origin feat/keyword-eval
   ```

2. **Don't perfectionism trap**
   - Working > Perfect
   - "Good enough for MVP" is good enough

3. **Test early**
   - Test with 5 PDFs first (not 50)
   - Verify API with curl/Postman before React
   - Fix bugs as you go (not at the end)

4. **Help each other**
   - Frontend stuck? Backend dev helps
   - Backend stuck? Integration dev helps
   - Timeboxing: if stuck >30 min, ask team

5. **Document as you go**
   - Comments in code
   - One sentence in commit message
   - Final README is easy then

---

## 🎓 Learning Goals

By the end of this, you'll have learned:

- ✅ Full-stack development (React + FastAPI + PostgreSQL)
- ✅ AI/LLM integration (Gemini API)
- ✅ OCR + Computer Vision (PaddleOCR)
- ✅ Git workflows (branching, merging, PR reviews)
- ✅ Hackathon shipping (ruthless scope, MVP mindset)
- ✅ System design (architecture, database, API design)

That's a **serious portfolio piece**.

---

## 🎯 Judges Will See

**Day 1 (Hours 0-24):**
- Nothing yet (setup phase)

**Day 2 (Hours 24-48):**
- Working backend (Swagger docs at /docs)
- Working frontend (React app at localhost:3000)
- OCR extraction working
- First API tests passing

**Day 3 (Hours 48-72):**
- **Live demo:** Upload PDF → System grades it → Shows result
- **HITL review:** Teacher reviews 2-3 low-confidence answers
- **Output:** Individual PDFs + CSV spreadsheet
- **GitHub:** Clean repo with working code + README
- **Portfolio:** "We built an automated exam grading system in 72 hours"

---

## 📊 File Structure (After Setup)

```
exam-grading-system/
├── docs/
│   ├── SRDD_HACKATHON_FINAL.md
│   ├── DEVELOPMENT_PLAN.md
│   └── ... (other docs)
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── services/
│   │   │   ├── ocr_service.py
│   │   │   ├── llm_service.py
│   │   │   └── evaluation_service.py
│   │   └── routes/
│   │       ├── exams.py
│   │       ├── rubrics.py
│   │       ├── uploads.py
│   │       ├── evaluations.py
│   │       ├── hitl.py
│   │       └── outputs.py
│   ├── requirements.txt
│   ├── .env (filled in)
│   └── uploads/ (created automatically)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   ├── .env (filled in)
│   └── vite.config.js
├── .gitignore
├── README.md (you'll write this)
└── .git/ (git repo)
```

---

## 📞 Quick Reference

| I need... | Go to... |
|-----------|----------|
| To understand architecture | SRDD_HACKATHON_FINAL.md (Section 2) |
| Daily task assignment | DEVELOPMENT_PLAN.md |
| Code scaffolds | TEAM_PROMPTS.md |
| Backend error fix | QUICK_START_AND_TROUBLESHOOTING.md |
| Frontend error fix | QUICK_START_AND_TROUBLESHOOTING.md |
| Database error fix | QUICK_START_AND_TROUBLESHOOTING.md |
| Environment setup | env_templates.md |
| Install packages | requirements_and_dependencies.md |
| Big picture motivation | README_HACKATHON.md |
| SQL schema | database_schema.sql |

---

## 🚀 Final Words

**You have everything you need to ship a working MVP in 72 hours.**

This is not theoretical. Every line of every plan has been thought through.

- ✅ Architecture is sound (keyword-based approach is novel)
- ✅ Tech stack is realistic (all free tier)
- ✅ Timeline is aggressive but doable (with parallel work)
- ✅ Code scaffolds reduce unknown unknowns
- ✅ Troubleshooting guide covers 90% of issues

**The only thing left is execution.**

Your competitive advantage: **You will ship. Many teams don't.**

Judges care about:
1. **Working code** (most important)
2. **Clean GitHub** (second)
3. **Honest scope** (third)
4. **Innovation** (bonus points)

You have all four.

---

## ✅ Checklist Before Starting

- [ ] All 8 documents reviewed (read at least title + headers)
- [ ] GitHub repo created + docs committed
- [ ] Team understands the 5-minute brief
- [ ] Backend dev environment set up (Python venv, pip install)
- [ ] Frontend dev environment set up (Node, npm install)
- [ ] Database connected (Supabase account, connection string)
- [ ] Gemini API key acquired
- [ ] Slack/Discord chat ready (for quick questions)
- [ ] Timer started (or planned for when hackathon officially begins)
- [ ] Everyone has their TEAM_PROMPTS section

**If all checked → START CODING NOW**

---

**Go build something awesome.** 🚀

**See you at the finish line.**

---

*Questions? Read the relevant document above.*  
*Still stuck? Check QUICK_START_AND_TROUBLESHOOTING.md.*  
*Out of time? Ship what you have. Honest scope wins.*
