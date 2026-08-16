import os
import shutil
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app import models, schemas

router = APIRouter(prefix="/exam", tags=["Student Submissions Upload"])

def _extract_roll_no_from_filename(filename: str) -> str:
    """Extract roll number from filename like Student_1.pdf -> Student_1 or Roll_12 -> Roll_12"""
    base_name = os.path.splitext(filename)[0]
    match = re.search(r'(Student[_\-\s]?\d+|Roll[_\-\s]?\d+|[A-Za-z]+\d+|\d+)', base_name, re.IGNORECASE)
    if match:
        return match.group(0).replace(" ", "_")
    return base_name

@router.post("/{id}/submit-pdf", response_model=schemas.SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_student_pdf(
    id: int,
    roll_no: str = Form(...),
    pdf_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a single student PDF answer script"""
    exam = db.query(models.Exam).filter(models.Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    roll_clean = roll_no.strip()
    existing_sub = db.query(models.StudentSubmission).filter(
        models.StudentSubmission.exam_id == id,
        models.StudentSubmission.roll_no == roll_clean
    ).first()

    exam_dir = os.path.join(settings.UPLOAD_DIR, f"exam_{id}")
    os.makedirs(exam_dir, exist_ok=True)

    dest_filename = f"{roll_clean}_{pdf_file.filename}"
    dest_path = os.path.join(exam_dir, dest_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(pdf_file.file, buffer)

    if existing_sub:
        existing_sub.pdf_path = dest_path
        db.commit()
        db.refresh(existing_sub)
        return existing_sub

    submission = models.StudentSubmission(
        exam_id=id,
        roll_no=roll_clean,
        pdf_path=dest_path
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.post("/{id}/bulk-submit-pdfs", response_model=schemas.BulkUploadResponse, status_code=status.HTTP_201_CREATED)
def bulk_submit_student_pdfs(
    id: int,
    pdf_files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Bulk upload multiple student answer PDFs, extracting Roll Numbers from filenames"""
    exam = db.query(models.Exam).filter(models.Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam_dir = os.path.join(settings.UPLOAD_DIR, f"exam_{id}")
    os.makedirs(exam_dir, exist_ok=True)

    created_submissions = []

    for file_item in pdf_files:
        roll_clean = _extract_roll_no_from_filename(file_item.filename)
        dest_filename = f"{roll_clean}_{file_item.filename}"
        dest_path = os.path.join(exam_dir, dest_filename)

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file_item.file, buffer)

        existing_sub = db.query(models.StudentSubmission).filter(
            models.StudentSubmission.exam_id == id,
            models.StudentSubmission.roll_no == roll_clean
        ).first()

        if existing_sub:
            existing_sub.pdf_path = dest_path
            db.commit()
            db.refresh(existing_sub)
            created_submissions.append(existing_sub)
        else:
            submission = models.StudentSubmission(
                exam_id=id,
                roll_no=roll_clean,
                pdf_path=dest_path
            )
            db.add(submission)
            db.commit()
            db.refresh(submission)
            created_submissions.append(submission)

    return schemas.BulkUploadResponse(
        uploaded_count=len(created_submissions),
        submissions=created_submissions
    )

@router.get("/{id}/submissions", response_model=List[schemas.SubmissionResponse])
def get_exam_submissions(id: int, db: Session = Depends(get_db)):
    """List all student submissions for an exam"""
    return db.query(models.StudentSubmission).filter(
        models.StudentSubmission.exam_id == id
    ).order_by(models.StudentSubmission.id.asc()).all()
