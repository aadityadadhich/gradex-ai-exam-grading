import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "AI Exam Grading System"
    PROJECT_VERSION: str = "1.0.0"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./exam_grading.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", "./outputs")
    
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))


settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
