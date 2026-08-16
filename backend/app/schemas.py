from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Auth Schemas ---
class UserLoginRequest(BaseModel):
    username: str = Field(..., example="Student_1")
    password: str = Field(..., example="password123")
    role: str = Field(..., example="STUDENT") # 'STUDENT' or 'TEACHER'

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Exam Schemas ---
class ExamCreateRequest(BaseModel):
    exam_name: str = Field(..., example="Physics Midterm")
    subject: str = Field(..., example="Physics")
    exam_structure: List[Dict[str, Any]] = Field(default=[], example=[
        {
            "part": "A",
            "num_questions": 2,
            "marks_per_question": 2,
            "compulsory": True
        }
    ])

class ExamResponse(BaseModel):
    id: int
    exam_name: str
    subject: str
    total_marks: int
    exam_structure: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Rubric Schemas ---
class RubricSaveRequest(BaseModel):
    rubric_data: Dict[str, Any]

class RubricResponse(BaseModel):
    id: int
    exam_id: int
    rubric_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

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

class BulkUploadResponse(BaseModel):
    uploaded_count: int
    submissions: List[SubmissionResponse]

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
    recheck_requested: Optional[bool] = False
    recheck_comment: Optional[str] = None

class FinalResultResponse(BaseModel):
    roll_no: str
    total_marks: float
    confidence_average: float
    num_hitl_reviews: int
    num_auto_passed: int
    finalized_at: datetime

    class Config:
        from_attributes = True

# --- Student Specific Schemas ---
class RecheckSubmitRequest(BaseModel):
    evaluation_id: int
    comment: str = Field(..., example="I explained the complete derivation in line 4 which was missed by AI.")

class StudentQuestionDetail(BaseModel):
    evaluation_id: int
    question_id: str
    max_marks: float
    marks_awarded: float
    ocr_text_preview: Optional[str] = None
    ai_reasoning: Optional[str] = None
    teacher_feedback: Optional[str] = None
    recheck_requested: bool = False
    recheck_comment: Optional[str] = None
    recheck_status: Optional[str] = None

class StudentExamReportResponse(BaseModel):
    exam_id: int
    exam_name: str
    subject: str
    roll_no: str
    total_marks: float
    max_total_marks: float
    pdf_download_url: str
    questions: List[StudentQuestionDetail]
