# For Team Lead Only: Execution Checklist

**You asked for:** A complete, detailed SRDD + Development Plan + Team Prompts  
**You got:** 9 production-ready documents (2,000+ lines) ready to ship  
**Your job now:** Coordinate execution

---

## What Each Document Does (Leader's Version)

| Doc | Purpose | Give To | When |
|-----|---------|---------|------|
| 00_START_HERE.md | Overview + next steps | Everyone (5 min read) | Right now |
| SRDD_HACKATHON_FINAL.md | Technical spec | Backend + Integration dev | Hour 1 |
| DEVELOPMENT_PLAN.md | Task breakdown | Assign tasks by role | Hour 1 |
| TEAM_PROMPTS.md | AI prompts | Each dev gets their section | Hours 1-48 |
| README_HACKATHON.md | Motivation + success criteria | Everyone | Day 1 |
| database_schema.sql | DB setup | Run once, hour 1 | Hour 1 |
| env_templates.md | API key setup | Each dev fills in their .env | Hour 1 |
| requirements_and_dependencies.md | Package installation | Reference during setup | Hour 1 |
| QUICK_START_AND_TROUBLESHOOTING.md | Error fixes | Keep open on slack | Hours 1-72 |

---

## Your Role (TL;DR)

```
Hour 0-1:   Brief team, setup repos, assign tasks
Hour 1-48:  Daily 5-min standups, unblock issues, merge branches
Hour 49-64: Integration testing, bug fixes, monitor progress
Hour 65-72: Final push (process 50 PDFs, HITL review, output generation)
Hour 72:    Ship to GitHub, present to judges
```

---

## Hour-by-Hour Checklist (First 24 Hours)

### Hour 0 (Right Now)

- [ ] Read this file (10 min)
- [ ] Read 00_START_HERE.md (5 min)
- [ ] Copy all docs to a shared folder (Google Drive / GitHub / Slack)
- [ ] Create GitHub repo (10 min):
  ```bash
  git init exam-grading-system
  git checkout -b dev
  # Add all docs/ folder
  git commit -m "docs: initial project specification"
  git push ...
  ```

### Hour 1 (Setup Phase)

**Standup (5 minutes):**
```
TL: "We're building an automated exam grader in 72 hours.
     Backend dev: You handle OCR + LLM APIs
     Frontend dev: You handle React UI + HITL dashboard  
     Integration: You handle LLM integration + testing
     First milestone: Hour 4 - everyone's environment working"
```

**Parallel (each dev in their folder):**
- [ ] Backend dev: `python3 -m venv venv && pip install -r requirements.txt`
- [ ] Frontend dev: `npm install`
- [ ] Integration: Fill in `.env` files (DATABASE_URL, GEMINI_API_KEY)

**Verification (Hour 2):**
- [ ] Backend runs: `uvicorn app.main:app --reload` ✓
- [ ] Frontend runs: `npm run dev` ✓
- [ ] Database connected: `psql "$DATABASE_URL" -c "SELECT 1"` ✓

### Hour 2-4 (First Code)

**Backend dev (TASK 1A):**
- Copy prompt from TEAM_PROMPTS.md
- Gets scaffolding from Claude
- Commits to `feat/backend-setup`
- PR → dev branch

**Frontend dev (TASK 1B):**
- Copy prompt from TEAM_PROMPTS.md
- Gets React scaffold
- Commits to `feat/frontend-setup`
- PR → dev branch

**Integration dev:**
- Copy prompt from TEAM_PROMPTS.md
- Sets up LLM service
- Tests Gemini API
- Commits to `feat/llm-integration`

**At Hour 4 checkpoint:**
- [ ] Backend hello-world running (`http://localhost:8000/health` returns `{"status":"ok"}`)
- [ ] Frontend hello-world rendering (`http://localhost:3000` shows page)
- [ ] Database schema initialized (`psql ... -c "SELECT * FROM exams"` works)
- [ ] LLM API tested (Gemini responds to test prompt)

### Hour 5-24 (Core Development)

**Daily rhythm:**
- 5:00am start: "Good morning team, what's the plan?"
- 8am standup (5 min): What's done, what's next, any blockers?
- 12pm: Lunch (real break, you need it)
- 3pm standup (5 min): Still on track?
- 8pm: "Merge to dev branch, commit progress"
- 10pm: "Day wrap-up, sleep schedule"

**Milestones:**

| Hour | Backend | Frontend | Integration |
|------|---------|----------|-------------|
| 12 | OCR extraction working | Exam setup UI | Rubric bot LLM |
| 24 | Keyword evaluation done | Rubric bot UI | Keyword extraction tested |
| 36 | API endpoints 90% | HITL dashboard | LLM prompts optimized |
| 48 | Output generation | Results viewer | Testing framework |

---

## How to Manage (During Hackathon)

### Communication

**Slack workflow (recommended):**
```
#general: Blockers, PRs, status updates
#backend: Backend-specific issues
#frontend: Frontend-specific issues
#done: List of completed tasks
```

**5-minute daily standups:**
- "What did you finish?"
- "What's next?"
- "Any blockers?" (If yes, solve in 5 min or postpone)

### Git Workflow (Enforce This)

```bash
# CORRECT (everyone follows this)
git checkout -b feat/task-name
# ... code ...
git commit -m "feat: what this feature does"
git push origin feat/task-name
# Open PR on GitHub
# 1-min code review (just "looks good")
# Merge to dev
# Delete branch

# NOT ACCEPTABLE
- Committing directly to main
- Branch names like "dev_v2" or "final_FINAL"
- Commits like "asdf" or "fix bug"
- Merge conflicts (communicate first)
```

### Merging to `dev`

**End of every 8-hour shift:**
1. Backend dev: PR → merge
2. Frontend dev: PR → merge
3. Integration dev: PR → merge
4. 1-min check: Did anything break?
5. If broken: Rollback (git revert)

### When Someone is Stuck

**Rule: Never more than 30 minutes on one issue**

```
Min 1: "I don't understand this error"
Min 5: Asked in Slack
Min 15: Tried searching, checked docs
Min 30: Ask team member, get new approach OR skip feature

NEVER: Spend 3 hours on one bug
       Ask for help only after trying alone
       Work on wrong task because primary is hard
```

---

## Common Issues You'll Face

### Issue 1: "Backend and Frontend aren't talking"

**Hour 25 problem:** Frontend gets 404 or CORS error

**Fix (5 min):**
```bash
# 1. Check backend running
curl http://localhost:8000/health

# 2. Check frontend .env has REACT_APP_API_URL=http://localhost:8000

# 3. Check CORS config in FastAPI (in main.py)

# If all above: just restart both
```

### Issue 2: "OCR is producing garbage text"

**Hour 20 problem:** PaddleOCR output is unreadable

**Fix (decision):**
- A. Preprocess image (OpenCV: contrast, denoise)
- B. Accept it and route to HITL (mark confidence=0)
- C. Switch to Tesseract (for printed text only)

**My recommendation:** Go with B (quickest). Add TODO for post-hackathon.

### Issue 3: "API returns 500, can't figure out why"

**Hour 40 problem:** Endpoint crashes, no clear error

**Debug (5 min):**
```bash
# Check backend terminal for stack trace
# Look at first 3 lines of error
# Search that error online
# If still stuck: rollback last commit
git revert HEAD
```

### Issue 4: "We're behind schedule"

**Hour 48 reality check:** You're on pace for 60% done, need 100%

**Options:**
1. **Skip VLM for diagrams** (still do keyword extraction)
2. **Skip HITL dashboard** (manual CSV editing instead)
3. **Skip individual PDFs** (just generate CSV)
4. **Focus on core:** OCR → Keyword → Score → Output

**My advice:** Keep OCR + Keyword + Score. Cut everything else if needed.

---

## Daily Standups (Template)

**5 minutes, same time each day:**

```
TL: "Let's go around. Backend dev?"

Backend: "Yesterday: Finished OCR, tested with 3 PDFs. Today: Keyword extraction.
          Blocker: None."

Frontend: "Yesterday: Exam setup UI done. Today: Rubric bot chat.
           Blocker: Waiting for /rubric-bot endpoint (Integration finishing it)"

Integration: "Yesterday: LLM API working, optimized prompts. Today: Rubric bot backend.
             Blocker: None."

TL: "Great. Frontend, Integration — connect those two by EOD?
     Backend — merge OCR to dev at lunch.
     See you at 3pm sync."
```

---

## Git Before Submitting (Hour 72)

**Final checklist (1 hour before deadline):**

```bash
# 1. Ensure all branches merged to dev
git checkout dev
git pull origin dev
git log --oneline | head -20
# Should show 20+ commits from all team members

# 2. Merge dev → main
git checkout main
git merge dev
git push origin main

# 3. Tag release
git tag v1.0-hackathon
git push origin --tags

# 4. Final check
git log --oneline --graph --all | head -30
# Should show clean history

# 5. README ready?
ls -la README.md
# Should exist

# 6. Push
git push origin main --tags
```

---

## GitHub Portfolio Setup

**After hackathon, this is your story:**

```markdown
# AI-Powered Exam Grading System

**Achievement:** Built working MVP in 72-hour hackathon with 3 students

## What We Built
Automated subjective exam grading using OCR + LLM keyword extraction.
- 50 student PDFs graded in ~5 minutes
- 78% auto-graded, 22% reviewed by teacher
- Individual grade PDFs + master scoresheet generated

## Tech Stack
- Backend: FastAPI, PostgreSQL
- Frontend: React, Tailwind
- AI: Gemini 2.0 Flash, PaddleOCR
- Deployment: Vercel, Railway (post-hackathon)

## Results
[Include demo video or screenshots]
- Process time: 5 minutes for 50 papers (vs 2 hours manual)
- Accuracy: 100% (after human review)
- Cost: $0 (used free tier APIs)

## Lessons Learned
1. Keyword-based grading is more fair than full LLM grading
2. HITL review is critical for low-confidence decisions
3. Free tier APIs are enough for MVP
4. Parallel development works when clear Git workflow

## Team
- Backend (OCR, LLM): [Name]
- Frontend (UI, Dashboard): [Name]
- Integration (API, Testing): [Name]

**Duration:** 72 hours
**GitHub:** [link to repo]
```

This is **gold** for interviews.

---

## Success Metrics (For Judges)

You win if judges see:

```
✅ WORKING CODE
   - Backend API responds (curl http://localhost:8000/docs shows Swagger)
   - Frontend loads (React app at localhost:3000)
   - Process 5 PDFs end-to-end in demo

✅ GITHUB IS CLEAN
   - 50+ commits from 3 team members
   - Clear commit messages ("feat: OCR engine", not "asdf")
   - README explains what it does
   - No API keys in code (proper .env usage)

✅ YOU CAN DEMO IT
   - "Watch: Upload PDF → System grades → Shows result"
   - "Watch: Teacher reviews 2 low-confidence answers"
   - "Here's the output: individual PDFs + CSV"

✅ YOU KNOW YOUR SYSTEM
   - Can explain why keyword-based approach
   - Know LLM costs and optimization
   - Can talk about what you'd add next
```

---

## What NOT to Do

❌ **Don't:**
- Commit directly to main (use feature branches)
- Spend >30 min debugging (move on, come back)
- Build perfect code (good enough is good enough)
- Skip Git (it's the second deliverable after code)
- Say "we didn't have time" (you have 72 hours, use it)
- Write code without AI prompts (slow and error-prone)
- Test only at the end (test as you go)
- Forget to merge branches (do it daily)

✅ **Do:**
- Commit every 1-2 hours (small, focused commits)
- Use feature branches for EVERYTHING
- Follow Git workflow strictly (prevents conflicts)
- Ask for help after 30 min (it's allowed)
- Test with 5 PDFs first (then 50)
- Use TEAM_PROMPTS.md for every module
- Daily standups (5 minutes, not meetings)
- Celebrate milestones ("OCR working! 🎉")

---

## Your Superpower: Unblocking

**Your job isn't coding. It's unblocking.**

When someone says "I'm stuck":

1. **Listen** (2 min)
2. **Empathize** ("That's frustrating")
3. **Suggest** (3 options: debug more, simplify, skip)
4. **Decide** (what's the fastest path forward)
5. **Execute** (help them unstick)
6. **Move on** (max 15 min total)

**Example:**
```
Dev: "I can't get Gemini to return JSON, it keeps breaking"

TL: "Show me the code. [looks] Ah, you're not telling it to return ONLY JSON.
    Change prompt to: 'Return ONLY JSON, no markdown'
    Should fix it. Try in 5 min, report back?"

Dev: "Yep, working now!"

TL: "🎉 Commit and move to next task"
```

---

## Red Flags (Watch For These)

| Flag | What It Means | Action |
|------|---------------|--------|
| **"I don't know how to start"** | Task is too vague | Break it into 3 smaller steps |
| **"I've been stuck 2 hours"** | Wrong approach | Suggest different angle OR skip |
| **"My code is ugly"** | Perfectionism | "Good enough for MVP, refactor after" |
| **"We're behind"** | Pace is off | Identify lowest-priority features, cut them |
| **"Merge conflict"** | Bad Git workflow | Review commits, prevent next time |
| **"Database is down"** | Infrastructure issue | Check Supabase dashboard, reconnect if needed |
| **"API returns null"** | Data doesn't exist | Verify data was saved, add test data |

**For all: Ask "Can we solve this in 10 minutes?" If no → skip, come back later.**

---

## Final 48 Hours (Critical Path)

### Hour 49-56 (Integration Testing)
- [ ] End-to-end: Upload PDF → Grade → Output
- [ ] Test with 5 PDFs (not 50)
- [ ] Fix any broken flows
- [ ] Commit to `feat/integration-testing`

### Hour 57-64 (Bug Fixes + Optimization)
- [ ] OCR: Handles bad handwriting
- [ ] LLM: Doesn't hallucinate
- [ ] API: Returns proper errors
- [ ] UI: Doesn't crash
- [ ] Commit to `feat/bug-fixes`

### Hour 65-68 (Production Run)
- [ ] Run on all 50 PDFs
- [ ] Monitor for crashes
- [ ] Teacher does HITL reviews (10-20 low-confidence)
- [ ] Generate final outputs
- [ ] Commit results (as artifacts or screenshots)

### Hour 69-71 (Documentation)
- [ ] Write README.md (500 words)
- [ ] Update API docs
- [ ] Add comments to critical code
- [ ] Commit: "docs: final documentation"

### Hour 72 (Ship)
- [ ] Final merge: dev → main
- [ ] Tag: v1.0-hackathon
- [ ] Push to GitHub
- [ ] Test links work
- [ ] **SHIP** 🚀

---

## You've Got This

Remember:

1. **You have a plan** (this document)
2. **You have code scaffolds** (TEAM_PROMPTS.md)
3. **You have a team** (coordinate them)
4. **You have 72 hours** (pace yourself)
5. **You have free tier APIs** (no cost issues)

The only variable is **execution**.

And execution is a leadership problem, which is your job.

---

## Parting Advice

**For you specifically:**

This isn't your first hackathon. You know the grind.

What separates winning teams:
- Clear communication (do your standups)
- Ruthless scope (cut features if behind)
- Working > Perfect (don't perfectionism trap)
- Shipping mentality (done is better than perfect)

You have all of these now.

**Push your team. Unblock them. Let them code.**

**72 hours from now, you'll have a portfolio piece that gets you hired.**

---

## Q&A (Anticipating Your Questions)

**Q: What if we finish early?**
A: Add these (in order): privacy layer, cheating detection, appeals workflow, multi-course

**Q: What if we run out of time?**
A: Minimum viable demo: Upload PDF → Show score. That's it.

**Q: Should we use the free tier APIs?**
A: Yes, absolutely. Show judges you optimized for cost.

**Q: Can we refactor code after Hour 24?**
A: No. Refactoring wastes time. Build → Test → Ship. Fix after hackathon.

**Q: What if an API fails?**
A: Add error handling and move on. Log it as TODO for post-hackathon.

**Q: How do we decide what to cut?**
A: Priority list: OCR → Keyword → Score → Output → HITL → PDFs → Diagrams

**Q: Should we sleep?**
A: Yes, 6 hours/night minimum. Sleep deprivation kills productivity. This is a marathon, not a sprint.

**Q: How do we handle timezone issues?**
A: If distributed, have overlapping hours for daily syncs. Use GitHub for async work.

---

## Final Thought

You're not just building a system. You're proving that **3 students can ship production-grade software in 72 hours**.

That's the story that wins.

**Now go do it.**

🚀

---

*Questions? Ask me before Hour 0.*  
*After Hour 0, your team is moving fast. Good luck.*
