from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/exam", tags=["HITL Dashboard"])

@router.get("/{exam_id}/hitl-queue", response_model=schemas.HitlItemResponse)
def get_next_hitl_item(exam_id: int, include_all: bool = False, db: Session = Depends(get_db)):
    """
    Fetch next item requiring teacher review (either low AI confidence or Student Recheck Request).
    """
    # Priority 1: Student Recheck Requests
    eval_item = db.query(models.Evaluation).filter(
        models.Evaluation.exam_id == exam_id,
        models.Evaluation.recheck_requested == True,
        models.Evaluation.recheck_status == "PENDING"
    ).order_by(models.Evaluation.recheck_created_at.asc()).first()

    # Priority 2: AI Flagged low-confidence evaluations
    if not eval_item:
        query = db.query(models.Evaluation).outerjoin(
            models.HitlReview, models.Evaluation.id == models.HitlReview.evaluation_id
        ).filter(
            models.Evaluation.exam_id == exam_id,
            models.HitlReview.id == None
        )

        if not include_all:
            query = query.filter(models.Evaluation.requires_hitl == True)

        eval_item = query.order_by(models.Evaluation.confidence_score.asc()).first()

    # Priority 3: Fallback to any unreviewed item
    if not eval_item and not include_all:
        eval_item = db.query(models.Evaluation).outerjoin(
            models.HitlReview, models.Evaluation.id == models.HitlReview.evaluation_id
        ).filter(
            models.Evaluation.exam_id == exam_id,
            models.HitlReview.id == None
        ).order_by(models.Evaluation.confidence_score.asc()).first()

    if not eval_item:
        raise HTTPException(status_code=404, detail="No pending items in HITL review queue.")

    submission = db.query(models.StudentSubmission).filter(models.StudentSubmission.id == eval_item.submission_id).first()

    return schemas.HitlItemResponse(
        evaluation_id=eval_item.id,
        submission_id=eval_item.submission_id,
        roll_no=submission.roll_no if submission else "Unknown",
        question_id=eval_item.question_id,
        student_extracted_keywords=eval_item.extracted_keywords or [],
        matched_keywords=eval_item.matched_keywords or [],
        ai_reasoning=eval_item.ai_reasoning or "",
        suggested_marks=eval_item.marks_awarded,
        max_marks=eval_item.max_marks,
        confidence_score=eval_item.confidence_score,
        ocr_text_preview=eval_item.ocr_text_preview,
        diagram_text=eval_item.diagram_extracted_text,
        recheck_requested=bool(eval_item.recheck_requested),
        recheck_comment=eval_item.recheck_comment
    )

@router.get("/{exam_id}/hitl-queue/count")
def get_hitl_queue_count(exam_id: int, db: Session = Depends(get_db)):
    """Get total pending, student recheck, and reviewed metrics"""
    total_evals = db.query(models.Evaluation).filter(models.Evaluation.exam_id == exam_id).count()
    auto_passed = db.query(models.Evaluation).filter(
        models.Evaluation.exam_id == exam_id,
        models.Evaluation.requires_hitl == False
    ).count()

    recheck_count = db.query(models.Evaluation).filter(
        models.Evaluation.exam_id == exam_id,
        models.Evaluation.recheck_requested == True,
        models.Evaluation.recheck_status == "PENDING"
    ).count()

    hitl_flagged = db.query(models.Evaluation).filter(
        models.Evaluation.exam_id == exam_id,
        models.Evaluation.requires_hitl == True
    ).count()

    completed_reviews = db.query(models.HitlReview).join(
        models.Evaluation, models.HitlReview.evaluation_id == models.Evaluation.id
    ).filter(models.Evaluation.exam_id == exam_id).count()

    pending_reviews = max(hitl_flagged - completed_reviews, 0) + recheck_count

    return {
        "exam_id": exam_id,
        "total_evaluations": total_evals,
        "auto_passed": auto_passed,
        "hitl_flagged": hitl_flagged,
        "recheck_requests": recheck_count,
        "completed_reviews": completed_reviews,
        "pending_reviews": pending_reviews
    }

@router.put("/{exam_id}/hitl/{evaluation_id}")
def submit_hitl_review(
    exam_id: int,
    evaluation_id: int,
    req: schemas.HitlReviewRequest,
    db: Session = Depends(get_db)
):
    """Submit teacher override / approval decision for a flagged question or recheck request"""
    eval_item = db.query(models.Evaluation).filter(
        models.Evaluation.id == evaluation_id,
        models.Evaluation.exam_id == exam_id
    ).first()

    if not eval_item:
        raise HTTPException(status_code=404, detail="Evaluation item not found")

    # Upsert HitlReview
    existing_review = db.query(models.HitlReview).filter(models.HitlReview.evaluation_id == evaluation_id).first()
    if existing_review:
        existing_review.action = req.action
        existing_review.final_marks = req.final_marks
        existing_review.teacher_feedback = req.teacher_feedback
        existing_review.reviewed_at = models.datetime.utcnow()
    else:
        review = models.HitlReview(
            evaluation_id=evaluation_id,
            action=req.action,
            final_marks=req.final_marks,
            teacher_feedback=req.teacher_feedback
        )
        db.add(review)

    # Update Evaluation table & resolve recheck
    eval_item.marks_awarded = req.final_marks
    if req.teacher_feedback:
        eval_item.ai_reasoning = f"{eval_item.ai_reasoning or ''} | Teacher Feedback: {req.teacher_feedback}"
    eval_item.finalized = True
    eval_item.requires_hitl = False
    eval_item.recheck_requested = False
    eval_item.recheck_status = "RESOLVED"

    # Re-calculate FinalResult total marks for student
    submission_id = eval_item.submission_id
    all_student_evals = db.query(models.Evaluation).filter(models.Evaluation.submission_id == submission_id).all()
    new_total_marks = sum(e.marks_awarded for e in all_student_evals)

    result_record = db.query(models.FinalResult).filter(models.FinalResult.submission_id == submission_id).first()
    if result_record:
        result_record.total_marks = new_total_marks
        result_record.num_hitl_reviews = db.query(models.HitlReview).join(
            models.Evaluation, models.HitlReview.evaluation_id == models.Evaluation.id
        ).filter(models.Evaluation.submission_id == submission_id).count()

    db.commit()

    return {
        "status": "success",
        "evaluation_id": evaluation_id,
        "action": req.action,
        "final_marks": req.final_marks,
        "message": "Review submitted and recheck resolved successfully."
    }
