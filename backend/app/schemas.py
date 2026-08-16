import json
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime


# --- Exam Schemas ---
class ExamCreateRequest(BaseModel):
    exam_name: str = Field(..., examples=["Physics Midterm"])
    subject: str = Field(..., examples=["Physics"])
    exam_structure: List[Dict[str, Any]] = Field(
        default=[],
        examples=[[
            {
                "part": "A",
                "num_questions": 2,
                "marks_per_question": 2,
                "compulsory": True
            }
        ]]
    )

class ExamResponse(BaseModel):
    id: int
    exam_name: str
    subject: str
    total_marks: int
    exam_structure: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

    model_config = ConfigDict(from_attributes=True)

class RubricSaveRequest(BaseModel):
    rubric_data: Dict[str, Any]

class RubricResponse(BaseModel):
    id: int
    exam_id: int
    rubric_data: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Submission Schemas ---
class SubmissionResponse(BaseModel):
    id: int
    exam_id: int
    roll_no: str
    pdf_path: str
    upload_timestamp: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Evaluation & HITL Schemas ---
class HitlReviewRequest(BaseModel):
    action: str  # APPROVED, MODIFIED, REJECTED
    final_marks: float
    teacher_feedback: Optional[str] = ""

class HitlItemResponse(BaseModel):
    evaluation_id: int
    submission_id: int
    roll_no: str
    question_id: str
    student_extracted_keywords: List[Dict[str, Any]]
    matched_keywords: List[Dict[str, Any]]
    ai_reasoning: str
    suggested_marks: float
    max_marks: float
    confidence_score: float
    ocr_text_preview: Optional[str] = None
    diagram_text: Optional[str] = None

class FinalResultResponse(BaseModel):
    roll_no: str
    total_marks: float
    confidence_average: float
    num_hitl_reviews: int
    num_auto_passed: int
    finalized_at: datetime

    class Config:
        from_attributes = True
