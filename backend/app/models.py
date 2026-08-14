from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    total_marks = Column(Integer, nullable=False)
    exam_structure = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    rubric = relationship("Rubric", back_populates="exam", uselist=False, cascade="all, delete-orphan")
    submissions = relationship("StudentSubmission", back_populates="exam", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="exam", cascade="all, delete-orphan")
    results = relationship("FinalResult", back_populates="exam", cascade="all, delete-orphan")
    logs = relationship("ProcessingLog", back_populates="exam", cascade="all, delete-orphan")

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), unique=True, nullable=False)
    rubric_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    exam = relationship("Exam", back_populates="rubric")

class StudentSubmission(Base):
    __tablename__ = "student_submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    roll_no = Column(String(50), nullable=False)
    pdf_path = Column(String(500), nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    exam = relationship("Exam", back_populates="submissions")
    ocr_outputs = relationship("OCROutput", back_populates="submission", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="submission", cascade="all, delete-orphan")
    result = relationship("FinalResult", back_populates="submission", uselist=False, cascade="all, delete-orphan")

class OCROutput(Base):
    __tablename__ = "ocr_outputs"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_submissions.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=True)
    has_diagram = Column(Boolean, default=False)
    diagram_regions = Column(JSON, nullable=True)
    ocr_clarity = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("StudentSubmission", back_populates="ocr_outputs")

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_submissions.id", ondelete="CASCADE"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(50), nullable=False)
    
    extracted_keywords = Column(JSON, nullable=True)
    matched_keywords = Column(JSON, nullable=True)
    
    marks_awarded = Column(Float, default=0.0)
    max_marks = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    
    requires_hitl = Column(Boolean, default=False)
    ai_reasoning = Column(Text, nullable=True)
    diagram_extracted_text = Column(Text, nullable=True)
    ocr_text_preview = Column(Text, nullable=True)
    
    finalized = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    submission = relationship("StudentSubmission", back_populates="evaluations")
    exam = relationship("Exam", back_populates="evaluations")
    hitl_review = relationship("HitlReview", back_populates="evaluation", uselist=False, cascade="all, delete-orphan")

class HitlReview(Base):
    __tablename__ = "hitl_reviews"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id", ondelete="CASCADE"), unique=True, nullable=False)
    teacher_name = Column(String(255), default="Teacher")
    action = Column(String(50), nullable=False)  # 'APPROVED', 'MODIFIED', 'REJECTED'
    final_marks = Column(Float, nullable=False)
    teacher_feedback = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    evaluation = relationship("Evaluation", back_populates="hitl_review")

class FinalResult(Base):
    __tablename__ = "final_results"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_submissions.id", ondelete="CASCADE"), unique=True, nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    roll_no = Column(String(50), nullable=False)
    
    total_marks = Column(Float, default=0.0)
    confidence_average = Column(Float, default=0.0)
    num_hitl_reviews = Column(Integer, default=0)
    num_auto_passed = Column(Integer, default=0)
    
    reviewed_by = Column(String(255), nullable=True)
    finalized_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("StudentSubmission", back_populates="result")
    exam = relationship("Exam", back_populates="results")

class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    submission_id = Column(Integer, ForeignKey("student_submissions.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    exam = relationship("Exam", back_populates="logs")
