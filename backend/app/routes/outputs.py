from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.services.pdf_generator import PDFGenerator

router = APIRouter(prefix="/exam", tags=["Outputs & Reports"])

pdf_generator = PDFGenerator()

@router.get("/{exam_id}/results", response_model=List[schemas.FinalResultResponse])
def get_results(exam_id: int, db: Session = Depends(get_db)):
    """Get overall results table for all student submissions"""
    results = db.query(models.FinalResult).filter(models.FinalResult.exam_id == exam_id).order_by(models.FinalResult.roll_no.asc()).all()
    return results

@router.get("/{exam_id}/download-csv")
def download_csv_report(exam_id: int, db: Session = Depends(get_db)):
    """Download master CSV scoresheet for all students"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    results = db.query(models.FinalResult).filter(models.FinalResult.exam_id == exam_id).order_by(models.FinalResult.roll_no.asc()).all()
    results_data = [
        {
            "roll_no": r.roll_no,
            "total_marks": r.total_marks,
            "confidence_average": r.confidence_average,
            "num_auto_passed": r.num_auto_passed,
            "num_hitl_reviews": r.num_hitl_reviews,
            "finalized_at": r.finalized_at.isoformat() if r.finalized_at else ""
        }
        for r in results
    ]

    csv_string = pdf_generator.generate_csv_results(exam.exam_name, results_data)
    filename = f"{exam.exam_name.replace(' ', '_')}_master_results.csv"

    return Response(
        content=csv_string,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{exam_id}/download-pdf/{roll_no}")
def download_student_pdf(exam_id: int, roll_no: str, db: Session = Depends(get_db)):
    """Download individual detailed grade PDF transcript for a student"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    clean_roll = roll_no.strip()
    sub = db.query(models.StudentSubmission).filter(
        models.StudentSubmission.exam_id == exam_id,
        models.StudentSubmission.roll_no.ilike(clean_roll)
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail=f"Submission for Roll No '{clean_roll}' not found.")

    evaluations = db.query(models.Evaluation).filter(models.Evaluation.submission_id == sub.id).order_by(models.Evaluation.id.asc()).all()
    eval_list = [
        {
            "question_id": str(e.question_id),
            "marks_awarded": float(e.marks_awarded or 0.0),
            "max_marks": float(e.max_marks or 1.0),
            "ai_reasoning": e.ai_reasoning or "Evaluated against marking rubric criteria.",
            "ocr_text_preview": e.ocr_text_preview or "N/A",
            "finalized": bool(e.finalized),
            "hitl_review": e.hitl_review
        }
        for e in evaluations
    ]

    result = db.query(models.FinalResult).filter(models.FinalResult.submission_id == sub.id).first()
    total_marks = float(result.total_marks) if result else sum(float(e.marks_awarded or 0.0) for e in evaluations)

    pdf_buffer = pdf_generator.generate_grade_pdf(
        exam_name=exam.exam_name,
        subject=exam.subject,
        roll_no=sub.roll_no,
        total_marks=total_marks,
        max_total_marks=float(exam.total_marks or 50.0),
        evaluations=eval_list
    )

    filename = f"{sub.roll_no}_grade_report.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
