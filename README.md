# 🎓 Gradex AI — AI-Powered Subjective Exam Grading Platform

> **Gradex AI** is an intelligent, full-stack subjective exam evaluation system designed to automate handwritten and typed paper grading, keyword concept matching, MCQ verification, human-in-the-loop (HITL) teacher reviews, and grade report generation.

---

## ✨ Features & Highlights

- 🎨 **Neubrutalism UI**: Modern, high-contrast user interface with sharp solid borders, offset shadows, vibrant pastel accents, and responsive layout.
- 📄 **PyMuPDF & Layout Analysis**: Multi-page PDF text extraction and image layout analysis for scanned/handwritten student answer copies.
- 🤖 **Multi-Provider AI (Gemini 2.5 Flash + Mistral API)**: Quota-resilient AI concept extraction with multi-model and multi-provider fallback chains.
- 📊 **Structured Q&A & Rubric Bot**: Parses uploaded Question Papers (`.pdf`/`.txt`) and Answer Keys (`.pdf`/`.txt`/`.csv`) into marking rubrics (supporting both 1-mark MCQs and 2-mark+ Short Answer questions).
- ⏳ **Real-Time Progress Bar**: Live progress tracking during batch grading with paper counts, student roll numbers, and percentage completion.
- 🧑‍🏫 **Human-in-the-Loop (HITL) Dashboard**: Split-screen teacher review interface allowing score overrides, feedback entry, and approval for low-confidence evaluations ($S_c < 70\%$).
- 📄 **ReportLab PDF & Master CSV Export**: Downloads individual student grade reports (with breakdown and feedback) and master class scoresheets.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS (Neubrutalism System), Lucide Icons, Axios |
| **Backend** | FastAPI, Python 3.13, Uvicorn, SQLAlchemy, Pydantic |
| **AI / LLM** | Gemini 2.5 Flash, Mistral API (`mistral-small-latest`), OpenCV, PyMuPDF, PaddleOCR |
| **Database** | PostgreSQL (Supabase) with automatic local SQLite fallback |
| **Reporting** | ReportLab PDF Engine, Python CSV Exporter |

---

## 🏁 Prerequisites

Ensure you have the following installed on your system:
- **Python 3.10+** (Python 3.13 recommended)
- **Node.js 18+** & `npm`
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com)) and/or **Mistral API Key** (from [Mistral AI Platform](https://console.mistral.ai))

---

## ⚙️ Installation & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/aadityadadhich/gradex-ai-exam-grading.git
cd gradex-ai-exam-grading
```

---

### 2. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   python -m pip install -r requirements.txt
   python -m pip install PyMuPDF
   ```

4. Configure your Environment Variables:
   Create a `.env` file in the `backend/` folder (or copy `.env.example`):
   ```ini
   DATABASE_URL=sqlite:///./exam_grading.db
   # Or Supabase PostgreSQL:
   # DATABASE_URL=postgresql://postgres:PASSWORD@db.INSTANCE.supabase.co:5432/postgres

   GEMINI_API_KEY=your_gemini_api_key_here
   MISTRAL_API_KEY=your_mistral_api_key_here

   UPLOAD_DIR=./uploads
   OUTPUT_DIR=./outputs
   DEBUG=True
   ```

5. Launch the Backend Server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *The API will start at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

---

### 3. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Development Server:
   ```bash
   npm run dev
   ```
   *The web application will open at `http://localhost:3000`.*

---

## 🚀 Step-by-Step User Workflow

1. **Step 1: Exam Setup**  
   - Enter Exam Title and Subject. Define question parts (Set `0` questions for parts not needed, or click **Add Exam Part**). Click **Create Exam & Continue**.

2. **Step 2: Rubric Bot**  
   - Upload Question Paper (`.pdf` or `.txt`) and Answer Key (`.pdf`, `.txt`, or `.csv`). Click **Generate Rubric with AI**. Review/edit the generated questions, keywords, and marks, then click **Save Rubric**.

3. **Step 3: Upload Student PDFs**  
   - Enter student Roll Number (e.g. `Student_1`) and select their handwritten answer PDF. Click **Upload Student PDF** for each copy.

4. **Step 4: AI Pipeline Execution**  
   - Click **Start AI Batch Grading**. Watch the real-time progress bar track paper counts, roll numbers, and progress percentages.

5. **Step 5: HITL Teacher Review**  
   - Inspect flagged questions ($S_c < 70\%$). View extracted OCR text against AI reasoning, adjust marks if necessary, and click **Approve** or **Override**.

6. **Step 6: Scoresheet & Exports**  
   - View class averages and scoresheet table. Click **Export CSV** for master marks or **Grade Report** for individual PDF score sheets.

---

## 📁 Repository Structure

```
gradex-ai-exam-grading/
├── backend/
│   ├── app/
│   │   ├── config.py           # Application settings & environment loader
│   │   ├── database.py         # SQLAlchemy engine with SQLite fallback
│   │   ├── main.py             # FastAPI entrypoint with CORS & root route
│   │   ├── models.py           # ORM Database schemas (Exams, Rubrics, etc.)
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── routes/             # API Router endpoints
│   │   └── services/           # OCR, LLM (Gemini/Mistral), Evaluator, PDF Generator
│   ├── requirements.txt        # Python dependency manifest
│   └── .env.example            # Environment template file
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Axios API client adapter
│   │   ├── components/         # Neubrutalism React components
│   │   ├── App.jsx             # Main interactive application container
│   │   ├── index.css           # Neubrutalism design system CSS
│   │   └── main.jsx            # Vite entrypoint
│   ├── package.json            # Node.js dependency manifest
│   └── vite.config.js          # Vite dev server configuration
├── test data/                  # Sample Question Paper, Answer Key, and Student PDFs
├── .gitignore                  # Git secrets & build exclusion rules
└── README.md                   # Project documentation & setup guide
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
