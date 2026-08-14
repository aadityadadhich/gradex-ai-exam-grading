import os
import shutil
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.config import settings
from app.services.ocr_service import OCRService

router = APIRouter(prefix="/exam", tags=["Uploads"])

ocr_service = OCRService()

@router.post("/{exam_id}/submit-pdf", response_model=schemas.SubmissionResponse)
async def submit_student_pdf(
    exam_id: int,
    roll_no: str = Form(...),
    pdf_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload student handwritten exam PDF"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    clean_roll = roll_no.strip().upper()
    filename = f"exam_{exam_id}_{clean_roll}.pdf"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(pdf_file.file, buffer)

    # Check if submission exists
    existing = db.query(models.StudentSubmission).filter(
        models.StudentSubmission.exam_id == exam_id,
        models.StudentSubmission.roll_no == clean_roll
    ).first()

    if existing:
        existing.pdf_path = filepath
        existing.upload_timestamp = models.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        submission = models.StudentSubmission(
            exam_id=exam_id,
            roll_no=clean_roll,
            pdf_path=filepath
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission

@router.get("/{exam_id}/submissions", response_model=List[schemas.SubmissionResponse])
def list_submissions(exam_id: int, db: Session = Depends(get_db)):
    """List all student submissions for an exam"""
    return db.query(models.StudentSubmission).filter(models.StudentSubmission.exam_id == exam_id).all()

@router.post("/{exam_id}/extract-ocr")
async def extract_ocr_preview(exam_id: int, file: UploadFile = File(...)):
    """Test OCR extraction on an uploaded PDF"""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        res = ocr_service.extract_text_from_pdf(tmp_path)
        return res
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
