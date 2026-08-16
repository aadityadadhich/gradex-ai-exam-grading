from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/student", tags=["Student Portal"])

@router.get("/{roll_no}/exams")
def get_student_exams(roll_no: str, db: Session = Depends(get_db)):
    """List all exams where this student has submissions and results"""
    roll_clean = roll_no.strip()
    submissions = db.query(models.StudentSubmission).filter(
        models.StudentSubmission.roll_no.ilike(roll_clean)
    ).all()

    exam_list = []
    seen_exam_ids = set()
    for sub in submissions:
        if sub.exam_id in seen_exam_ids:
            continue
        seen_exam_ids.add(sub.exam_id)
        exam = db.query(models.Exam).filter(models.Exam.id == sub.exam_id).first()
        if not exam:
            continue
        
        result = db.query(models.FinalResult).filter(
            models.FinalResult.exam_id == sub.exam_id,
            models.FinalResult.roll_no.ilike(roll_clean)
        ).first()

        exam_list.append({
            "exam_id": exam.id,
            "exam_name": exam.exam_name,
            "subject": exam.subject,
            "total_marks": exam.total_marks,
            "scored_marks": result.total_marks if result else None,
            "status": "EVALUATED" if result else "SUBMITTED",
            "submission_id": sub.id
        })

    return exam_list

@router.get("/{roll_no}/exam/{exam_id}/report", response_model=schemas.StudentExamReportResponse)
def get_student_exam_report(roll_no: str, exam_id: int, db: Session = Depends(get_db)):
    """Get student's detailed evaluation breakdown, question scores, OCR text, and AI evaluation logic"""
    roll_clean = roll_no.strip()
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    submission = db.query(models.StudentSubmission).filter(
        models.StudentSubmission.exam_id == exam_id,
        models.StudentSubmission.roll_no.ilike(roll_clean)
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="No submission found for this student")

    evaluations = db.query(models.Evaluation).filter(
        models.Evaluation.submission_id == submission.id
    ).order_by(models.Evaluation.id.asc()).all()

    result = db.query(models.FinalResult).filter(
        models.FinalResult.exam_id == exam_id,
        models.FinalResult.roll_no.ilike(roll_clean)
    ).first()

    total_marks = result.total_marks if result else sum(e.marks_awarded for e in evaluations)

    question_details = []
    for ev in evaluations:
        hitl = ev.hitl_review
        question_details.append(schemas.StudentQuestionDetail(
            evaluation_id=ev.id,
            question_id=ev.question_id,
            max_marks=ev.max_marks,
            marks_awarded=ev.marks_awarded,
            ocr_text_preview=ev.ocr_text_preview,
            ai_reasoning=ev.ai_reasoning,
            teacher_feedback=hitl.teacher_feedback if hitl else None,
            recheck_requested=bool(ev.recheck_requested),
            recheck_comment=ev.recheck_comment,
            recheck_status=ev.recheck_status
        ))

    return schemas.StudentExamReportResponse(
        exam_id=exam.id,
        exam_name=exam.exam_name,
        subject=exam.subject,
        roll_no=roll_clean,
        total_marks=total_marks,
        max_total_marks=float(exam.total_marks),
        pdf_download_url=f"/exam/{exam_id}/download-pdf/{roll_clean}",
        questions=question_details
    )

@router.post("/{roll_no}/exam/{exam_id}/recheck")
def request_question_recheck(
    roll_no: str,
    exam_id: int,
    req: schemas.RecheckSubmitRequest,
    db: Session = Depends(get_db)
):
    """Student submits a recheck request for a specific question with comments for teacher HITL review"""
    eval_item = db.query(models.Evaluation).filter(
        models.Evaluation.id == req.evaluation_id,
        models.Evaluation.exam_id == exam_id
    ).first()

    if not eval_item:
        raise HTTPException(status_code=404, detail="Evaluation item not found")

    eval_item.recheck_requested = True
    eval_item.recheck_comment = req.comment.strip()
    eval_item.recheck_status = "PENDING"
    eval_item.recheck_created_at = datetime.utcnow()
    eval_item.requires_hitl = True  # Send back to Teacher's HITL Review Queue!

    db.commit()

    return {
        "status": "success",
        "message": f"Recheck request submitted for Question {eval_item.question_id}. A teacher will review your request in HITL.",
        "evaluation_id": eval_item.id
    }
