import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif "postgresql" in db_url:
    connect_args = {"connect_timeout": 3}

if "[YOUR-PASSWORD]" in db_url:
    logger.warning("DATABASE_URL contains placeholder '[YOUR-PASSWORD]'. Using local SQLite database.")
    db_url = "sqlite:///./exam_grading.db"
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    # Test connection immediately
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Could not connect to configured DATABASE_URL ({e}). Falling back to local SQLite database: sqlite:///./exam_grading.db")
    engine = create_engine(
        "sqlite:///./exam_grading.db",
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = sqlalchemy.orm.declarative_base()



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
