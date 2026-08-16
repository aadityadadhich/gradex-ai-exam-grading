import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import exams, rubrics, uploads, hitl, outputs

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("exam_grading")

# Create database tables automatically if they don't exist
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")
except Exception as e:
    logger.error(f"Database initialization warning: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="AI-Powered Subjective Exam Evaluation System API (FastAPI + Gemini + PaddleOCR)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend (localhost:3000 / localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(exams.router)
app.include_router(rubrics.router)
app.include_router(uploads.router)
app.include_router(hitl.router)
app.include_router(outputs.router)

@app.get("/", tags=["Root"])
def root():
    """Root welcome endpoint"""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API v{settings.PROJECT_VERSION}",
        "documentation": "/docs",
        "health_check": "/health",
        "endpoints": {
            "create_exam": "POST /exam/create",
            "list_exams": "GET /exam/list",
            "rubric_bot": "POST /exam/{id}/rubric-bot",
            "submit_pdf": "POST /exam/{id}/submit-pdf",
            "process_batch": "POST /exam/{id}/process",
            "hitl_queue": "GET /exam/{id}/hitl-queue",
            "results": "GET /exam/{id}/results"
        }
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "database": settings.DATABASE_URL.split("://")[0]
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
