import re
from typing import List, Dict, Any, Optional
from app.services.llm_service import LLMService

llm_service = LLMService()

class EvaluationService:
    def parse_all_student_mcqs(self, full_student_text: str) -> Dict[str, str]:
        """
        Extract all MCQ option choices (A, B, C, D) from sequential OCR lines.
        Handles multi-line splits where question number is on line N and option letter is on line N+1/N+2.
        Handles common OCR digit variations for question numbers.
        """
        mcq_answers = {}
        ocr_num_fixes = {
            's': '5', 's.': '5',
            'io': '10', '1o': '10',
            '(2': '12', '12': '12',
            '13': '13',
            'il': '14', '14': '14',
            '(s': '15', '15': '15', 'is': '15',
            'l6': '16', '16': '16',
            '(7': '17', '17': '17',
            '4x': '18', '18': '18',
            '19': '19',
            '90': '20', '20': '20'
        }

        clean_lines = [l.strip() for l in full_student_text.split('\n') if l.strip()]

        for i, line in enumerate(clean_lines):
            line_lower = line.lower()
            num_match = re.match(r'^(?:q|question\s*)?([0-9]{1,2}|s|io|1o|\(2|il|\(s|is|l6|\(7|4x|90)[\s\.\:\)\,\_\-]*([a-d])?$', line_lower)
            if num_match:
                raw_num = num_match.group(1)
                direct_opt = num_match.group(2)
                
                q_num = ocr_num_fixes.get(raw_num, raw_num)
                if q_num.isdigit() and 1 <= int(q_num) <= 20:
                    q_key = f"Q{int(q_num)}"
                    
                    if direct_opt:
                        mcq_answers[q_key] = direct_opt.upper()
                    else:
                        for j in range(i + 1, min(i + 4, len(clean_lines))):
                            next_line = clean_lines[j].strip().upper()
                            if re.match(r'^(?:q|question\s*)?[0-9]{1,2}[\s\.\:\)\,\_\-]', next_line, re.IGNORECASE):
                                break
                            letter_match = re.match(r'^[\(\[]?([A-D])[\)\]\.\,]?$', next_line)
                            if letter_match:
                                mcq_answers[q_key] = letter_match.group(1).upper()
                                break

        return mcq_answers

    def extract_student_answer_for_question(self, full_student_text: str, q_num: str) -> str:
        """
        Extract the specific subjective answer written by the student for a given question number (e.g. '21', '22', '26').
        """
        clean_num = q_num.replace("Q", "").strip()
        lines = full_student_text.split('\n')
        
        for idx, line in enumerate(lines):
            line_str = line.strip()
            # Match line starting with this question number
            if re.match(rf'^(?:q|question\s*)?{clean_num}\s*[\.\:\)\,\_\-]', line_str, re.IGNORECASE):
                extracted = [line_str]
                for next_line in lines[idx+1:]:
                    # Stop when next question number is encountered (e.g. 22., 23., 24.)
                    if re.match(r'^(?:q|question\s*)?[0-9]{1,2}\s*[\.\:\)\,\_\-]', next_line.strip(), re.IGNORECASE):
                        break
                    extracted.append(next_line.strip())
                return "\n".join([e for e in extracted if e]).strip()

        return ""

    def evaluate_question(
        self,
        full_student_text: str,
        q_rubric: Dict[str, Any],
        ocr_clarity: float = 0.85
    ) -> Dict[str, Any]:
        """
        Evaluate student response for a specific rubric question.
        - MCQs: Extracts student's chosen option letter and matches against rubric.
        - Short Answer: Evaluates student's answer text against reference solution via Qwen 2.5 / Gemini.
        """
        q_id = str(q_rubric.get("q_id", "Q1"))
        q_num = q_id.replace("Q", "").strip()
        q_type = str(q_rubric.get("type", "Short_Answer")).upper()
        max_marks = float(q_rubric.get("marks", 1.0 if q_type == "MCQ" else 2.0))
        q_prompt = q_rubric.get("question_text", "")
        ref_solution = q_rubric.get("grading_notes", "") or ", ".join(q_rubric.get("keywords", []))

        # 1. MCQ Evaluation (Questions 1-20)
        if q_type == "MCQ" or max_marks == 1.0:
            correct_ans = str(q_rubric.get("correct_answer", "") or q_rubric.get("keywords", [""])[0]).strip().upper()
            
            # Extract MCQ answers map from OCR lines
            mcq_map = self.parse_all_student_mcqs(full_student_text)
            chosen_option = mcq_map.get(f"Q{q_num}", "")

            is_correct = (chosen_option == correct_ans)
            
            if is_correct:
                marks = max_marks
                conf = 0.98
                reasoning = f"MCQ Evaluation: Candidate correctly selected Option '{chosen_option}' (Correct Key: '{correct_ans}'). Awarded {marks} mark."
                requires_hitl = False
            else:
                marks = 0.0
                conf = 0.95 if chosen_option else 0.70
                if chosen_option:
                    reasoning = f"MCQ Evaluation: Candidate selected Option '{chosen_option}' (Correct Key: '{correct_ans}'). 0 marks awarded."
                else:
                    reasoning = f"MCQ Evaluation: No option response detected for Q{q_num} in candidate sheet (Correct Key: '{correct_ans}'). 0 marks awarded."
                requires_hitl = bool(not chosen_option and ocr_clarity < 0.60)

            matched_list = [{"student_keyword": chosen_option, "rubric_keyword": correct_ans, "confidence": conf}] if is_correct else []

            return {
                "matched": matched_list,
                "marks_awarded": marks,
                "max_marks": max_marks,
                "confidence_score": conf,
                "requires_hitl": requires_hitl,
                "ai_reasoning": reasoning,
                "extracted_answer": f"Selected Option: {chosen_option}" if chosen_option else "No response detected"
            }

        # 2. Short Answer / Subjective Evaluation (Questions 21-35)
        extracted_answer = self.extract_student_answer_for_question(full_student_text, q_num)
        eval_answer_text = extracted_answer if extracted_answer else full_student_text
        
        eval_result = llm_service.evaluate_answer_semantically(
            question_prompt=q_prompt,
            reference_answer=ref_solution,
            student_answer=eval_answer_text,
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
            "ai_reasoning": eval_result["ai_reasoning"],
            "extracted_answer": extracted_answer if extracted_answer else "Handwritten response analyzed from exam sheet"
        }
