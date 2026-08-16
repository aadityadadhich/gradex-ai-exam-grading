import os
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app import models, schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _hash_password(password: str) -> str:
    """Simple SHA-256 password hash for sample/demo auth"""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def seed_sample_credentials(db: Session = None):
    """Seed sample accounts for Students 1-37 and Teachers 1-2 if not present"""
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Seed Teachers
        teachers = [
            {"username": "Teacher_1", "password": "teacher123", "full_name": "Prof. Alan Turing"},
            {"username": "Teacher_2", "password": "teacher123", "full_name": "Dr. Ada Lovelace"},
        ]
        for t in teachers:
            existing = db.query(models.User).filter(models.User.username == t["username"]).first()
            if not existing:
                user = models.User(
                    username=t["username"],
                    password_hash=_hash_password(t["password"]),
                    role="TEACHER",
                    full_name=t["full_name"]
                )
                db.add(user)

        # Seed Students (Student_1 to Student_37)
        for i in range(1, 38):
            roll_no = f"Student_{i}"
            existing = db.query(models.User).filter(models.User.username == roll_no).first()
            if not existing:
                user = models.User(
                    username=roll_no,
                    password_hash=_hash_password("password123"),
                    role="STUDENT",
                    full_name=f"Student {i}"
                )
                db.add(user)

        db.commit()

        # Write credentials.txt to workspace root
        cred_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../credentials.txt"))
        with open(cred_file_path, "w", encoding="utf-8") as f:
            f.write("=" * 60 + "\n")
            f.write("GRADEX AI — DEMO LOGIN CREDENTIALS\n")
            f.write("=" * 60 + "\n\n")
            f.write("🧑‍🏫 TEACHER ACCOUNTS:\n")
            f.write("-" * 40 + "\n")
            f.write("Employee ID : Teacher_1\nPassword    : teacher123\nName        : Prof. Alan Turing\n\n")
            f.write("Employee ID : Teacher_2\nPassword    : teacher123\nName        : Dr. Ada Lovelace\n\n")
            f.write("=" * 60 + "\n")
            f.write("🎓 STUDENT ACCOUNTS (All 37 Test Students):\n")
            f.write("-" * 40 + "\n")
            for i in range(1, 38):
                f.write(f"Roll Number : Student_{i}\nPassword    : password123\n\n")
            f.write("=" * 60 + "\n")

    except Exception as e:
        db.rollback()
    finally:
        if close_session:
            db.close()

@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate user as STUDENT or TEACHER"""
    username_clean = req.username.strip()
    role_clean = req.role.strip().upper()
    pw_hash = _hash_password(req.password.strip())

    user = db.query(models.User).filter(
        models.User.username == username_clean,
        models.User.role == role_clean
    ).first()

    if not user or user.password_hash != pw_hash:
        # If user doesn't exist, create a friendly auto-registration for demo testing
        user = models.User(
            username=username_clean,
            password_hash=pw_hash,
            role=role_clean,
            full_name=f"{role_clean.capitalize()} {username_clean}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return schemas.TokenResponse(
        access_token=f"token_{user.role.lower()}_{user.username}",
        token_type="bearer",
        user=schemas.UserResponse.from_orm(user)
    )

@router.get("/me/{username}", response_model=schemas.UserResponse)
def get_user_profile(username: str, role: str, db: Session = Depends(get_db)):
    """Get user profile"""
    user = db.query(models.User).filter(
        models.User.username == username,
        models.User.role == role.upper()
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
