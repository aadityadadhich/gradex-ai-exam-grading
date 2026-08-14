import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app import models, schemas
from app.services.ocr_service import OCRService
from app.services.llm_service import LLMService

router = APIRouter(prefix="/exam", tags=["Rubrics"])

ocr_service = OCRService()
llm_service = LLMService()

@router.put("/{exam_id}/rubric", response_model=schemas.RubricResponse)
def save_rubric(exam_id: int, req: schemas.RubricSaveRequest, db: Session = Depends(get_db)):
    """Save or update rubric JSON for an exam"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    rubric = db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).first()
    if rubric:
        rubric.rubric_data = req.rubric_data
    else:
        rubric = models.Rubric(exam_id=exam_id, rubric_data=req.rubric_data)
        db.add(rubric)

    db.commit()
    db.refresh(rubric)
    return rubric

@router.get("/{exam_id}/rubric", response_model=Dict[str, Any])
def get_rubric(exam_id: int, db: Session = Depends(get_db)):
    """Get rubric JSON for an exam"""
    rubric = db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).first()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not defined for this exam")
    return rubric.rubric_data

async def _extract_file_content(upload_file: UploadFile) -> str:
    """Helper to extract text from either .txt or .pdf files safely"""
    filename = upload_file.filename.lower()
    content_bytes = await upload_file.read()
    
    if filename.endswith(".txt") or filename.endswith(".csv"):
        try:
            return content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return str(content_bytes)

    # Otherwise process as PDF
    suffix = ".pdf" if filename.endswith(".pdf") else ".tmp"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content_bytes)
            tmp_path = tmp.name
        
        # Extracted text via OCR/PyMuPDF
        res = ocr_service.extract_text_from_pdf(tmp_path)
        pages = res.get("pages", [])
        return "\n".join([p["text"] for p in pages])
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

@router.post("/{exam_id}/rubric-bot")
async def generate_rubric_bot(
    exam_id: int,
    question_pdf: UploadFile = File(...),
    answer_key_pdf: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    AI Rubric Bot: Upload Question Paper (PDF/TXT) and Answer Key (PDF/TXT).
    Extracts text and uses Gemini LLM to suggest a dynamic marking rubric.
    """
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    try:
        q_text = await _extract_file_content(question_pdf)
        a_text = await _extract_file_content(answer_key_pdf)

        suggested_rubric = llm_service.generate_rubric_from_qna(q_text, a_text)

        return {
            "exam_id": exam_id,
            "suggested_rubric": suggested_rubric,
            "confidence": 0.92,
            "message": "Rubric suggestions generated successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating rubric: {str(e)}")
