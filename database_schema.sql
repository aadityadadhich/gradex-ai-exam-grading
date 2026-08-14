-- AI Exam Grading System - PostgreSQL Schema
-- Copy-paste ready for Supabase or local PostgreSQL
-- Version: 1.0 (Hackathon)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. EXAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    total_marks INT NOT NULL,
    exam_structure JSONB,  -- Stores Part A/B/C configuration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. RUBRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rubrics (
    id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL UNIQUE,
    rubric_data JSONB NOT NULL,  -- Full rubric with keywords, weights, thresholds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. STUDENT SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_submissions (
    id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL,
    roll_no VARCHAR(50) NOT NULL,
    pdf_path VARCHAR(500) NOT NULL,  -- Path to uploaded PDF
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    UNIQUE(exam_id, roll_no)
);

-- Index for faster lookups
CREATE INDEX idx_submissions_exam_id ON student_submissions(exam_id);
CREATE INDEX idx_submissions_roll_no ON student_submissions(roll_no);

-- ============================================================================
-- 4. OCR OUTPUTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ocr_outputs (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL,
    page_number INT NOT NULL,
    raw_text TEXT,  -- Extracted text from page
    has_diagram BOOLEAN DEFAULT FALSE,
    diagram_regions JSONB,  -- [{x, y, width, height}, ...]
    ocr_clarity FLOAT DEFAULT 0.0,  -- Confidence score from PaddleOCR (0-1)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES student_submissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_ocr_submission_id ON ocr_outputs(submission_id);

-- ============================================================================
-- 5. EVALUATIONS TABLE (Per Question)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL,
    exam_id INT NOT NULL,
    question_id VARCHAR(50) NOT NULL,  -- e.g., "Q1A", "Q2B", "Q1C"
    
    -- Keyword extraction results
    extracted_keywords JSONB,  -- [{"keyword": "...", "confidence": 0.95}, ...]
    matched_keywords JSONB,    -- [{"student_keyword": "...", "rubric_keyword": "...", "confidence": 0.85}, ...]
    
    -- Scoring
    marks_awarded FLOAT DEFAULT 0.0,
    max_marks FLOAT DEFAULT 0.0,
    confidence_score FLOAT DEFAULT 0.0,  -- (keyword_match + ocr_clarity) / 2
    
    -- HITL routing
    requires_hitl BOOLEAN DEFAULT FALSE,  -- If confidence < 0.7
    
    -- AI reasoning
    ai_reasoning TEXT,  -- Why these marks?
    diagram_extracted_text TEXT,  -- If diagram was analyzed
    ocr_text_preview TEXT,  -- Raw OCR text for reference
    
    -- Status
    finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES student_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE INDEX idx_evaluations_submission ON evaluations(submission_id);
CREATE INDEX idx_evaluations_exam ON evaluations(exam_id);
CREATE INDEX idx_evaluations_requires_hitl ON evaluations(requires_hitl);
CREATE INDEX idx_evaluations_question ON evaluations(question_id);

-- ============================================================================
-- 6. HITL REVIEWS TABLE (Teacher Overrides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hitl_reviews (
    id SERIAL PRIMARY KEY,
    evaluation_id INT NOT NULL UNIQUE,
    teacher_name VARCHAR(255) DEFAULT 'Teacher',
    action VARCHAR(50) NOT NULL,  -- 'APPROVED', 'MODIFIED', 'REJECTED'
    
    -- Final decision
    final_marks FLOAT NOT NULL,
    teacher_feedback TEXT,  -- Feedback for student
    
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
);

CREATE INDEX idx_hitl_evaluation ON hitl_reviews(evaluation_id);
CREATE INDEX idx_hitl_action ON hitl_reviews(action);

-- ============================================================================
-- 7. FINAL RESULTS TABLE (Per Student, All Questions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS final_results (
    id SERIAL PRIMARY KEY,
    submission_id INT NOT NULL UNIQUE,
    exam_id INT NOT NULL,
    roll_no VARCHAR(50) NOT NULL,
    
    -- Aggregate scores
    total_marks FLOAT DEFAULT 0.0,
    confidence_average FLOAT DEFAULT 0.0,  -- Average confidence across all questions
    num_hitl_reviews INT DEFAULT 0,  -- How many questions were manually reviewed
    num_auto_passed INT DEFAULT 0,  -- How many auto-graded
    
    reviewed_by VARCHAR(255),  -- Teacher who did HITL reviews
    finalized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (submission_id) REFERENCES student_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE INDEX idx_results_exam ON final_results(exam_id);
CREATE INDEX idx_results_roll_no ON final_results(roll_no);

-- ============================================================================
-- 8. PROCESSING LOG TABLE (For debugging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS processing_logs (
    id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL,
    submission_id INT,
    event_type VARCHAR(50),  -- 'OCR_START', 'OCR_DONE', 'EVALUATION_START', 'EVALUATION_DONE', 'ERROR'
    message TEXT,
    error_details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES student_submissions(id) ON DELETE SET NULL
);

CREATE INDEX idx_logs_exam ON processing_logs(exam_id);
CREATE INDEX idx_logs_event ON processing_logs(event_type);

-- ============================================================================
-- VIEWS (For easier querying)
-- ============================================================================

-- View: Pending HITL reviews (unanswered)
CREATE OR REPLACE VIEW hitl_pending AS
SELECT 
    e.id as evaluation_id,
    e.submission_id,
    e.exam_id,
    e.question_id,
    ss.roll_no,
    e.marks_awarded as suggested_marks,
    e.max_marks,
    e.confidence_score,
    e.extracted_keywords,
    e.matched_keywords,
    e.ai_reasoning,
    e.created_at
FROM evaluations e
JOIN student_submissions ss ON e.submission_id = ss.id
WHERE e.requires_hitl = TRUE
  AND e.id NOT IN (SELECT evaluation_id FROM hitl_reviews)
  AND e.finalized = FALSE
ORDER BY e.confidence_score ASC;  -- Lowest confidence first

-- View: Completed HITL reviews
CREATE OR REPLACE VIEW hitl_completed AS
SELECT 
    e.id as evaluation_id,
    e.question_id,
    ss.roll_no,
    e.marks_awarded as original_marks,
    hr.final_marks,
    hr.action,
    hr.teacher_feedback,
    hr.reviewed_at
FROM evaluations e
JOIN student_submissions ss ON e.submission_id = ss.id
JOIN hitl_reviews hr ON e.id = hr.evaluation_id
ORDER BY hr.reviewed_at DESC;

-- View: Exam summary
CREATE OR REPLACE VIEW exam_summary AS
SELECT 
    e.id as exam_id,
    e.exam_name,
    COUNT(DISTINCT ss.id) as total_submissions,
    COUNT(DISTINCT CASE WHEN ev.requires_hitl = TRUE THEN ss.id END) as hitl_flagged,
    COUNT(DISTINCT CASE WHEN ev.requires_hitl = FALSE THEN ss.id END) as auto_passed,
    COUNT(DISTINCT CASE WHEN hr.id IS NOT NULL THEN ss.id END) as hitl_completed,
    ROUND(AVG(ev.confidence_score)::numeric, 2) as avg_confidence
FROM exams e
LEFT JOIN student_submissions ss ON e.id = ss.exam_id
LEFT JOIN evaluations ev ON ss.id = ev.submission_id
LEFT JOIN hitl_reviews hr ON ev.id = hr.evaluation_id
GROUP BY e.id, e.exam_name;

-- ============================================================================
-- INITIALIZATION DATA (Sample for testing)
-- ============================================================================

-- Sample exam structure
INSERT INTO exams (exam_name, subject, total_marks, exam_structure)
VALUES (
    'Physics Midterm',
    'Physics',
    16,
    '{
        "parts": [
            {
                "part": "A",
                "num_questions": 2,
                "marks_per_question": 2,
                "compulsory": true,
                "max_answer_length": 25
            },
            {
                "part": "B",
                "num_questions": 7,
                "marks_per_question": 4,
                "compulsory": false,
                "attempt": 5,
                "max_answer_length": 150
            },
            {
                "part": "C",
                "num_questions": 5,
                "marks_per_question": 10,
                "compulsory": false,
                "attempt": 3,
                "max_answer_length": 500
            }
        ]
    }'::JSONB
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPFUL QUERIES (Run these to check status)
-- ============================================================================

/*
-- Check all exams
SELECT * FROM exams;

-- Check submissions for exam 1
SELECT * FROM student_submissions WHERE exam_id = 1;

-- Check pending HITL reviews
SELECT * FROM hitl_pending;

-- Check evaluation status
SELECT 
    question_id,
    COUNT(*) as total,
    COUNT(CASE WHEN requires_hitl = FALSE THEN 1 END) as auto_passed,
    COUNT(CASE WHEN requires_hitl = TRUE THEN 1 END) as needs_review,
    ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence
FROM evaluations
WHERE exam_id = 1
GROUP BY question_id;

-- Check exam progress
SELECT * FROM exam_summary WHERE exam_id = 1;

-- Delete all data for exam (for testing/reset)
DELETE FROM exams WHERE id = 1;  -- Cascades to all related tables

-- Count tokens used (rough estimate)
SELECT COUNT(*) * 150 as estimated_tokens_used FROM evaluations WHERE exam_id = 1;
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
