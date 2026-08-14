# Development Plan: AI Exam Grading System (72-Hour Hackathon)

**Team:** 3 Students  
**Timeline:** 72 Hours (3 days)  
**Git Strategy:** Feature branching with daily merges to `dev`

---

## Team Role Assignment

| Role | Responsibility | Hours 1-24 | Hours 25-48 | Hours 49-72 |
|------|---|---|---|---|
| **Backend Dev** | FastAPI, OCR, LLM Integration | Setup + OCR Engine | Keyword Evaluation + APIs | HITL API + Testing |
| **Frontend Dev** | React UI, Dashboard, Components | Setup + Exam Builder | Rubric Bot + HITL Dashboard | Results UI + Polish |
| **Integration Lead** | LLM Prompts, API Bridges, Testing | LLM Setup + Rubric Bot | Keyword Extraction Pipeline | Output Generation + Deployment |

---

## Git Repository Structure

```
exam-grading-system/
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md
├── backend/
│   ├── app/
│   │   ├── main.py (FastAPI app)
│   │   ├── config.py (DB, API keys)
│   │   ├── models.py (SQLAlchemy models)
│   │   ├── schemas.py (Pydantic schemas)
│   │   ├── services/
│   │   │   ├── ocr_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── evaluation_service.py
│   │   │   └── pdf_generator.py
│   │   └── routes/
│   │       ├── exams.py
│   │       ├── rubrics.py
│   │       ├── uploads.py
│   │       ├── evaluations.py
│   │       ├── hitl.py
│   │       └── outputs.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js (axios setup)
│   │   ├── components/
│   │   │   ├── ExamSetup/
│   │   │   ├── RubricBuilder/
│   │   │   ├── Upload/
│   │   │   ├── Processing/
│   │   │   ├── HITL/
│   │   │   └── Output/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ExamDashboard.jsx
│   │   │   └── Results.jsx
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── utils/
│   │       └── helpers.js
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── docs/
│   ├── SRDD.md
│   ├── API_REFERENCE.md
│   └── SETUP.md
├── README.md
├── .gitignore
└── .github/workflows/
    └── tests.yml

```

---

## Git Workflow (Daily Process)

### Day 1 Initialization (Hour 0)

```bash
# Initialize repo
git init exam-grading-system
cd exam-grading-system

# Create main + dev branches
git checkout -b dev
git push -u origin dev

# Each student creates feature branch
# BACKEND DEV
git checkout -b feat/backend-setup
git push -u origin feat/backend-setup

# FRONTEND DEV
git checkout -b feat/frontend-setup
git push -u origin feat/frontend-setup

# INTEGRATION DEV
git checkout -b feat/llm-integration
git push -u origin feat/llm-integration
```

### Daily Merges (Every 8-12 Hours)

```bash
# Commit on feature branch (hourly)
git add app/services/ocr.py
git commit -m "feat: OCR engine extraction with confidence scoring"
git push origin feat/backend-setup

# End of shift (prepare to merge)
# 1. Pull latest dev
git pull origin dev

# 2. Resolve conflicts (if any)
git merge dev (on your feature branch)

# 3. Push updated feature
git push origin feat/backend-setup

# 4. Open Pull Request on GitHub
# 5. Quick code review (5 minutes, teammates review)
# 6. Merge to dev
git checkout dev
git pull origin dev
git merge feat/backend-setup
git push origin dev

# 7. Continue with next task on new branch
git checkout -b feat/keyword-evaluation
git push -u origin feat/keyword-evaluation
```

### Final Push (Hour 72)

```bash
# All features merged to dev
git checkout dev
git pull origin dev

# Final test
npm run test
python -m pytest backend/

# Merge to main
git checkout main
git merge dev
git push origin main

# Tag release
git tag -a v1.0-hackathon -m "72-hour hackathon release"
git push origin --tags

# Optional: Create GitHub Release (UI)
```

---

## Commit Message Convention

```bash
# Format: type(scope): subject
# Examples:

git commit -m "feat(ocr): implement PaddleOCR extraction with confidence scoring"
git commit -m "fix(api): handle empty keyword extraction gracefully"
git commit -m "test(evaluation): add unit tests for keyword matching"
git commit -m "docs(readme): add setup instructions for PostgreSQL"
git commit -m "refactor(ocr): optimize image preprocessing pipeline"

# Types: feat, fix, test, docs, refactor, chore
```

---

## Detailed Task Breakdown (72 Hours)

### PHASE 1: Setup & Infrastructure (Hours 1-4)

---

#### TASK 1A: Backend Project Setup (2 hours) — Backend Dev

**What to do:**
1. Create FastAPI project structure
2. Set up PostgreSQL connection
3. Initialize environment variables
4. Create base models & schemas

**Branch:** `feat/backend-setup`

**Deliverable Checklist:**
- [ ] FastAPI app runs on `localhost:8000`
- [ ] PostgreSQL connected (Supabase free tier)
- [ ] Database tables created
- [ ] `.env` template ready

**Code Scaffold (Copy-Paste Ready):**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(
    title="Exam Grading API",
    description="AI-powered subjective exam evaluation",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["localhost:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Run: uvicorn app.main:app --reload
```

```python
# backend/app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = os.getenv("DATABASE_URL")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
    UPLOAD_DIR = "./uploads"
    OUTPUT_DIR = "./outputs"
```

```python
# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Exam(Base):
    __tablename__ = "exams"
    id = Column(Integer, primary_key=True)
    exam_name = Column(String(255))
    subject = Column(String(255))
    total_marks = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)

class Rubric(Base):
    __tablename__ = "rubrics"
    id = Column(Integer, primary_key=True)
    exam_id = Column(Integer)
    rubric_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)

# Add other models as needed (StudentSubmission, OCROutput, Evaluation, etc.)
```

```bash
# backend/requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
paddleocr==2.7.0.3
opencv-python==4.8.1.78
google-generativeai==0.3.0
requests==2.31.0
pydantic==2.5.0
python-multipart==0.0.6
reportlab==4.0.7
openpyxl==3.11.0
```

```bash
# backend/.env.example
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
GEMINI_API_KEY=your_key_here
MISTRAL_API_KEY=your_key_here
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
```

**Commit Message:**
```
feat(backend): initialize FastAPI project with PostgreSQL setup
```

---

#### TASK 1B: Frontend Project Setup (2 hours) — Frontend Dev

**What to do:**
1. Create React app (Vite for speed)
2. Set up folder structure
3. Configure API client (axios)
4. Create base layout

**Branch:** `feat/frontend-setup`

**Deliverable Checklist:**
- [ ] React app runs on `localhost:3000`
- [ ] Axios client configured
- [ ] Folder structure ready
- [ ] Mock home page displays

**Code Scaffold:**

```bash
# Create Vite React app
npm create vite@latest exam-grading-frontend -- --template react
cd exam-grading-frontend
npm install
npm run dev
```

```javascript
// frontend/src/api/client.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const apiEndpoints = {
    exam: {
        create: (data) => client.post('/exam/create', data),
        getRubric: (examId) => client.get(`/exam/${examId}/rubric`),
        submitPdf: (examId, data) => client.post(`/exam/${examId}/submit-pdf`, data),
        process: (examId) => client.post(`/exam/${examId}/process`),
        getResults: (examId) => client.get(`/exam/${examId}/results`),
    },
    rubric: {
        generateBot: (examId, data) => client.post(`/exam/${examId}/rubric-bot`, data),
        save: (examId, data) => client.put(`/exam/${examId}/rubric`, data),
    },
    hitl: {
        getQueue: (examId) => client.get(`/exam/${examId}/hitl-queue`),
        submit: (examId, evaluationId, data) => client.put(`/exam/${examId}/hitl/${evaluationId}`, data),
    },
    output: {
        download: (examId) => client.get(`/exam/${examId}/outputs`),
    },
};

export default client;
```

```jsx
// frontend/src/App.jsx
import React, { useState } from 'react';
import './App.css';

function App() {
    return (
        <div className="app">
            <header className="header">
                <h1>AI Exam Grading System</h1>
                <p>Automated subjective exam evaluation</p>
            </header>
            <main>
                {/* Components will go here */}
            </main>
        </div>
    );
}

export default App;
```

```bash
# frontend/.env.example
REACT_APP_API_URL=http://localhost:8000
```

**Commit Message:**
```
feat(frontend): initialize React app with Vite and API client
```

---

### PHASE 2: Core Functionality (Hours 5-48)

---

#### TASK 2A: OCR Engine & Layout Analysis (8 hours) — Backend Dev

**Hours:** 5-12  
**Branch:** `feat/ocr-engine`

**What to do:**
1. Integrate PaddleOCR for text extraction
2. Integrate OpenCV for diagram detection
3. Create OCR service module
4. Test with sample PDFs

**Deliverable Checklist:**
- [ ] PaddleOCR extracts text from sample PDF
- [ ] OCR confidence scores calculated
- [ ] Diagrams detected and cropped
- [ ] Results saved to database

**Code Scaffold:**

```python
# backend/app/services/ocr_service.py
from paddleocr import PaddleOCR
import cv2
import numpy as np
from PIL import Image
import io
import json

class OCRService:
    def __init__(self):
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')
    
    def extract_text_from_pdf(self, pdf_path):
        """
        Extract text from PDF using PaddleOCR
        Returns: {
            'pages': [
                {
                    'page_num': 1,
                    'text': 'extracted text',
                    'confidence': 0.92,
                    'has_diagram': True,
                    'diagram_regions': [...]
                }
            ]
        }
        """
        import pdf2image
        
        pages = pdf2image.convert_from_path(pdf_path)
        results = {'pages': []}
        
        for page_num, image in enumerate(pages):
            # Convert PIL to numpy array
            image_array = np.array(image)
            
            # Run OCR
            ocr_result = self.ocr.ocr(image_array, cls=True)
            
            # Extract text
            text = '\n'.join([line[1][0] for line in ocr_result if line])
            confidence = np.mean([line[1][1] for line in ocr_result if line])
            
            # Detect diagrams (simplified: check for large blank regions)
            has_diagram = self._detect_diagram(image_array)
            diagram_regions = self._find_diagram_regions(image_array) if has_diagram else []
            
            results['pages'].append({
                'page_num': page_num + 1,
                'text': text,
                'confidence': float(confidence),
                'has_diagram': has_diagram,
                'diagram_regions': diagram_regions
            })
        
        return results
    
    def _detect_diagram(self, image_array):
        """Simple diagram detection using edge detection"""
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        edge_ratio = np.sum(edges > 0) / edges.size
        return edge_ratio > 0.1  # If >10% edges, likely diagram
    
    def _find_diagram_regions(self, image_array):
        """Find bounding boxes of diagram regions"""
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w > 50 and h > 50:  # Filter small noise
                regions.append({'x': x, 'y': y, 'width': w, 'height': h})
        
        return regions

# Usage
ocr_service = OCRService()
result = ocr_service.extract_text_from_pdf("student_answer.pdf")
```

**API Endpoint (Add to backend):**

```python
# backend/app/routes/uploads.py
from fastapi import APIRouter, UploadFile, File, Depends
from app.services.ocr_service import OCRService
import shutil

router = APIRouter()
ocr_service = OCRService()

@router.post("/exam/{exam_id}/extract-ocr")
async def extract_ocr(exam_id: int, file: UploadFile = File(...)):
    """Extract OCR from uploaded PDF"""
    import tempfile
    
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        ocr_result = ocr_service.extract_text_from_pdf(tmp_path)
        return ocr_result
    except Exception as e:
        return {"error": str(e)}
```

**Test Command:**
```bash
curl -X POST "http://localhost:8000/exam/1/extract-ocr" -F "file=@sample.pdf"
```

**Commit Message:**
```
feat(ocr): implement PaddleOCR extraction with diagram detection
```

---

#### TASK 2B: Keyword Extraction & Evaluation Engine (16 hours) — Backend Dev + Integration Lead

**Hours:** 13-28  
**Branches:** 
- Backend: `feat/keyword-evaluation`
- Integration: `feat/llm-integration`

**What to do (Parallel):**

**Integration Lead:**
1. Set up Gemini Flash API client
2. Create rubric generation prompt
3. Create keyword extraction prompt
4. Test prompts with sample inputs

**Backend Dev:**
1. Implement keyword extraction service
2. Implement keyword matching logic
3. Implement confidence scoring
4. Integrate with OCR results

**Deliverable Checklist:**
- [ ] Gemini API credentials working
- [ ] Prompts tested and optimized (token count tracked)
- [ ] Keyword extraction working on sample text
- [ ] Confidence scoring implemented
- [ ] Evaluation results saved to DB

**Code Scaffold:**

```python
# backend/app/services/llm_service.py
import google.generativeai as genai
import json
import os
from typing import List, Dict

class LLMService:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.vision_model = genai.GenerativeModel('gemini-2.0-flash')
    
    def extract_keywords_from_text(self, student_answer: str, question_part: str) -> List[Dict]:
        """
        Extract keywords from student answer using LLM
        Input: Student OCR text
        Output: [{"keyword": "concept", "confidence": 0.92}, ...]
        """
        prompt = f"""Extract key concepts/keywords from this student answer.
Question Part: {question_part}
Answer Text: {student_answer}

Return ONLY a JSON array of keywords with confidence (0-1):
[
  {{"keyword": "concept1", "confidence": 0.95}},
  {{"keyword": "concept2", "confidence": 0.88}}
]
Ignore: spelling, grammar, handwriting. Focus on core concepts only.
Do NOT include markdown, just raw JSON."""
        
        try:
            response = self.model.generate_content(prompt)
            # Parse JSON response
            response_text = response.text.strip()
            if response_text.startswith('['):
                keywords = json.loads(response_text)
            else:
                # If model returns markdown, strip it
                keywords = json.loads(response_text.replace('```json', '').replace('```', ''))
            return keywords
        except json.JSONDecodeError:
            return []  # Return empty if parsing fails
    
    def extract_keywords_from_diagram(self, image_base64: str, question_context: str) -> List[Dict]:
        """
        Extract text/concepts from diagram using Gemini Vision
        """
        prompt = f"""Analyze this diagram and extract text/concepts shown.
Question Context: {question_context}
Return ONLY JSON array:
[
  {{"concept": "label1", "confidence": 0.95}},
  {{"concept": "label2", "confidence": 0.88}}
]"""
        
        try:
            import base64
            image_data = base64.b64decode(image_base64)
            response = self.vision_model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_base64}
            ])
            concepts = json.loads(response.text.strip())
            return concepts
        except:
            return []
    
    def generate_rubric_from_qna(self, question_text: str, answer_text: str) -> Dict:
        """
        Generate rubric suggestions from question + answer key
        """
        prompt = f"""Given this question and answer key, suggest marking rubric.
Question: {question_text}
Answer Key: {answer_text}

Return ONLY JSON (no markdown):
{{
  "keywords": ["kw1", "kw2"],
  "weights": {{"kw1": 1.0, "kw2": 0.8}},
  "passing_threshold": 2,
  "grading_notes": "..."
}}"""
        
        try:
            response = self.model.generate_content(prompt)
            rubric = json.loads(response.text.strip())
            return rubric
        except:
            return {}

# Usage
llm_service = LLMService()
keywords = llm_service.extract_keywords_from_text("Mitochondria produce ATP", "Part A")
```

```python
# backend/app/services/evaluation_service.py
from typing import List, Dict
from difflib import SequenceMatcher

class EvaluationService:
    def match_keywords(self, student_keywords: List[Dict], rubric_keywords: Dict) -> Dict:
        """
        Match extracted student keywords against rubric keywords
        
        student_keywords: [{"keyword": "mitochondria", "confidence": 0.95}, ...]
        rubric_keywords: {"mitochondria": 1.0, "ATP": 0.9, ...}
        
        Returns: {
            "matched": [...],
            "match_score": 0.85,
            "marks_to_award": 1.5
        }
        """
        matched = []
        match_score = 0
        
        for student_kw in student_keywords:
            best_match = self._fuzzy_match(
                student_kw["keyword"],
                list(rubric_keywords.keys())
            )
            
            if best_match:
                rubric_weight = rubric_keywords[best_match]
                confidence = student_kw["confidence"] * rubric_weight
                matched.append({
                    "student_keyword": student_kw["keyword"],
                    "rubric_keyword": best_match,
                    "confidence": confidence
                })
                match_score += rubric_weight
        
        return {
            "matched": matched,
            "match_score": match_score,
            "num_matched": len(matched),
            "total_expected": len(rubric_keywords)
        }
    
    def _fuzzy_match(self, student_kw: str, rubric_keywords: List[str], threshold=0.7) -> str or None:
        """Fuzzy match with typo tolerance"""
        best_ratio = 0
        best_match = None
        
        for rubric_kw in rubric_keywords:
            ratio = SequenceMatcher(None, student_kw.lower(), rubric_kw.lower()).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = rubric_kw if ratio >= threshold else None
        
        return best_match
    
    def compute_confidence_score(self, match_result: Dict, ocr_clarity: float) -> float:
        """
        Confidence = average of keyword match + OCR clarity
        """
        keyword_confidence = match_result["match_score"] / max(match_result["total_expected"], 1)
        final_confidence = (keyword_confidence + ocr_clarity) / 2
        return min(final_confidence, 1.0)
    
    def award_marks(self, match_result: Dict, rubric: Dict) -> float:
        """
        Award marks based on keyword matching
        
        rubric = {
            "marks": 4,
            "passing_threshold": 2,
            "weights": {"kw1": 1.0, "kw2": 0.8}
        }
        """
        num_matched = match_result["num_matched"]
        passing_threshold = rubric.get("passing_threshold", 1)
        total_marks = rubric.get("marks", 0)
        
        if num_matched >= passing_threshold:
            # Award marks proportional to matched keywords
            proportion = min(num_matched / rubric.get("total_keywords", 1), 1.0)
            marks_awarded = total_marks * proportion
        else:
            marks_awarded = 0
        
        return marks_awarded

# Usage
eval_service = EvaluationService()
match = eval_service.match_keywords(
    [{"keyword": "mitochondria", "confidence": 0.95}],
    {"mitochondria": 1.0, "ATP": 0.9}
)
confidence = eval_service.compute_confidence_score(match, ocr_clarity=0.85)
marks = eval_service.award_marks(match, rubric={"marks": 2, "passing_threshold": 1})
```

**Commit Messages:**
```
feat(llm): integrate Gemini API for keyword extraction
feat(evaluation): implement keyword matching and confidence scoring
```

---

#### TASK 2C: API Endpoints (Exam, Rubric, Upload) (8 hours) — Backend Dev

**Hours:** 25-32  
**Branch:** `feat/api-endpoints`

**What to do:**
1. Create exam management endpoints (`/exam/create`, `/exam/{id}/rubric`)
2. Create PDF upload endpoint
3. Create batch processing endpoint
4. Add error handling & validation

**Deliverable Checklist:**
- [ ] Exam create endpoint tested
- [ ] Rubric save/get endpoints working
- [ ] PDF upload with roll number
- [ ] Batch processing kicks off (background task)
- [ ] All endpoints return proper JSON

**Code Scaffold:**

```python
# backend/app/routes/exams.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.services.ocr_service import OCRService
from app.services.llm_service import LLMService
from app.services.evaluation_service import EvaluationService
import os
import shutil
import asyncio

router = APIRouter()
ocr_service = OCRService()
llm_service = LLMService()
eval_service = EvaluationService()

class CreateExamRequest(BaseModel):
    exam_name: str
    subject: str
    exam_structure: list  # [{part, num_questions, marks_per_question, ...}]

@router.post("/exam/create")
def create_exam(request: CreateExamRequest, db: Session = Depends(get_db)):
    """Create new exam"""
    exam = models.Exam(
        exam_name=request.exam_name,
        subject=request.subject,
        total_marks=sum([q["num_questions"] * q["marks_per_question"] for q in request.exam_structure])
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return {"exam_id": exam.id, "status": "created"}

@router.get("/exam/{exam_id}")
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    """Get exam details"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.put("/exam/{exam_id}/rubric")
def save_rubric(exam_id: int, rubric_data: dict, db: Session = Depends(get_db)):
    """Save rubric for exam"""
    existing = db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).first()
    if existing:
        existing.rubric_data = rubric_data
    else:
        rubric = models.Rubric(exam_id=exam_id, rubric_data=rubric_data)
        db.add(rubric)
    db.commit()
    return {"status": "rubric saved"}

@router.get("/exam/{exam_id}/rubric")
def get_rubric(exam_id: int, db: Session = Depends(get_db)):
    """Get rubric for exam"""
    rubric = db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return rubric.rubric_data

@router.post("/exam/{exam_id}/submit-pdf")
async def submit_pdf(exam_id: int, roll_no: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload student PDF"""
    os.makedirs("./uploads", exist_ok=True)
    
    filename = f"{exam_id}_{roll_no}.pdf"
    filepath = f"./uploads/{filename}"
    
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    submission = models.StudentSubmission(
        exam_id=exam_id,
        roll_no=roll_no,
        pdf_path=filepath
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return {
        "submission_id": submission.id,
        "roll_no": roll_no,
        "status": "uploaded"
    }

@router.post("/exam/{exam_id}/process")
async def process_exam(exam_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Start batch processing"""
    submissions = db.query(models.StudentSubmission).filter(models.StudentSubmission.exam_id == exam_id).all()
    rubric = db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).first()
    
    if not rubric:
        raise HTTPException(status_code=400, detail="Rubric not defined")
    
    # Start background processing
    background_tasks.add_task(process_submissions_bg, exam_id, submissions, rubric.rubric_data, db)
    
    return {"status": "processing started", "num_submissions": len(submissions)}

async def process_submissions_bg(exam_id: int, submissions, rubric_data, db):
    """Background task for processing"""
    for submission in submissions:
        try:
            # 1. OCR
            ocr_result = ocr_service.extract_text_from_pdf(submission.pdf_path)
            
            # 2. Evaluate each question
            for page in ocr_result['pages']:
                # Extract keywords
                keywords = llm_service.extract_keywords_from_text(
                    page['text'],
                    "Part A"  # TODO: determine part from question
                )
                
                # Match against rubric
                rubric_kws = rubric_data['questions'][0]['keyword_weights']  # Simplified
                match = eval_service.match_keywords(keywords, rubric_kws)
                
                # Compute confidence
                confidence = eval_service.compute_confidence_score(match, page['confidence'])
                
                # Save evaluation
                evaluation = models.Evaluation(
                    submission_id=submission.id,
                    exam_id=exam_id,
                    question_id="Q1A",
                    extracted_keywords=keywords,
                    matched_keywords=match['matched'],
                    confidence_score=confidence,
                    requires_hitl=confidence < 0.7
                )
                db.add(evaluation)
            
            db.commit()
        except Exception as e:
            print(f"Error processing submission {submission.id}: {e}")
```

**Commit Message:**
```
feat(api): implement exam and rubric management endpoints
```

---

#### TASK 2D: Rubric Bot Chat (8 hours) — Frontend Dev + Integration Lead

**Hours:** 13-20  
**Branches:**
- Frontend: `feat/rubric-bot-ui`
- Integration: `feat/rubric-bot-backend`

**What to do:**

**Frontend:**
1. Create chat interface component
2. File upload for question paper + answer key
3. Display suggested rubric
4. Edit rubric inline

**Integration:**
1. Create `/exam/{id}/rubric-bot` endpoint
2. Extract text from uploaded PDFs
3. Call LLM to generate rubric
4. Return formatted JSON

**Deliverable Checklist:**
- [ ] Teacher can upload Q&A PDFs
- [ ] AI generates rubric suggestions
- [ ] Rubric displayed in editable form
- [ ] Teacher can save final rubric

**Frontend Code:**

```jsx
// frontend/src/components/RubricBuilder/RubricBotChat.jsx
import React, { useState } from 'react';
import { apiEndpoints } from '../../api/client';
import './RubricBotChat.css';

export function RubricBotChat({ examId, onRubricGenerated }) {
    const [questionFile, setQuestionFile] = useState(null);
    const [answerFile, setAnswerFile] = useState(null);
    const [suggestedRubric, setSuggestedRubric] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editedRubric, setEditedRubric] = useState(null);

    const handleGenerateRubric = async () => {
        if (!questionFile || !answerFile) {
            alert("Please upload both files");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('question_pdf', questionFile);
            formData.append('answer_key_pdf', answerFile);

            const response = await apiEndpoints.rubric.generateBot(examId, formData);
            setSuggestedRubric(response.data.suggested_rubric);
            setEditedRubric(JSON.parse(JSON.stringify(response.data.suggested_rubric)));
        } catch (error) {
            alert("Error generating rubric: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRubric = async () => {
        try {
            await apiEndpoints.rubric.save(examId, editedRubric);
            alert("Rubric saved successfully");
            onRubricGenerated(editedRubric);
        } catch (error) {
            alert("Error saving rubric: " + error.message);
        }
    };

    return (
        <div className="rubric-bot-chat">
            <h2>Rubric Builder Bot</h2>
            
            <div className="upload-section">
                <div className="file-input">
                    <label>Question Paper (PDF):</label>
                    <input type="file" onChange={(e) => setQuestionFile(e.target.files[0])} />
                </div>
                <div className="file-input">
                    <label>Answer Key (PDF):</label>
                    <input type="file" onChange={(e) => setAnswerFile(e.target.files[0])} />
                </div>
                <button onClick={handleGenerateRubric} disabled={loading}>
                    {loading ? "Generating..." : "Generate Rubric"}
                </button>
            </div>

            {suggestedRubric && (
                <div className="rubric-editor">
                    <h3>Suggested Rubric (Edit below)</h3>
                    {/* Editable form for rubric questions */}
                    {editedRubric?.questions?.map((question, idx) => (
                        <div key={idx} className="question-item">
                            <input
                                type="text"
                                value={question.q_id}
                                onChange={(e) => {
                                    let newRubric = JSON.parse(JSON.stringify(editedRubric));
                                    newRubric.questions[idx].q_id = e.target.value;
                                    setEditedRubric(newRubric);
                                }}
                                placeholder="Question ID"
                            />
                            <input
                                type="text"
                                value={question.question_text}
                                onChange={(e) => {
                                    let newRubric = JSON.parse(JSON.stringify(editedRubric));
                                    newRubric.questions[idx].question_text = e.target.value;
                                    setEditedRubric(newRubric);
                                }}
                                placeholder="Question"
                            />
                            <input
                                type="number"
                                value={question.marks}
                                onChange={(e) => {
                                    let newRubric = JSON.parse(JSON.stringify(editedRubric));
                                    newRubric.questions[idx].marks = parseInt(e.target.value);
                                    setEditedRubric(newRubric);
                                }}
                                placeholder="Marks"
                            />
                            <textarea
                                value={question.keywords?.join(", ")}
                                onChange={(e) => {
                                    let newRubric = JSON.parse(JSON.stringify(editedRubric));
                                    newRubric.questions[idx].keywords = e.target.value.split(",").map(k => k.trim());
                                    setEditedRubric(newRubric);
                                }}
                                placeholder="Keywords (comma-separated)"
                            />
                        </div>
                    ))}
                    <button onClick={handleSaveRubric}>Save Rubric</button>
                </div>
            )}
        </div>
    );
}
```

**Backend Endpoint:**

```python
# backend/app/routes/rubrics.py (ADD)
from fastapi import APIRouter, UploadFile, File
from app.services.llm_service import LLMService
from app.services.ocr_service import OCRService
import tempfile

router = APIRouter()
llm_service = LLMService()
ocr_service = OCRService()

@router.post("/exam/{exam_id}/rubric-bot")
async def generate_rubric_bot(exam_id: int, question_pdf: UploadFile = File(...), answer_key_pdf: UploadFile = File(...)):
    """Generate rubric suggestions from Q&A PDFs"""
    
    # Save temp files
    with tempfile.NamedTemporaryFile(delete=False) as q_tmp:
        q_tmp.write(await question_pdf.read())
        q_path = q_tmp.name
    
    with tempfile.NamedTemporaryFile(delete=False) as a_tmp:
        a_tmp.write(await answer_key_pdf.read())
        a_path = a_tmp.name
    
    try:
        # Extract OCR
        q_result = ocr_service.extract_text_from_pdf(q_path)
        a_result = ocr_service.extract_text_from_pdf(a_path)
        
        question_text = "\n".join([p['text'] for p in q_result['pages']])
        answer_text = "\n".join([p['text'] for p in a_result['pages']])
        
        # Generate rubric
        rubric = llm_service.generate_rubric_from_qna(question_text, answer_text)
        
        return {
            "suggested_rubric": rubric,
            "confidence": 0.85
        }
    finally:
        import os
        os.unlink(q_path)
        os.unlink(a_path)
```

**Commit Messages:**
```
feat(frontend): create RubricBotChat component with file upload
feat(backend): implement rubric generation endpoint
```

---

#### TASK 2E: HITL Dashboard (12 hours) — Frontend Dev

**Hours:** 29-40  
**Branch:** `feat/hitl-dashboard`

**What to do:**
1. Create HITL review card component
2. Display student answer + AI reasoning side-by-side
3. Implement approve/modify/feedback buttons
4. Navigation (next/previous)
5. Connect to backend API

**Deliverable Checklist:**
- [ ] HITL queue displays next flagged item
- [ ] Answer images displayed
- [ ] AI reasoning shown clearly
- [ ] Teacher can override score
- [ ] Teacher can add feedback
- [ ] Next button loads new item

**Frontend Code:**

```jsx
// frontend/src/components/HITL/HitlDashboard.jsx
import React, { useState, useEffect } from 'react';
import { apiEndpoints } from '../../api/client';
import './HitlDashboard.css';

export function HitlDashboard({ examId }) {
    const [currentItem, setCurrentItem] = useState(null);
    const [overrideScore, setOverrideScore] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [queueCount, setQueueCount] = useState(0);

    useEffect(() => {
        loadNextItem();
    }, [examId]);

    const loadNextItem = async () => {
        setLoading(true);
        try {
            const response = await apiEndpoints.hitl.getQueue(examId);
            setCurrentItem(response.data);
            setOverrideScore(response.data?.suggested_marks || '');
            setFeedback('');
        } catch (error) {
            alert("No more items in queue or error loading: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (action) => {
        if (!currentItem) return;

        const reviewData = {
            action: action,  // APPROVED, MODIFIED, REJECTED
            final_marks: action === 'APPROVED' ? currentItem.suggested_marks : parseFloat(overrideScore),
            teacher_feedback: feedback
        };

        try {
            await apiEndpoints.hitl.submit(examId, currentItem.evaluation_id, reviewData);
            alert(`Review submitted (${action})`);
            loadNextItem();
        } catch (error) {
            alert("Error submitting review: " + error.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!currentItem) return <div>No items to review</div>;

    return (
        <div className="hitl-dashboard">
            <h2>HITL Review Dashboard</h2>
            
            <div className="hitl-container">
                {/* LEFT PANE: Student Answer */}
                <div className="left-pane">
                    <h3>Student Answer</h3>
                    <div className="student-info">
                        <p><strong>Roll No:</strong> {currentItem.roll_no}</p>
                        <p><strong>Question:</strong> {currentItem.question_id}</p>
                        <p><strong>Max Marks:</strong> {currentItem.max_marks}</p>
                    </div>
                    
                    <div className="answer-preview">
                        {currentItem.ocr_text_preview && (
                            <pre>{currentItem.ocr_text_preview}</pre>
                        )}
                        {currentItem.diagram_text && (
                            <div className="diagram-text">
                                <h4>Diagram Extracted:</h4>
                                <p>{currentItem.diagram_text}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: AI Evaluation */}
                <div className="right-pane">
                    <h3>AI Evaluation</h3>
                    
                    <div className="evaluation-card">
                        <div className="eval-row">
                            <label>Extracted Keywords:</label>
                            <div className="keywords">
                                {currentItem.student_extracted_keywords?.map((kw, i) => (
                                    <span key={i} className="keyword-badge">
                                        {kw.keyword} ({(kw.confidence * 100).toFixed(0)}%)
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="eval-row">
                            <label>Matched Keywords:</label>
                            <div className="matched">
                                {currentItem.matched_keywords?.map((m, i) => (
                                    <div key={i} className="match-item">
                                        "{m.student_keyword}" → "{m.rubric_keyword}" ({(m.confidence * 100).toFixed(0)}%)
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="eval-row">
                            <label>AI Reasoning:</label>
                            <p>{currentItem.ai_reasoning}</p>
                        </div>

                        <div className="eval-row">
                            <label>Suggested Mark:</label>
                            <strong>{currentItem.suggested_marks}/{currentItem.max_marks}</strong>
                        </div>

                        <div className="eval-row">
                            <label>Confidence Score:</label>
                            <div className="confidence-bar">
                                <div className="confidence-fill" style={{width: `${currentItem.confidence_score * 100}%`}}></div>
                            </div>
                            <span>{(currentItem.confidence_score * 100).toFixed(1)}% (HITL flagged)</span>
                        </div>
                    </div>

                    {/* Override Controls */}
                    <div className="override-controls">
                        <h4>Teacher Override</h4>
                        <div className="form-group">
                            <label>Final Mark:</label>
                            <input
                                type="number"
                                min="0"
                                max={currentItem.max_marks}
                                step="0.5"
                                value={overrideScore}
                                onChange={(e) => setOverrideScore(e.target.value)}
                                placeholder="Leave empty to accept AI mark"
                            />
                            <span>/ {currentItem.max_marks}</span>
                        </div>

                        <div className="form-group">
                            <label>Add Feedback for Student:</label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Optional feedback..."
                                rows="3"
                            />
                        </div>

                        <div className="action-buttons">
                            <button 
                                className="btn btn-approve"
                                onClick={() => handleSubmitReview('APPROVED')}
                            >
                                ✓ Approve
                            </button>
                            <button 
                                className="btn btn-modify"
                                onClick={() => handleSubmitReview('MODIFIED')}
                            >
                                ✎ Modify
                            </button>
                            <button 
                                className="btn btn-next"
                                onClick={loadNextItem}
                            >
                                Skip → Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

**Backend Endpoints:**

```python
# backend/app/routes/hitl.py (NEW)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models
from app.database import get_db
from pydantic import BaseModel

router = APIRouter()

class HitlReviewRequest(BaseModel):
    action: str  # APPROVED, MODIFIED, REJECTED
    final_marks: float
    teacher_feedback: str

@router.get("/exam/{exam_id}/hitl-queue")
def get_next_hitl_item(exam_id: int, db: Session = Depends(get_db)):
    """Get next flagged evaluation for HITL review"""
    evaluation = db.query(models.Evaluation).filter(
        models.Evaluation.exam_id == exam_id,
        models.Evaluation.requires_hitl == True,
        ~models.Evaluation.hitl_reviews  # No review yet
    ).first()
    
    if not evaluation:
        raise HTTPException(status_code=404, detail="No items in HITL queue")
    
    submission = db.query(models.StudentSubmission).get(evaluation.submission_id)
    
    return {
        "evaluation_id": evaluation.id,
        "submission_id": evaluation.submission_id,
        "roll_no": submission.roll_no,
        "question_id": evaluation.question_id,
        "student_extracted_keywords": evaluation.extracted_keywords,
        "matched_keywords": evaluation.matched_keywords,
        "ai_reasoning": evaluation.ai_reasoning,
        "suggested_marks": evaluation.marks_awarded,
        "max_marks": 4,  # TODO: Get from rubric
        "confidence_score": evaluation.confidence_score,
        "ocr_text_preview": evaluation.ocr_text_preview,
        "diagram_text": evaluation.diagram_extracted_text
    }

@router.put("/exam/{exam_id}/hitl/{evaluation_id}")
def submit_hitl_review(exam_id: int, evaluation_id: int, review: HitlReviewRequest, db: Session = Depends(get_db)):
    """Submit HITL review decision"""
    evaluation = db.query(models.Evaluation).get(evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    # Save HITL review
    hitl_review = models.HitlReview(
        evaluation_id=evaluation_id,
        teacher_name="Teacher",  # TODO: Get from auth
        action=review.action,
        final_marks=review.final_marks,
        teacher_feedback=review.teacher_feedback
    )
    db.add(hitl_review)
    
    # Update evaluation with final marks
    evaluation.marks_awarded = review.final_marks
    evaluation.ai_reasoning = review.teacher_feedback
    
    db.commit()
    
    return {"status": "review submitted"}
```

**Commit Message:**
```
feat(hitl): implement HITL dashboard with review controls
```

---

#### TASK 2F: Student PDF Upload UI (6 hours) — Frontend Dev

**Hours:** 21-26  
**Branch:** `feat/upload-ui`

**What to do:**
1. Upload form (one-by-one)
2. Roll number input
3. Progress tracking
4. Upload validation

**Frontend Code:**

```jsx
// frontend/src/components/Upload/PDFUpload.jsx
import React, { useState } from 'react';
import { apiEndpoints } from '../../api/client';
import './PDFUpload.css';

export function PDFUpload({ examId, onUploadComplete }) {
    const [rollNo, setRollNo] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [totalToUpload, setTotalToUpload] = useState(0);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            alert('Please select a PDF file');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!rollNo.trim() || !file) {
            alert('Please enter roll number and select PDF');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('pdf_file', file);
            formData.append('roll_no', rollNo);

            const response = await apiEndpoints.exam.submitPdf(examId, formData);
            setUploadedCount(prev => prev + 1);
            setRollNo('');
            setFile(null);
            document.getElementById('fileInput').value = '';
            
            alert(`Uploaded for ${rollNo}`);
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="pdf-upload">
            <h2>Upload Student PDFs</h2>
            
            <div className="upload-progress">
                <p>Uploaded: <strong>{uploadedCount}</strong> / {totalToUpload || "?"}</p>
            </div>

            <div className="upload-form">
                <div className="form-group">
                    <label>Student Roll Number:</label>
                    <input
                        type="text"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="e.g., A001"
                    />
                </div>

                <div className="form-group">
                    <label>PDF File:</label>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                    />
                    {file && <p>Selected: {file.name}</p>}
                </div>

                <button onClick={handleUpload} disabled={uploading || !file || !rollNo}>
                    {uploading ? "Uploading..." : "Upload"}
                </button>
            </div>
        </div>
    );
}
```

**Commit Message:**
```
feat(upload): create PDF upload form with roll number input
```

---

#### TASK 2G: Results Display & Output Generation (14 hours) — Backend Dev + Frontend Dev

**Hours:** 41-54  
**Branches:**
- Backend: `feat/output-generation`
- Frontend: `feat/results-ui`

**What to do:**

**Backend:**
1. Generate individual grade PDFs (scanned answer + reasoning side-by-side)
2. Generate master CSV spreadsheet
3. Create download endpoints

**Frontend:**
1. Display results table
2. Download buttons for PDFs + CSV

**Backend Code:**

```python
# backend/app/services/pdf_generator.py
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.colors import grey, black, HexColor
from io import BytesIO
import json

class PDFGenerator:
    def generate_grade_pdf(self, student_name: str, roll_no: str, evaluations: list, scanned_pages: list):
        """
        Generate individual grade PDF with:
        - Left pane: Scanned answer pages
        - Right pane: AI reasoning + marks
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Header
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=HexColor('#1a1a1a'),
            spaceAfter=12
        )
        
        elements.append(Paragraph(f"Grade Report - {roll_no}", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # For each question
        for i, evaluation in enumerate(evaluations):
            # Create 2-column table (answer image | reasoning)
            data = [
                [
                    "Student Answer",
                    "AI Evaluation"
                ],
                [
                    # TODO: Insert image of scanned answer
                    f"[Page {i+1}]",
                    f"""Question: {evaluation['question_id']}
Max Marks: {evaluation['max_marks']}
Awarded: {evaluation['marks_awarded']}/{evaluation['max_marks']}

Keywords Extracted:
{json.dumps(evaluation['extracted_keywords'], indent=2)}

Matched Keywords:
{json.dumps(evaluation['matched_keywords'], indent=2)}

Reasoning: {evaluation['ai_reasoning']}
                    """
                ]
            ]
            
            table = Table(data, colWidths=[3*inch, 3.5*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            elements.append(table)
            elements.append(Spacer(1, 0.3*inch))
            
            if (i + 1) % 2 == 0:
                elements.append(PageBreak())
        
        doc.build(elements)
        buffer.seek(0)
        return buffer

    def generate_csv_results(self, exam_id: int, results: list) -> str:
        """Generate CSV with all scores"""
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Roll No', 'Q1A', 'Q1B', 'Q2B', 'Q1C', 'Total Marks', 'Confidence', 'HITL Reviewed'])
        
        # Rows
        for result in results:
            writer.writerow([
                result['roll_no'],
                result.get('q1a_marks', 0),
                result.get('q1b_marks', 0),
                result.get('q2b_marks', 0),
                result.get('q1c_marks', 0),
                result.get('total_marks', 0),
                f"{result.get('confidence', 0):.2f}",
                "Yes" if result.get('hitl_reviewed') else "No"
            ])
        
        return output.getvalue()

# Usage
pdf_gen = PDFGenerator()
pdf_buffer = pdf_gen.generate_grade_pdf("Student Name", "A001", evaluations, scanned_pages)
csv_content = pdf_gen.generate_csv_results(exam_id, results)
```

**Backend Endpoints:**

```python
# backend/app/routes/outputs.py
from fastapi import APIRouter, Depends, FileResponse
from sqlalchemy.orm import Session
from app import models
from app.database import get_db
from app.services.pdf_generator import PDFGenerator
import os

router = APIRouter()
pdf_gen = PDFGenerator()

@router.get("/exam/{exam_id}/results")
def get_results(exam_id: int, db: Session = Depends(get_db)):
    """Get all results for exam"""
    results = db.query(models.FinalResults).filter(models.FinalResults.exam_id == exam_id).all()
    return [
        {
            "roll_no": r.roll_no,
            "total_marks": r.total_marks,
            "confidence": r.confidence_average,
            "num_hitl": r.num_hitl_reviews,
            "finalized_at": r.finalized_at.isoformat()
        }
        for r in results
    ]

@router.get("/exam/{exam_id}/download-csv")
def download_csv(exam_id: int, db: Session = Depends(get_db)):
    """Download master CSV"""
    results = db.query(models.FinalResults).filter(models.FinalResults.exam_id == exam_id).all()
    csv_content = pdf_gen.generate_csv_results(exam_id, results)
    
    return FileResponse(
        content=csv_content,
        media_type="text/csv",
        filename=f"exam_{exam_id}_results.csv"
    )

@router.get("/exam/{exam_id}/download-pdf/{roll_no}")
def download_student_pdf(exam_id: int, roll_no: str, db: Session = Depends(get_db)):
    """Download individual student grade PDF"""
    submission = db.query(models.StudentSubmission).filter(
        models.StudentSubmission.exam_id == exam_id,
        models.StudentSubmission.roll_no == roll_no
    ).first()
    
    if not submission:
        return {"error": "Submission not found"}
    
    evaluations = db.query(models.Evaluation).filter(
        models.Evaluation.submission_id == submission.id
    ).all()
    
    pdf_buffer = pdf_gen.generate_grade_pdf(
        student_name="",
        roll_no=roll_no,
        evaluations=[
            {
                "question_id": e.question_id,
                "marks_awarded": e.marks_awarded,
                "max_marks": 4,
                "extracted_keywords": e.extracted_keywords,
                "matched_keywords": e.matched_keywords,
                "ai_reasoning": e.ai_reasoning
            }
            for e in evaluations
        ],
        scanned_pages=[]
    )
    
    return FileResponse(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        filename=f"{roll_no}_grades.pdf"
    )
```

**Frontend Results Component:**

```jsx
// frontend/src/components/Output/ResultsViewer.jsx
import React, { useState, useEffect } from 'react';
import { apiEndpoints } from '../../api/client';
import './ResultsViewer.css';

export function ResultsViewer({ examId }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResults();
    }, [examId]);

    const loadResults = async () => {
        try {
            const response = await apiEndpoints.exam.getResults(examId);
            setResults(response.data);
        } catch (error) {
            console.error("Error loading results:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="results-viewer">
            <h2>Exam Results</h2>
            
            <table className="results-table">
                <thead>
                    <tr>
                        <th>Roll No</th>
                        <th>Total Marks</th>
                        <th>Confidence</th>
                        <th>HITL Reviews</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((result, idx) => (
                        <tr key={idx}>
                            <td>{result.roll_no}</td>
                            <td>{result.total_marks}</td>
                            <td>{(result.confidence * 100).toFixed(1)}%</td>
                            <td>{result.num_hitl}</td>
                            <td>
                                <a href={`/download-pdf/${result.roll_no}`}>📄 PDF</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="download-section">
                <button onClick={() => window.location.href = `/exam/${examId}/download-csv`}>
                    📊 Download All Results (CSV)
                </button>
            </div>
        </div>
    );
}
```

**Commit Messages:**
```
feat(output): implement PDF and CSV generation
feat(results): create results viewer with download options
```

---

### PHASE 3: Testing & Polish (Hours 49-72)

---

#### TASK 3A: Integration Testing (8 hours) — All Team

**Hours:** 49-56  
**Branch:** `feat/integration-testing`

**What to do:**
1. End-to-end test with 5 sample PDFs
2. Verify OCR → Keyword → Evaluation flow
3. Test HITL review workflow
4. Generate sample outputs

**Deliverable Checklist:**
- [ ] 5 sample exams graded successfully
- [ ] No API errors
- [ ] Outputs generated correctly

**Test Checklist (Manual):**

```markdown
## Integration Test Checklist

### 1. Exam Creation
- [ ] Create new exam via API
- [ ] Verify exam_id returned
- [ ] Check exam record in DB

### 2. Rubric Generation
- [ ] Upload question + answer PDFs
- [ ] Rubric bot generates suggestions
- [ ] Teacher can edit and save

### 3. Student Upload
- [ ] Upload 5 sample student PDFs
- [ ] Each with unique roll_no
- [ ] Verify files saved in storage

### 4. OCR Processing
- [ ] Start batch processing
- [ ] Monitor background task
- [ ] Verify OCR results in DB
- [ ] Check OCR confidence scores

### 5. Keyword Extraction
- [ ] Verify keywords extracted for each question
- [ ] Check keyword matching against rubric
- [ ] Verify marks awarded

### 6. Confidence Scoring
- [ ] Verify confidence >= 0.7 → Auto-pass
- [ ] Verify confidence < 0.7 → HITL flag

### 7. HITL Review
- [ ] Load HITL queue
- [ ] Review one item (Approve/Modify)
- [ ] Verify DB updated with final marks

### 8. Output Generation
- [ ] Generate individual PDF for one student
- [ ] Verify PDF contains answer + reasoning
- [ ] Generate master CSV
- [ ] Verify CSV has all scores

### 9. Edge Cases
- [ ] Illegible handwriting → Low confidence → HITL
- [ ] Missing keywords → Confidence < 0.7
- [ ] Diagram answer → VLM extraction working
```

---

#### TASK 3B: Bug Fixes & Optimization (8 hours) — All Team

**Hours:** 57-64  
**Branch:** `feat/bug-fixes`

**What to do:**
1. Fix any bugs found during testing
2. Optimize API response times
3. Reduce token usage (LLM costs)
4. Handle edge cases

**Commit Messages:**
```
fix(ocr): handle PDF with mixed orientations
fix(evaluation): handle empty keyword extraction
perf(llm): optimize prompts to reduce token count
```

---

#### TASK 3C: Final Batch Run (4 hours) — All Team

**Hours:** 65-68  
**What to do:**
1. Process all 50 student PDFs in production batch
2. Monitor for errors
3. Complete HITL reviews (teacher reviews ~10 flagged items)
4. Generate final outputs

**Milestone Checklist:**
- [ ] All 50 PDFs processed
- [ ] Confidence scores calculated
- [ ] HITL reviews completed
- [ ] Final grades assigned
- [ ] Individual PDFs generated
- [ ] Master spreadsheet ready

---

#### TASK 3D: Documentation & GitHub Push (4 hours) — All Team

**Hours:** 69-72  
**Branch:** `main`

**What to do:**
1. Write comprehensive README.md
2. Document API endpoints
3. Add setup instructions
4. Clean up code comments
5. Push to GitHub
6. Deploy to Vercel (optional)

**README Template:**

```markdown
# AI-Powered Exam Grading System

**72-Hour Hackathon Project**  
**Team:** 3 Students

## What Does This System Do?

Automates subjective exam grading using:
- OCR (PaddleOCR) to extract handwritten text
- LLM (Gemini) to extract key concepts
- Keyword matching to award marks (ignores grammar/spelling)
- HITL dashboard for manual review of low-confidence answers
- PDF + CSV output for teachers and students

## Demo Results

- 50 student exam papers graded automatically
- ~40 high-confidence (auto-passed)
- ~10 low-confidence (HITL reviewed by teacher)
- Individual grade PDFs + master spreadsheet generated

## How to Run

### Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in GEMINI_API_KEY, DATABASE_URL

# Frontend
cd frontend
npm install
cp .env.example .env

### Run
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open http://localhost:3000

## Architecture

```
Student PDFs → OCR → Keyword Extraction (LLM) → Confidence Scoring → 
  Auto-Pass (>=0.7) OR Flag for HITL (<0.7) → Final Grades → Output
```

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** FastAPI, PostgreSQL
- **OCR:** PaddleOCR
- **LLM:** Gemini 2.0 Flash (keyword extraction)
- **Deployment:** Vercel (post-hackathon)

## Key Features

✅ Keyword-based grading (ignores handwriting quality)  
✅ LLM-assisted rubric generation  
✅ VLM for diagram extraction  
✅ HITL dashboard for manual review  
✅ Individual + master output  
✅ Zero budget (uses free APIs)

## Limitations (MVP)

- No privacy masking (TSID)
- No cheating detection
- Simple confidence threshold (not composite score)
- Local storage only (no cloud backup)

## Future Enhancements

- [ ] Multi-course management
- [ ] Student appeal workflow
- [ ] Cheating detection (cosine similarity)
- [ ] Automated rubric generation (smarter LLM parsing)
- [ ] Mobile app

## Credits

Built in 72 hours by [Team Names]

## License

MIT
```

**API Documentation Template:**

```markdown
# API Reference

## Exam Management

### POST /exam/create
Create new exam

**Request:**
```json
{
  "exam_name": "Physics Midterm",
  "subject": "Physics",
  "exam_structure": [...]
}
```

**Response:**
```json
{
  "exam_id": 1,
  "status": "created"
}
```

... (document other endpoints)
```

**Commit Message:**
```
docs: add README, API reference, and setup instructions
chore: prepare for submission
```

---

## Summary: 72-Hour Timeline

| Phase | Hours | Tasks | Status |
|-------|-------|-------|--------|
| **Setup** | 1-4 | Backend + Frontend init, DB setup | Foundation |
| **Core Dev** | 5-48 | OCR, LLM, APIs, UI, Dashboard | Working System |
| **Testing** | 49-64 | Integration, bug fixes, batch run | Validation |
| **Polish** | 65-72 | Docs, deployment, final push | Shipped |

---

## Git Commit Checklist (By Hour 72)

```bash
git log --oneline | head -20

# Should show roughly:
# - 5-6 frontend feature commits
# - 5-6 backend feature commits
# - 3-4 LLM/integration commits
# - 2-3 testing/fix commits
# - 1 docs commit
# - 1 final version tag (v1.0-hackathon)
```

---

**You're ready. Hand this to your team and ship it.** 🚀
