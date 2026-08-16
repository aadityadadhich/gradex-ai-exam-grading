import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.config import settings
from app import models, schemas
from app.services.ocr_service import OCRService
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/exam", tags=["Exams"])

ocr_service = OCRService()
eval_service = EvaluationService()

# Global in-memory progress tracker for live batch processing updates
BATCH_PROGRESS: Dict[int, Dict[str, Any]] = {}

@router.post("/create", response_model=schemas.ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(req: schemas.ExamCreateRequest, db: Session = Depends(get_db)):
    """Create a new exam structure"""
    total_marks = 0
    for part in req.exam_structure:
        num_q = int(part.get("num_questions", 0))
        marks_q = int(part.get("marks_per_question", 0))
        total_marks += num_q * marks_q

    if total_marks == 0:
        total_marks = 50  # Default fallback if structure empty

    exam = models.Exam(
        exam_name=req.exam_name,
        subject=req.subject,
        total_marks=total_marks,
        exam_structure=req.exam_structure
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam

@router.get("/list", response_model=List[schemas.ExamResponse])
def list_exams(db: Session = Depends(get_db)):
    """List all created exams"""
    return db.query(models.Exam).order_by(models.Exam.id.desc()).all()

@router.get("/{exam_id}", response_model=schemas.ExamResponse)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    """Get exam details by ID"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.delete("/{exam_id}", status_code=status.HTTP_200_OK)
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    """Delete an exam and all related submissions, rubrics, evaluations, and outputs"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Clean up uploaded folder if exists
    exam_dir = os.path.join(settings.UPLOAD_DIR, f"exam_{exam_id}")
    if os.path.exists(exam_dir):
        try:
            shutil.rmtree(exam_dir)
        except Exception:
            pass

    db.delete(exam)
    db.commit()

    if exam_id in BATCH_PROGRESS:
        del BATCH_PROGRESS[exam_id]

    return {"status": "success", "message": f"Exam {exam_id} deleted successfully"}

@router.get("/{exam_id}/progress")
def get_exam_progress(exam_id: int, db: Session = Depends(get_db)):
    """Get real-time batch evaluation progress (percentage, current paper, count)"""
    total_submissions = db.query(models.StudentSubmission).filter(models.StudentSubmission.exam_id == exam_id).count()
    
    if exam_id in BATCH_PROGRESS:
        prog = BATCH_PROGRESS[exam_id]
        prog["total_submissions"] = total_submissions
        return prog

    # Fallback status if background task not in memory
    results_count = db.query(models.FinalResult).filter(models.FinalResult.exam_id == exam_id).count()
    percent = (results_count / total_submissions * 100.0) if total_submissions > 0 else 0.0

    return {
        "exam_id": exam_id,
        "total_submissions": total_submissions,
        "processed_submissions": results_count,
        "current_roll_no": "Completed" if results_count >= total_submissions and total_submissions > 0 else "Idle",
        "percent_complete": round(percent, 1),
        "status": "completed" if results_count >= total_submissions and total_submissions > 0 else "idle"
    }

@router.post("/{exam_id}/process")
def process_exam(exam_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger automated batch evaluation for all uploaded student PDFs"""
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    rubric_obj = db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).first()
    if not rubric_obj or not rubric_obj.rubric_data:
        raise HTTPException(status_code=400, detail="Rubric not defined for this exam. Please build/save a rubric first.")

    submissions = db.query(models.StudentSubmission).filter(models.StudentSubmission.exam_id == exam_id).all()
    if not submissions:
        raise HTTPException(status_code=400, detail="No student submissions uploaded yet.")

    # Initialize batch progress record
    BATCH_PROGRESS[exam_id] = {
        "exam_id": exam_id,
        "total_submissions": len(submissions),
        "processed_submissions": 0,
        "current_roll_no": submissions[0].roll_no if submissions else "Starting...",
        "percent_complete": 0.0,
        "status": "processing"
    }

    background_tasks.add_task(_process_batch_background, exam_id)
    return {
        "status": "processing_started",
        "exam_id": exam_id,
        "num_submissions": len(submissions),
        "message": f"Processing started for {len(submissions)} student submissions."
    }

def _process_batch_background(exam_id: int):
    """Background processing task with isolated DB session and real-time progress updates"""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        submissions = db.query(models.StudentSubmission).filter(models.StudentSubmission.exam_id == exam_id).all()
        rubric_obj = db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).first()
        rubric_data = rubric_obj.rubric_data if rubric_obj else {}
        questions_rubric = rubric_data.get("questions", [])
        total_subs = len(submissions)

        for sub_idx, sub in enumerate(submissions):
            # Update live progress tracker
            pct = round((sub_idx / total_subs) * 100.0, 1)
            BATCH_PROGRESS[exam_id] = {
                "exam_id": exam_id,
                "total_submissions": total_subs,
                "processed_submissions": sub_idx,
                "current_roll_no": sub.roll_no,
                "percent_complete": pct,
                "status": "processing"
            }

            # 1. OCR Extraction
            ocr_res = ocr_service.extract_text_from_pdf(sub.pdf_path)
            pages = ocr_res.get("pages", [])
            full_ocr_text = "\n".join([p["text"] for p in pages])

            # Clear previous evaluations for re-run
            db.query(models.Evaluation).filter(models.Evaluation.submission_id == sub.id).delete()

            total_sub_marks = 0.0
            total_conf = 0.0
            num_evals = 0
            num_hitl = 0
            num_auto = 0

            # 2. Evaluate each question in rubric
            for q_idx, q_rubric in enumerate(questions_rubric):
                q_id = q_rubric.get("q_id", f"Q{q_idx+1}")
                ocr_clarity = pages[min(q_idx, len(pages)-1)].get("confidence", 0.85) if pages else 0.85
                page_text = pages[min(q_idx, len(pages)-1)]["text"] if pages else full_ocr_text

                # Evaluate using simplified semantic evaluator
                eval_res = eval_service.evaluate_question(
                    student_ocr_text=full_ocr_text if q_rubric.get("type") == "MCQ" else page_text,
                    q_rubric=q_rubric,
                    ocr_clarity=ocr_clarity
                )

                if eval_res["requires_hitl"]:
                    num_hitl += 1
                else:
                    num_auto += 1

                evaluation = models.Evaluation(
                    submission_id=sub.id,
                    exam_id=exam_id,
                    question_id=q_id,
                    extracted_keywords=[],
                    matched_keywords=eval_res["matched"],
                    marks_awarded=eval_res["marks_awarded"],
                    max_marks=eval_res["max_marks"],
                    confidence_score=eval_res["confidence_score"],
                    requires_hitl=eval_res["requires_hitl"],
                    ai_reasoning=eval_res["ai_reasoning"],
                    ocr_text_preview=page_text[:400]
                )
                db.add(evaluation)

                total_sub_marks += eval_res["marks_awarded"]
                total_conf += eval_res["confidence_score"]
                num_evals += 1

            # Update FinalResult record
            avg_conf = (total_conf / num_evals) if num_evals > 0 else 0.0
            
            existing_res = db.query(models.FinalResult).filter(models.FinalResult.submission_id == sub.id).first()
            if existing_res:
                existing_res.total_marks = total_sub_marks
                existing_res.confidence_average = avg_conf
                existing_res.num_hitl_reviews = num_hitl
                existing_res.num_auto_passed = num_auto
            else:
                res_record = models.FinalResult(
                    submission_id=sub.id,
                    exam_id=exam_id,
                    roll_no=sub.roll_no,
                    total_marks=total_sub_marks,
                    confidence_average=avg_conf,
                    num_hitl_reviews=num_hitl,
                    num_auto_passed=num_auto
                )
                db.add(res_record)

            sub.processed_at = models.datetime.utcnow()
            db.commit()

        # Mark completed
        BATCH_PROGRESS[exam_id] = {
            "exam_id": exam_id,
            "total_submissions": total_subs,
            "processed_submissions": total_subs,
            "current_roll_no": "Completed",
            "percent_complete": 100.0,
            "status": "completed"
        }

    except Exception as e:
        db.rollback()
        BATCH_PROGRESS[exam_id] = {
            "exam_id": exam_id,
            "total_submissions": total_subs if 'total_subs' in locals() else 0,
            "processed_submissions": 0,
            "current_roll_no": "Error",
            "percent_complete": 0.0,
            "status": "error",
            "error_details": str(e)
        }
        log = models.ProcessingLog(
            exam_id=exam_id,
            event_type="ERROR",
            message="Batch processing failed",
            error_details=str(e)
        )
        db.add(log)
        db.commit()
    finally:
        db.close()
