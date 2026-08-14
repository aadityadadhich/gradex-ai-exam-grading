# 🚀 AI Exam Grading System — 72-Hour Hackathon

## What You Have

I've created **3 comprehensive documents** (1,200+ lines total) ready for your 3-person team:

### 📋 1. SRDD_HACKATHON_FINAL.md (Detailed Specification)
**What it covers:**
- System architecture with data flow diagrams
- Keyword-based grading logic (novel approach: ignores spelling/grammar)
- Database schema (PostgreSQL tables + JSONB columns)
- API endpoints (12 endpoints fully specified)
- Frontend components and wireframes
- LLM prompts (optimized for free tier)
- Complete rubric example
- Tech stack justification (free tier APIs only)
- 72-hour development plan
- Error handling & edge cases

**Use this for:** Architecture understanding, API design, database setup

---

### 📅 2. DEVELOPMENT_PLAN.md (Task Breakdown)
**What it covers:**
- 20 concrete tasks with hours allocated
- Git branching strategy (feature branches → dev → main)
- Code scaffolds for every task (copy-paste ready)
- Integration testing checklist (manual test scenarios)
- README template for GitHub
- API documentation template
- Commit message examples

**Use this for:** Day-by-day execution, Git workflow, knowing exactly what to build

---

### 💬 3. TEAM_PROMPTS.md (AI Prompts)
**What it covers:**
- 5 backend-specific prompts (OCR, LLM, APIs, HITL, output)
- 6 frontend-specific prompts (setup, exam builder, rubric bot, upload, HITL, results)
- 3 integration/LLM prompts (API setup, rubric generation, testing)
- Quick reference matrix (who builds what, when)
- Token budgeting guide

**Use this for:** Each team member gets their prompt section, feeds to Claude/GPT, gets code back

---

## 🎯 How to Use These Documents

### For You (Team Lead)

1. **Review the SRDD** (30 minutes)
   - Understand the keyword-based approach
   - Review the architecture
   - Check the tech stack (all free tier)

2. **Review the Development Plan** (20 minutes)
   - Understand task breakdown
   - Create Git repo + branches
   - Assign tasks to team members

3. **Create GitHub Repo**
   ```bash
   git init exam-grading-system
   git checkout -b dev
   # Follow git workflow from DEVELOPMENT_PLAN.md
   ```

4. **Brief your team** (20 minutes)
   - Share SRDD overview (5 min)
   - Show task assignments (5 min)
   - Explain Git workflow (5 min)
   - Each dev gets their TEAM_PROMPTS section (5 min)

### For Backend Dev

1. Read: "TASK 2A: OCR Engine" from DEVELOPMENT_PLAN.md
2. Copy: "Prompt 1: OCR Engine Setup" from TEAM_PROMPTS.md
3. Paste into Claude/GPT → get code
4. Create branch: `git checkout -b feat/ocr-engine`
5. Commit + push
6. Next task at hour 13...

### For Frontend Dev

1. Read: "TASK 2D: Rubric Bot Chat" from DEVELOPMENT_PLAN.md
2. Copy: "Prompt 4: Rubric Bot Chat UI" from TEAM_PROMPTS.md
3. Paste into Claude/GPT → get React code
4. Create branch: `git checkout -b feat/rubric-bot-ui`
5. Commit + push
6. Next task...

### For Integration/LLM Lead

1. Read: "TASK 2A: LLM Integration" from DEVELOPMENT_PLAN.md
2. Copy: "Prompt 1: LLM API Integration" from TEAM_PROMPTS.md
3. Paste into Claude/GPT → get LLM service code
4. Test with sample inputs
5. Track token usage
6. Next task...

---

## 📊 System Overview (TL;DR)

```
STUDENT HANDWRITTEN EXAM PDFs
    ↓
[OCR] Extract text (PaddleOCR, local)
    ↓
[KEYWORD EXTRACTION] Extract concepts (Gemini 2.0 Flash, free)
    ↓
[MATCHING] Compare against rubric keywords
    ↓
[CONFIDENCE SCORING] Is confidence >= 0.7?
    ├─ YES → Auto-pass (save to database)
    └─ NO → Flag for HITL review (teacher dashboard)
    ↓
[HITL DASHBOARD] Teacher reviews low-confidence answers
    ├─ Approve (accept AI mark)
    ├─ Modify (override mark + add feedback)
    └─ Reject (set to 0)
    ↓
[OUTPUT GENERATION]
    ├─ Individual Grade PDFs (one per student)
    │  └─ Page-by-page: scanned answer | AI reasoning
    └─ Master CSV (all scores in spreadsheet)
```

---

## 💰 Cost & Tech Stack

| Component | Technology | Cost | Limit |
|-----------|-----------|------|-------|
| Frontend | React + Vercel | $0 | Free tier |
| Backend | FastAPI | $0 | Localhost |
| Database | PostgreSQL (Supabase) | $0 | 500MB free |
| OCR | PaddleOCR | $0 | Local processing |
| LLM (Keyword) | Gemini 2.0 Flash | $0 | 60 req/min free |
| LLM (Diagram) | Gemini Vision | $0 | 60 req/min free |
| **TOTAL** | | **$0** | **Free tier only** |

---

## 📅 72-Hour Timeline

| Phase | Hours | Deliverable | Status |
|-------|-------|-------------|--------|
| **Setup** | 1-4 | Projects initialized, DB connected | Foundation |
| **Core Dev** | 5-48 | OCR, LLM, APIs, UI working | Working System |
| **Integration** | 49-64 | End-to-end test with 5 PDFs, bug fixes | Validated |
| **Production Run** | 65-68 | Process all 50 student PDFs | Real Data |
| **HITL + Output** | 69-71 | Teacher reviews, outputs generated | Final Grades |
| **Polish + Ship** | 72 | README, API docs, GitHub push | 🚀 SHIPPED |

---

## ✅ Success Criteria (What Judges Will See)

Your demo should show:

1. **Working end-to-end flow:**
   - Upload 5 student PDFs
   - System grades them automatically (~3-5 seconds)
   - Show results: which passed auto (high confidence), which went to HITL (low confidence)

2. **HITL Dashboard in action:**
   - Teacher opens HITL queue
   - Reviews 2-3 low-confidence answers
   - Approves or modifies marks
   - System updates final scores

3. **Output generation:**
   - Show 1-2 individual grade PDFs (scanned answer + AI reasoning)
   - Show master CSV with all 50 scores

4. **Code quality:**
   - Clean GitHub repo (good commit messages)
   - Working FastAPI (show Swagger docs: http://localhost:8000/docs)
   - Working React (live demo)
   - README explaining what it does

---

## 🎯 Key Differentiators (Why Your Project Stands Out)

1. **Keyword-Based Approach** (not full LLM grading)
   - Ignores handwriting quality, spelling, grammar
   - Focuses purely on concept understanding
   - More fair, more objective

2. **LLM-Assisted Rubric Generation**
   - Teacher uploads Q&A, AI suggests rubric
   - Saves setup time (5 min vs 30 min manual)

3. **HITL Dashboard**
   - Teacher can review and override AI decisions
   - Maintains human control
   - Shows AI reasoning (transparency)

4. **VLM for Diagrams**
   - Handles visual answers (math proofs, circuits, drawings)
   - Uses Gemini Vision (free tier)

5. **Honest Scope**
   - No privacy layer, no cheating detection, no appeals
   - Clearly stated in README as "v1.0 MVP"
   - Shows you can ship fast

---

## ⚠️ Known Limitations (Be Upfront)

**What this system does NOT do (yet):**
- ❌ Double-blind grading (TSID masking)
- ❌ Cheating detection (cosine similarity)
- ❌ Student appeals workflow
- ❌ Multi-course management
- ❌ Production cloud deployment (localhost only)
- ❌ Batch scheduling (manual trigger)

**In your README, clearly state:**
```markdown
## MVP Scope (72-Hour Hackathon)
This is a working prototype for a single exam, single course.
It demonstrates the core idea: automated keyword-based grading with HITL review.

Post-hackathon roadmap includes privacy, cheating detection, and appeals.
```

---

## 🚀 Action Plan for Tonight

### 1. Create GitHub Repo (10 minutes)
```bash
git init exam-grading-system
git checkout -b dev
# Commit these 3 docs to docs/ folder
```

### 2. Share with Team (20 minutes)
- Send SRDD overview (5 min summary)
- Send DEVELOPMENT_PLAN.md (explain task breakdown)
- Send TEAM_PROMPTS.md (show their specific prompts)

### 3. Set Up Locally (30 minutes)
- Backend: `pip install -r requirements.txt`, FastAPI skeleton
- Frontend: `npm create vite` React app
- Database: Create Supabase account, get connection string

### 4. Start Tasks (Parallel)
- **Backend Dev:** Hour 1-2: Backend setup (TASK 1A)
- **Frontend Dev:** Hour 1-2: Frontend setup (TASK 1B)
- **Integration:** Hour 1-2: LLM setup (TASK 1 from prompts)

### 5. Daily Sync (Every 8 hours)
- 5-min standup: What's done, what's blockers
- Merge feature branches to `dev`
- Check for integration issues

### 6. Final Push (Hour 72)
- Merge `dev` → `main`
- Tag: `git tag v1.0-hackathon`
- Write README
- Demo for judges!

---

## 💡 Pro Tips for Your Team

### Git Workflow
- Commit every 1-2 hours (small, focused commits)
- Pull `dev` before pushing (avoid conflicts)
- Merge to `dev` every 8 hours (keeps integration smooth)
- Final merge to `main` at hour 72

### Token Budgeting
- Track Gemini API usage (60 req/min free tier)
- For 50 students: batch process in ~2 minutes (60 keyword extractions)
- Total cost: $0 (if under free tier limits)

### Testing
- Don't write unit tests (too slow for hackathon)
- Do manual testing (Postman for API, browser for UI)
- Use 5-10 sample PDFs first, then full 50

### Debugging
- FastAPI Swagger docs: http://localhost:8000/docs (free testing)
- React DevTools (Chrome extension)
- Database: Use Supabase dashboard to inspect tables

### If Something Breaks
1. Check error logs (Flask/Vite will show stack traces)
2. Simplify (remove feature, get it working again)
3. Ask in team chat (3 heads are better than 1)
4. If critical: skip to next task (you have 72 hours for a reason)

---

## 📄 GitHub Portfolio Tips

**Good README for judges:**

```markdown
# AI Exam Grading System

## What It Does
Automates subjective exam grading using OCR + LLM keyword extraction + HITL review.
- 50 student papers graded in ~5 minutes
- 40 auto-passed (high confidence)
- 10 manually reviewed (low confidence)
- 100% transparent (shows reasoning for each grade)

## How It Works
[Diagram from SRDD here]

## Tech Stack
- Frontend: React, Tailwind
- Backend: FastAPI, PostgreSQL
- AI: Gemini 2.0 Flash (keyword extraction), PaddleOCR (text extraction)
- Deployment: Vercel + Railway (post-hackathon)

## Results
- 78% auto-grading accuracy (after HITL review: 100%)
- Grading time: 5 min (vs 2 hours manual)
- Cost: $0 (free tier APIs)

## Demo
[Video showing: Upload → Grade → HITL → Output]

## Limitations
- MVP scope (single exam, single course)
- No privacy layer
- No cheating detection
- Post-hackathon roadmap: [link to issues]

## Team
- Backend: [Name]
- Frontend: [Name]
- Integration: [Name]
```

---

## 🎓 What This Teaches You

By building this, you'll learn:

- **Full-stack development:** React + FastAPI + PostgreSQL
- **AI/LLM integration:** Gemini API, prompt engineering, token optimization
- **Software architecture:** Microservices, async processing, error handling
- **Team collaboration:** Git workflows, parallel development, code review
- **Hackathon shipping:** Ruthless scope, MVP thinking, honest documentation

---

## 📞 If You Need Help

**During the hackathon:**
- Check TEAM_PROMPTS.md if a team member is stuck
- Ask Claude/GPT to refine code from prompts
- Use Postman to test API endpoints
- Use React DevTools to debug frontend

**After the hackathon:**
- Write blog post about your approach
- Open-source it on GitHub
- Deploy to production (add privacy, cheating detection)
- Use in your portfolio (interview conversations)

---

## 🎬 Ready to Go?

**You have everything:**
- ✅ Detailed spec (SRDD)
- ✅ Task breakdown (DEVELOPMENT_PLAN)
- ✅ AI prompts ready (TEAM_PROMPTS)
- ✅ Git strategy (branch workflow)
- ✅ Code scaffolds (copy-paste ready)
- ✅ Testing checklist (manual tests)
- ✅ README template (for GitHub)

**Hand these docs to your team and start coding.**

**Target: Working MVP in 72 hours. Portfolio piece for life.**

**Go ship it.** 🚀

---

## Files You Have

1. `SRDD_HACKATHON_FINAL.md` — 400+ lines, everything technical
2. `DEVELOPMENT_PLAN.md` — 500+ lines, task by task
3. `TEAM_PROMPTS.md` — 300+ lines, AI prompts for each task
4. This README — Quick reference + motivation

**All ready to copy, paste, and execute.**

---

**Last word: You're going to build something real. Judges will see a working system, not a pretty deck. That's your competitive advantage.**

**Ship it.** 🎯
