import re
from typing import List, Dict, Any
from app.services.llm_service import LLMService

llm_service = LLMService()

class EvaluationService:
    def evaluate_question(
        self,
        student_ocr_text: str,
        q_rubric: Dict[str, Any],
        ocr_clarity: float = 0.85
    ) -> Dict[str, Any]:
        """
        Simplified Evaluation:
        - For MCQs: Evaluates exact option matching (A/B/C/D).
        - For Subjective/Short Answer: Compares student OCR text against the rubric reference solution
          using Gemini semantic evaluation with threshold tolerance (70% tolerance).
        """
        q_type = q_rubric.get("type", "Short_Answer").upper()
        max_marks = float(q_rubric.get("marks", 1.0 if q_type == "MCQ" else 2.0))
        q_prompt = q_rubric.get("question_text", "")
        ref_solution = q_rubric.get("grading_notes", "") or ", ".join(q_rubric.get("keywords", []))

        # 1. MCQ Evaluation
        if q_type == "MCQ":
            correct_ans = str(q_rubric.get("correct_answer", "") or q_rubric.get("keywords", [""])[0]).strip().upper()
            text_upper = student_ocr_text.upper()

            # Check for option match
            option_patterns = [
                rf'\b{correct_ans}\b',
                rf'OPTION\s*[:\-]?\s*{correct_ans}',
                rf'ANS(?:WER)?\s*[:\-]?\s*{correct_ans}'
            ]
            is_correct = any(re.search(pat, text_upper) for pat in option_patterns)

            marks = max_marks if is_correct else 0.0
            confidence = 0.98 if is_correct else 0.85
            matched_list = [{"student_keyword": correct_ans, "rubric_keyword": correct_ans, "confidence": 1.0}] if is_correct else []
            reasoning = f"MCQ Evaluation: Student selected Option '{correct_ans}' (Correct)." if is_correct else f"MCQ Evaluation: Correct option '{correct_ans}' was not found in student response."

            return {
                "matched": matched_list,
                "marks_awarded": marks,
                "max_marks": max_marks,
                "confidence_score": confidence,
                "requires_hitl": bool(not is_correct and ocr_clarity < 0.65),
                "ai_reasoning": reasoning
            }

        # 2. Subjective / Short Answer Evaluation via Gemini Semantic Evaluation
        eval_result = llm_service.evaluate_answer_semantically(
            question_prompt=q_prompt,
            reference_answer=ref_solution,
            student_answer=student_ocr_text,
            max_marks=max_marks,
            threshold_tolerance=0.70
        )

        matched_list = [{"student_keyword": "semantic_concept", "rubric_keyword": ref_solution[:40], "confidence": eval_result["confidence_score"]}]

        return {
            "matched": matched_list,
            "marks_awarded": eval_result["marks_awarded"],
            "max_marks": max_marks,
            "confidence_score": eval_result["confidence_score"],
            "requires_hitl": eval_result["requires_hitl"],
            "ai_reasoning": eval_result["ai_reasoning"]
        }
