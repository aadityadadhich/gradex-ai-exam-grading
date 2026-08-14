# Team Member Prompts (Copy-Paste Ready)

**Use these prompts with Claude or ChatGPT to generate code for your tasks.**

---

## BACKEND DEV PROMPTS

### Prompt 1: OCR Engine Setup (Hours 5-12)

```
You are helping build a 72-hour hackathon project: an AI exam grading system.

TASK: Implement OCR extraction service using PaddleOCR and OpenCV
CONTEXT: 
- Framework: FastAPI
- Input: Multi-page student PDF (handwritten answers)
- Output: JSON with extracted text per page, OCR confidence, and diagram regions
- Goal: Extract text, detect if diagrams exist, and crop diagram regions for later processing

REQUIREMENTS:
1. Create `backend/app/services/ocr_service.py`
2. Class: OCRService with methods:
   - `extract_text_from_pdf(pdf_path)` → returns {"pages": [{"page_num", "text", "confidence", "has_diagram", "diagram_regions"}]}
   - `_detect_diagram(image_array)` → detects if page has diagram using edge detection
   - `_find_diagram_regions(image_array)` → returns bounding boxes [{x, y, width, height}]
3. Handle errors gracefully (return empty if OCR fails)
4. Ensure code is production-ready (type hints, docstrings)

DEPENDENCIES TO USE:
- paddleocr
- opencv-python
- pdf2image
- numpy
- PIL

IMPORTANT: Focus on correctness over features. This is for a 72-hour hackathon.

Generate complete, runnable code with example usage at the bottom.
```

### Prompt 2: Keyword Extraction & Evaluation (Hours 13-28)

```
TASK: Implement keyword extraction + evaluation service for exam grading
CONTEXT:
- Framework: FastAPI + SQLAlchemy
- Use LLM (Gemini 2.0 Flash) to extract keywords from student answers
- Match extracted keywords against rubric keywords
- Compute confidence score for HITL routing

REQUIREMENTS:
1. Create `backend/app/services/evaluation_service.py`
2. Class: EvaluationService with methods:
   - `match_keywords(student_keywords, rubric_keywords)` → {matched: [...], match_score: float, marks: float}
   - `_fuzzy_match(student_kw, rubric_keywords, threshold=0.7)` → best matching keyword
   - `compute_confidence_score(match_result, ocr_clarity)` → float (0-1)
   - `award_marks(match_result, rubric)` → marks awarded

3. Create `backend/app/services/llm_service.py`
2. Class: LLMService with methods:
   - `extract_keywords_from_text(student_answer, question_part)` → [{"keyword": "...", "confidence": 0.95}, ...]
   - `extract_keywords_from_diagram(image_base64, question_context)` → [{concept, confidence}, ...]
   - `generate_rubric_from_qna(question_text, answer_text)` → {keywords, weights, passing_threshold}

LOGIC:
- Extract keywords from student OCR text using Gemini (prompt optimized for tokens)
- Fuzzy match against rubric keywords (handle typos, abbreviations)
- Award marks based on: num_matched / passing_threshold
- Confidence = (keyword_match_score + ocr_clarity) / 2

KEYWORDS PROMPT (optimized for tokens, no markdown):
"Extract key concepts from this answer. Return ONLY JSON: [{"keyword": "concept1", "confidence": 0.95}]. Ignore spelling, grammar."

TOKEN BUDGET: Keep under 200 tokens per answer (use gemini-2.0-flash)

Generate complete code with examples.
```

### Prompt 3: FastAPI Endpoints (Hours 25-32)

```
TASK: Create FastAPI endpoints for exam management, PDF upload, and batch processing
CONTEXT:
- Need 6 main endpoints: create exam, save rubric, submit PDF, process batch, get results, HITL queue
- Database: PostgreSQL with SQLAlchemy ORM
- Background tasks for long-running operations (OCR + evaluation)

REQUIREMENTS:
1. Create `backend/app/routes/exams.py`:
   - POST /exam/create (create exam)
   - GET /exam/{exam_id} (get exam details)
   - PUT /exam/{exam_id}/rubric (save rubric)
   - GET /exam/{exam_id}/rubric (get rubric)
   - POST /exam/{exam_id}/submit-pdf (upload student PDF)
   - POST /exam/{exam_id}/process (start batch processing)

2. Create `backend/app/routes/uploads.py`:
   - POST /exam/{exam_id}/extract-ocr (extract OCR from uploaded PDF)

3. Error handling:
   - 404 for missing exam/rubric
   - 400 for validation errors
   - Return proper JSON responses

4. Background task:
   - Batch processing should run async (don't block API response)
   - Use FastAPI BackgroundTasks

DATABASE MODELS NEEDED:
- Exam: id, exam_name, subject, total_marks, created_at
- Rubric: id, exam_id, rubric_data (JSONB), created_at
- StudentSubmission: id, exam_id, roll_no, pdf_path, upload_timestamp
- Evaluation: id, submission_id, exam_id, question_id, extracted_keywords (JSON), matched_keywords (JSON), marks_awarded, confidence_score, requires_hitl, ai_reasoning, created_at

IMPORTANT: Include docstrings, proper type hints, Pydantic schemas for requests/responses.

Generate complete, production-ready code.
```

### Prompt 4: HITL API Endpoints (Hours 33-40)

```
TASK: Implement HITL (Human-in-the-Loop) review endpoints
CONTEXT:
- Teachers review low-confidence answers (confidence < 0.7)
- Teacher can approve, modify score, or add feedback
- Need queue system (get next, submit review)

REQUIREMENTS:
1. Create `backend/app/routes/hitl.py`:
   - GET /exam/{exam_id}/hitl-queue → returns next flagged evaluation
   - PUT /exam/{exam_id}/hitl/{evaluation_id} → submit review decision
   - GET /exam/{exam_id}/hitl-queue/count → count of pending reviews

2. GET /hitl-queue response format:
```json
{
  "evaluation_id": 42,
  "submission_id": 5,
  "roll_no": "A123",
  "question_id": "Q1B",
  "student_extracted_keywords": [{"keyword": "...", "confidence": 0.95}],
  "matched_keywords": [{"student_keyword": "...", "rubric_keyword": "...", "confidence": 0.85}],
  "ai_reasoning": "Student mentioned X but missing Y",
  "suggested_marks": 3.0,
  "max_marks": 4,
  "confidence_score": 0.65,
  "ocr_text_preview": "Student wrote: ..."
}
```

3. PUT /hitl/{evaluation_id} request:
```json
{
  "action": "APPROVED" | "MODIFIED" | "REJECTED",
  "final_marks": 3.5,
  "teacher_feedback": "Optional feedback for student"
}
```

4. Database updates:
   - Create HitlReview record
   - Update Evaluation.marks_awarded with final_marks
   - Update Evaluation.ai_reasoning with feedback

IMPORTANT: Ensure proper database transactions (rollback on error).

Generate complete code.
```

### Prompt 5: PDF & CSV Output Generation (Hours 41-48)

```
TASK: Generate individual grade PDFs and master CSV spreadsheet
CONTEXT:
- Individual PDF: Shows student's scanned answer (left) + AI reasoning (right), side-by-side
- CSV: All scores in spreadsheet format
- Use reportlab for PDF generation

REQUIREMENTS:
1. Create `backend/app/services/pdf_generator.py`:
   - Class: PDFGenerator
   - Method: `generate_grade_pdf(student_name, roll_no, evaluations, scanned_pages)` → BytesIO
     * Shows page-by-page: scanned answer | AI reasoning
     * Include: question ID, marks awarded, keywords matched, AI justification
   - Method: `generate_csv_results(exam_id, results)` → string (CSV content)
     * Columns: Roll No | Q1A Marks | Q1B Marks | Q2B Marks | Q1C Marks | Total | Confidence | HITL Reviewed

2. PDF Layout:
   - Header: "Grade Report - Roll No: A123"
   - For each question:
     * Table with 2 columns: "Student Answer" | "AI Evaluation"
     * Left: Cropped scan of answer (or text preview if no image)
     * Right: {question_id, max_marks, awarded_marks, keywords_found, reasoning}
   - Page break after every 2 questions

3. CSV Format:
```
Roll No,Q1A,Q1B,Q2B,Q1C,Total,Confidence,HITL Reviewed
A001,2.0,3.5,3.0,8.5,17.0,0.85,No
A002,1.5,2.0,3.5,7.0,14.0,0.62,Yes
```

IMPORTANT: Use reportlab.platypus for tables, handle image insertion gracefully.

Generate complete, tested code.
```

---

## FRONTEND DEV PROMPTS

### Prompt 1: React Project Setup (Hours 5-12)

```
TASK: Create React + Vite project structure for exam grading frontend
CONTEXT:
- Framework: React with Vite (fast setup)
- Styling: Tailwind CSS
- HTTP client: axios
- Need 6 main pages: home, exam setup, rubric builder, upload, HITL dashboard, results

REQUIREMENTS:
1. Vite React project structure:
```
frontend/
├── src/
│   ├── App.jsx
│   ├── api/
│   │   └── client.js (axios setup)
│   ├── components/
│   │   ├── ExamSetup/
│   │   │   ├── CreateExam.jsx
│   │   │   ├── ExamStructureBuilder.jsx
│   │   │   └── QuestionForm.jsx
│   │   ├── RubricBuilder/
│   │   │   ├── RubricBotChat.jsx
│   │   │   ├── RubricEditor.jsx
│   │   │   └── KeywordInput.jsx
│   │   ├── Upload/
│   │   │   └── PDFUpload.jsx
│   │   ├── Processing/
│   │   │   └── ProcessingDashboard.jsx
│   │   ├── HITL/
│   │   │   ├── HitlDashboard.jsx
│   │   │   └── HitlReviewCard.jsx
│   │   └── Output/
│   │       ├── ResultsViewer.jsx
│   │       └── DownloadOptions.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── ExamDashboard.jsx
│   │   └── Results.jsx
│   ├── styles/
│   │   └── globals.css
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── .env.example
```

2. Create axios API client (`src/api/client.js`) with:
   - Base URL from env
   - All endpoints as methods (exam.create, exam.submitPdf, rubric.generateBot, hitl.getQueue, etc.)

3. Create main App.jsx with:
   - Basic routing (Home → Exam Setup → Upload → HITL → Results)
   - Header with navigation

4. Install dependencies:
   - react, react-dom
   - vite
   - axios
   - react-router-dom
   - tailwindcss

5. .env.example should have REACT_APP_API_URL

Generate complete setup with example components (basic stubs for now).
```

### Prompt 2: Exam Setup UI (Hours 5-12)

```
TASK: Create exam setup and structure builder components
CONTEXT:
- Teacher defines exam: name, subject, parts (A/B/C), marks structure
- Part A: 2-mark questions (compulsory)
- Part B: 4-mark questions (5 out of 7)
- Part C: 10-mark questions (3 out of 5)
- Dynamically add/remove questions

REQUIREMENTS:
1. Component: CreateExam.jsx
   - Input: Exam name, Subject
   - Input: Select exam structure type (custom or template: Physics 16-mark format)
   - Button: Next → ExamStructureBuilder

2. Component: ExamStructureBuilder.jsx
   - Display 3 tabs: Part A | Part B | Part C
   - For each part:
     * Show summary (num questions, marks, compulsory flag, attempt count)
     * Button: Add Question
     * List of questions with delete buttons
   - Button: Save & Continue

3. Component: QuestionForm.jsx
   - Modal/form to add question:
     * Question ID (auto: Q1A, Q2A, etc.)
     * Question text (textarea)
     * Marks (number)
     * Part type (A/B/C)
   - Button: Save Question

4. State management:
   - Use useState for exam data
   - Pass exam data to parent via callback
   - Validate: Part A must have compulsory=true, Part B needs attempt count < num questions

5. Styling:
   - Clean, professional UI
   - Use Tailwind CSS utility classes
   - Form inputs with labels and placeholders

Generate complete, functional React components with form handling.
```

### Prompt 3: Rubric Bot Chat UI (Hours 13-20)

```
TASK: Create Rubric Bot chat interface for AI-assisted rubric generation
CONTEXT:
- Teacher uploads Question Paper PDF + Answer Key PDF
- AI analyzes and suggests rubric
- Teacher can edit and refine
- Save to backend

REQUIREMENTS:
1. Component: RubricBotChat.jsx
   - File inputs: Question PDF, Answer Key PDF
   - Upload button: "Generate Rubric Suggestions"
   - Loading state: show spinner while API calls Gemini

2. Display suggested rubric:
   - Show JSON rubric in expandable cards (one per question)
   - Each card shows: Q ID, Question text, Keywords, Weights, Passing Threshold

3. Component: RubricEditor.jsx (child of RubricBotChat)
   - Inline editing of rubric:
     * Question ID (text input)
     * Question text (textarea)
     * Marks (number input)
     * Keywords (comma-separated input → convert to array)
     * Weights (for each keyword: slider 0-1)
     * Passing threshold (number input)
   - Add/Remove question buttons
   - Save & Confirm button

4. API calls:
   - POST /exam/{examId}/rubric-bot with FormData (files)
   - PUT /exam/{examId}/rubric with edited rubric JSON

5. Error handling:
   - Show error if files not selected
   - Show error if API fails

Generate complete, production-ready React components with state management.
```

### Prompt 4: PDF Upload UI (Hours 21-28)

```
TASK: Create student PDF upload interface
CONTEXT:
- Teacher uploads student exam PDFs one-by-one
- Each PDF needs student roll number
- Show upload progress
- Handle validation (PDF only, valid roll number)

REQUIREMENTS:
1. Component: PDFUpload.jsx
   - Text input: Roll Number (e.g., A001)
   - File input: Select PDF
   - Upload button (disabled if no file or roll number)
   - Progress counter: "Uploaded 5 / 50"

2. Upload flow:
   - User enters roll number
   - User selects PDF file
   - Click Upload
   - Show loading state
   - On success: clear form, show success message, increment counter
   - On error: show error message, keep form data

3. Validation:
   - Roll number: non-empty, trim whitespace
   - File: must be PDF, check MIME type

4. API call:
   - POST /exam/{examId}/submit-pdf with FormData (roll_no, pdf_file)

5. Styling:
   - File input styled nicely (not default browser style)
   - Show selected filename
   - Progress bar or counter

6. Feature: Optional bulk upload
   - Alternative: ZIP file with multiple PDFs
   - Extract roll numbers from filenames or manifest

Generate complete, user-friendly component.
```

### Prompt 5: HITL Review Dashboard (Hours 29-40)

```
TASK: Create HITL (Human-in-the-Loop) review dashboard
CONTEXT:
- Display low-confidence answers one at a time
- Left pane: Student answer (scanned page + text preview)
- Right pane: AI evaluation (keywords, reasoning, suggested mark)
- Teacher can approve, modify, or skip

REQUIREMENTS:
1. Component: HitlDashboard.jsx
   - Call GET /exam/{examId}/hitl-queue to get next item
   - Layout: 2-column (answer | evaluation)

2. Left Pane (Student Answer):
   - Roll No, Question ID, Max Marks (header)
   - OCR text preview (monospace font)
   - If diagram: show extracted diagram text

3. Right Pane (AI Evaluation):
   - Section 1: Extracted Keywords
     * Show list with confidence scores (badges)
   - Section 2: Matched Keywords
     * Show student_keyword → rubric_keyword mapping
   - Section 3: AI Reasoning
     * Show full reasoning text
   - Section 4: Suggested Score
     * Display score / max_marks
   - Section 5: Confidence Bar
     * Visual bar (0-100%) showing confidence score
     * Color: red (<50%), orange (50-70%), green (>70%)

4. Override Controls:
   - Input: Final Mark (number, 0 to max_marks, step 0.5)
   - Textarea: Teacher Feedback (optional)
   - Buttons:
     * "Approve" → accept AI mark
     * "Modify" → use overridden mark
     * "Skip" → load next item

5. State management:
   - Track current item, override mark, feedback
   - Load next item after submission
   - Show count: "Item 3 of 15"

6. Styling:
   - Side-by-side layout (responsive on mobile)
   - Clear visual hierarchy
   - Buttons distinct (approve=green, modify=blue, skip=gray)

Generate complete, functional HITL dashboard component.
```

### Prompt 6: Results Viewer UI (Hours 37-44)

```
TASK: Create results viewer with download options
CONTEXT:
- Display all final scores in table
- Download individual student PDFs
- Download master CSV spreadsheet

REQUIREMENTS:
1. Component: ResultsViewer.jsx
   - GET /exam/{examId}/results to load all scores
   - Display table with columns:
     * Roll No
     * Q1A, Q1B, Q2B, Q1C (individual question marks)
     * Total Marks
     * Confidence (percentage)
     * HITL Reviewed (Yes/No)
     * Actions (download PDF button)

2. Styling:
   - Table with alternating row colors
   - Responsive (scroll on mobile)
   - Sortable columns (click header to sort)

3. Download Options:
   - Button: "Download All Results (CSV)" → GET /exam/{examId}/download-csv
   - Each row has "📄 PDF" link → GET /exam/{examId}/download-pdf/{rollNo}

4. Features:
   - Search/filter by roll number
   - Show summary stats (average, min, max marks)
   - Color-code confidence (red <50%, yellow 50-70%, green >70%)

5. Loading state:
   - Show spinner while fetching results
   - Show error message if API fails

Generate complete results viewer with all features.
```

---

## INTEGRATION / LLM LEAD PROMPTS

### Prompt 1: LLM API Integration (Hours 5-16)

```
TASK: Set up and optimize LLM API integrations
CONTEXT:
- Use Gemini 2.0 Flash for keyword extraction (free tier: 60 req/min)
- Use Gemini Vision for diagram extraction
- Use Mistral as fallback
- CRITICAL: Optimize tokens to fit free tier budget

REQUIREMENTS:
1. Create `backend/app/services/llm_service.py` with:
   - Setup Google Generative AI client (gemini-2.0-flash)
   - Method: extract_keywords_from_text(student_answer, question_part)
   - Method: extract_keywords_from_diagram(image_base64, question_context)
   - Method: generate_rubric_from_qna(question_text, answer_text)
   - Error handling: API failures, rate limits (429), timeouts

2. Optimized prompts (MUST be token-efficient):
   PROMPT A (Keyword Extraction):
   "Extract concepts from answer. JSON only: [{'keyword': '...', 'confidence': 0.9}]"
   
   PROMPT B (Diagram Analysis):
   "What labels/concepts in diagram? JSON: [{'concept': '...', 'confidence': 0.9}]"
   
   PROMPT C (Rubric Generation):
   "Keywords from Q&A? JSON: {'keywords': [...], 'weights': {...}, 'threshold': 1}"

3. Rate limiting strategy:
   - Batch requests: queue 50 keywords extraction, process ~60 per minute
   - Retry logic: exponential backoff for 429 errors
   - Monitor: log API usage per batch

4. Token budgeting:
   - Keyword extraction: ~100-150 tokens per answer (aim for 100)
   - Diagram extraction: ~200-300 tokens per image
   - Rubric generation: ~150-200 tokens per question
   - Target: 50 students × 4 questions × 150 tokens = 30,000 tokens (safe for free tier)

5. Error handling:
   - If API fails: return empty keywords, set confidence=0, flag for HITL
   - Log all failures
   - Fallback: return basic keyword extraction (just split text)

Generate production-ready LLM service with proper error handling and logging.
```

### Prompt 2: Rubric Bot Backend (Hours 17-32)

```
TASK: Implement backend for rubric generation (AI-assisted from Q&A PDFs)
CONTEXT:
- Teacher uploads Question Paper PDF + Answer Key PDF
- System extracts text from both
- LLM analyzes and generates suggested rubric
- Return structured JSON with keywords, weights, passing threshold

REQUIREMENTS:
1. Create endpoint: POST /exam/{exam_id}/rubric-bot
   Input: FormData with question_pdf, answer_key_pdf
   Output:
   {
     "suggested_rubric": {
       "questions": [
         {
           "q_id": "Q1A",
           "question_text": "Define mitochondria",
           "marks": 2,
           "keywords": ["mitochondria", "organelle", "ATP"],
           "keyword_weights": {"mitochondria": 1.0, "organelle": 0.8, "ATP": 1.0},
           "passing_threshold": 2,
           "grading_notes": "Must mention X and Y"
         }
       ]
     },
     "confidence": 0.85
   }

2. Implementation flow:
   - Receive FormData with 2 PDFs
   - Save to temp files
   - Extract OCR from both PDFs using OCRService
   - Combine extracted text: "Question: ... Answer: ..."
   - Call LLM: "Generate rubric from this Q&A. Return JSON with keywords, weights..."
   - Parse JSON response
   - Handle parsing errors gracefully (return empty or partial)
   - Return structured response

3. LLM Prompt:
   ```
   Given this question and answer key, suggest a marking rubric.
   
   Question: {question_text}
   Answer Key: {answer_text}
   
   Return ONLY valid JSON (no markdown):
   {
     "keywords": ["kw1", "kw2", "kw3"],
     "weights": {"kw1": 1.0, "kw2": 0.8, "kw3": 0.7},
     "passing_threshold": 2,
     "grading_notes": "Brief explanation of rubric logic"
   }
   ```

4. Error handling:
   - If OCR fails: return error message
   - If LLM fails: return error message
   - If JSON parsing fails: log error, return empty rubric (teacher fills manually)

5. Database:
   - Don't save suggested rubric to DB yet (frontend will let teacher edit first)
   - Only save when teacher clicks "Confirm & Save"

Generate complete endpoint with proper error handling.
```

### Prompt 3: Testing & Optimization (Hours 33-48)

```
TASK: Test LLM prompts, optimize token usage, and verify end-to-end flow
CONTEXT:
- Need to ensure prompts work correctly and fit free tier budget
- Test with sample student answers, rubrics, diagrams
- Track token usage per request

REQUIREMENTS:
1. Create test script: `backend/tests/test_llm_prompts.py`
   - Test keyword extraction with 5 sample answers
   - Test diagram analysis with 2 sample diagrams
   - Test rubric generation with 3 sample Q&A pairs
   - For each: verify JSON parsing, check confidence scores, log tokens used

2. Sample test data:
   SAMPLE ANSWER 1:
   "Mitochondria are the powerhouse of the cell. They produce ATP through oxidative phosphorylation."
   Expected keywords: ["mitochondria", "ATP", "oxidative phosphorylation"]

   SAMPLE ANSWER 2 (with typo):
   "Mitocondria produce energy for the cell using oxydative phosphorilation"
   Expected keywords: (should match despite typos) ["mitochondria", "ATP", "oxidative"]

   SAMPLE ANSWER 3 (missing keywords):
   "The powerhouse of the cell produces energy"
   Expected: Low confidence (missing specific terms)

3. Test rubric generation:
   - Upload sample question paper PDF
   - Upload sample answer key PDF
   - Verify rubric JSON structure
   - Check keyword extraction accuracy
   - Verify passing_threshold is reasonable

4. Token tracking:
   - Add logging: print tokens used per request
   - Calculate total tokens for 50 students × 4 questions
   - Verify staying under free tier limits (1500 req/day, 60 req/min)

5. Prompt optimization:
   - Measure token count for each prompt variation
   - Test shorter/longer prompts
   - Keep final prompts minimal (no explanations, no markdown)

6. Edge cases:
   - Illegible handwriting (very low OCR confidence)
   - Diagram-only answers (no text)
   - Very short answers (1-2 words)
   - Verify keyword extraction handles these gracefully

Generate comprehensive test suite with logging and optimization analysis.
```

---

## QUICK REFERENCE: WHO BUILDS WHAT

| Task | Dev | Hours | Branch | Status |
|------|-----|-------|--------|--------|
| Backend setup | Backend | 1-2 | feat/backend-setup | Foundation |
| Frontend setup | Frontend | 1-2 | feat/frontend-setup | Foundation |
| OCR engine | Backend | 5-12 | feat/ocr-engine | Core |
| Keyword extraction + evaluation | Backend + Integration | 13-28 | feat/keyword-eval + feat/llm-int | Core |
| API endpoints | Backend | 25-32 | feat/api-endpoints | Core |
| Exam setup UI | Frontend | 5-12 | feat/exam-setup-ui | UI |
| Rubric bot UI | Frontend + Integration | 13-20 | feat/rubric-bot-ui + feat/rubric-bot-backend | UI + LLM |
| Upload UI | Frontend | 21-26 | feat/upload-ui | UI |
| HITL dashboard | Frontend | 29-40 | feat/hitl-dashboard | UI |
| HITL API | Backend | 33-40 | feat/hitl-api | Core |
| Output generation | Backend + Frontend | 41-54 | feat/output-gen + feat/results-ui | Output |
| Testing + polish | All | 49-72 | feat/integration-testing + feat/bug-fixes | QA |

---

## How to Use These Prompts

1. **Copy entire prompt** from above (e.g., "OCR Engine Setup")
2. **Paste into Claude/ChatGPT**
3. **Add at the end:**
   ```
   Generate complete, production-ready, copy-paste code.
   Include error handling, docstrings, and type hints.
   Target: 72-hour hackathon (prioritize working over perfect).
   ```
4. **Get back:** Full working code you can commit
5. **Commit to your branch** (e.g., `feat/ocr-engine`)
6. **Push to GitHub**
7. **Open PR to `dev` branch**
8. **Quick 5-min review + merge**
9. **Move to next task**

---

## Token Budgeting Checklist

Track your free-tier usage:

```
GEMINI FREE TIER:
- Quota: 60 requests/minute, 1500 requests/day
- 50 students × 4 questions = 200 keyword extraction calls
- 50 students × (maybe) 10 diagrams = 500 diagram extraction calls
- Cost: ~50 keywords/day safe, plan for 200 total (one batch)

MISTRAL FREE TIER:
- Limited but available
- Use only if Gemini fails

API KEYS:
- Store in .env (git-ignored)
- Example: GEMINI_API_KEY=xyz
```

---

**Give each team member their specific prompt section. They can go straight from prompt → code → commit.**

**Ship it.** 🚀
