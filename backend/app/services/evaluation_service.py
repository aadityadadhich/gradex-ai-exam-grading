import re
from typing import List, Dict, Any
from difflib import SequenceMatcher

class EvaluationService:
    def evaluate_question(
        self,
        student_ocr_text: str,
        student_keywords: List[Dict[str, Any]],
        q_rubric: Dict[str, Any],
        ocr_clarity: float = 0.8
    ) -> Dict[str, Any]:
        """
        Main entrypoint to evaluate a question (supports MCQ and Short Answer).
        """
        q_type = q_rubric.get("type", "Short_Answer").upper()
        max_marks = float(q_rubric.get("marks", 1.0 if q_type == "MCQ" else 2.0))

        # 1. Evaluate MCQ Question
        if q_type == "MCQ":
            correct_ans = str(q_rubric.get("correct_answer", "") or q_rubric.get("keywords", [""])[0]).strip().upper()
            text_upper = student_ocr_text.upper()

            # Find standalone option letter in student text (e.g. "1. B", "Ans: C", "Option A")
            option_patterns = [
                rf'\b{correct_ans}\b',
                rf'OPTION\s*[:\-]?\s*{correct_ans}',
                rf'ANS(?:WER)?\s*[:\-]?\s*{correct_ans}'
            ]
            is_correct = any(re.search(pat, text_upper) for pat in option_patterns)

            marks = max_marks if is_correct else 0.0
            confidence = 0.98 if is_correct else 0.85
            matched_list = [{"student_keyword": correct_ans, "rubric_keyword": correct_ans, "confidence": 1.0, "match_ratio": 1.0}] if is_correct else []
            reasoning = f"MCQ Evaluation: Student selected Option '{correct_ans}' (Correct)." if is_correct else f"MCQ Evaluation: Option '{correct_ans}' not found in student response."

            return {
                "matched": matched_list,
                "marks_awarded": marks,
                "max_marks": max_marks,
                "confidence_score": confidence,
                "requires_hitl": bool(not is_correct and ocr_clarity < 0.6),
                "ai_reasoning": reasoning
            }

        # 2. Evaluate Short Answer Question via Keyword Matching
        rubric_weights = q_rubric.get("keyword_weights", {})
        if not rubric_weights and "keywords" in q_rubric:
            rubric_weights = {kw: 1.0 for kw in q_rubric["keywords"]}

        match_res = self.match_keywords(student_keywords, rubric_weights)
        conf_score = self.compute_confidence_score(match_res, ocr_clarity)
        marks = self.award_marks(match_res, q_rubric)
        reasoning = self.generate_reasoning(q_rubric.get("q_id", "Q"), marks, max_marks, match_res, q_rubric)

        return {
            "matched": match_res["matched"],
            "marks_awarded": marks,
            "max_marks": max_marks,
            "confidence_score": conf_score,
            "requires_hitl": bool(conf_score < 0.70),
            "ai_reasoning": reasoning
        }

    def match_keywords(
        self,
        student_keywords: List[Dict[str, Any]],
        rubric_weights: Dict[str, float],
        fuzzy_threshold: float = 0.65
    ) -> Dict[str, Any]:
        """
        Fuzzy match extracted student keywords against rubric keywords.
        """
        matched = []
        matched_rubric_kws = set()
        match_score = 0.0

        rubric_kw_list = list(rubric_weights.keys())

        for student_kw_item in student_keywords:
            student_kw = str(student_kw_item.get("keyword", "")).strip().lower()
            confidence = float(student_kw_item.get("confidence", 1.0))

            best_match = None
            best_ratio = 0.0

            for r_kw in rubric_kw_list:
                r_kw_clean = str(r_kw).strip().lower()
                
                if student_kw == r_kw_clean or student_kw in r_kw_clean or r_kw_clean in student_kw:
                    ratio = 1.0
                else:
                    ratio = SequenceMatcher(None, student_kw, r_kw_clean).ratio()

                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = r_kw

            if best_match and best_ratio >= fuzzy_threshold and best_match not in matched_rubric_kws:
                weight = float(rubric_weights.get(best_match, 1.0))
                item_confidence = confidence * weight * best_ratio
                
                matched.append({
                    "student_keyword": student_kw_item.get("keyword"),
                    "rubric_keyword": best_match,
                    "confidence": round(item_confidence, 2),
                    "match_ratio": round(best_ratio, 2)
                })
                matched_rubric_kws.add(best_match)
                match_score += weight

        total_expected_weight = sum(float(w) for w in rubric_weights.values()) or 1.0

        return {
            "matched": matched,
            "match_score": round(match_score, 2),
            "num_matched": len(matched),
            "total_expected": len(rubric_weights),
            "match_ratio": round(match_score / total_expected_weight, 2)
        }

    def compute_confidence_score(self, match_result: Dict[str, Any], ocr_clarity: float = 0.8) -> float:
        """Confidence score calculation"""
        kw_ratio = match_result.get("match_ratio", 0.0)
        confidence = (kw_ratio + ocr_clarity) / 2.0
        return round(min(max(confidence, 0.0), 1.0), 2)

    def award_marks(self, match_result: Dict[str, Any], question_rubric: Dict[str, Any]) -> float:
        """Calculate marks awarded"""
        max_marks = float(question_rubric.get("marks", 2))
        passing_threshold = int(question_rubric.get("passing_threshold", 1))
        num_matched = match_result.get("num_matched", 0)
        total_keywords = max(match_result.get("total_expected", 1), 1)

        if num_matched < passing_threshold:
            return round((num_matched / total_keywords) * max_marks * 0.5, 1)
        
        proportion = min(num_matched / total_keywords, 1.0)
        return round(max_marks * proportion, 1)

    def generate_reasoning(
        self,
        question_id: str,
        marks_awarded: float,
        max_marks: float,
        match_result: Dict[str, Any],
        question_rubric: Dict[str, Any]
    ) -> str:
        """Generate human-readable AI reasoning"""
        matched = match_result.get("matched", [])
        num_matched = len(matched)
        total = match_result.get("total_expected", 0)

        if marks_awarded == max_marks:
            reasoning = f"Full credit awarded ({marks_awarded}/{max_marks}). Student matched {num_matched}/{total} key concepts."
        elif marks_awarded > 0:
            matched_terms = ", ".join([f"'{m['rubric_keyword']}'" for m in matched])
            reasoning = f"Partial credit ({marks_awarded}/{max_marks}). Concept match found for {matched_terms}."
        else:
            reasoning = f"No marks awarded (0/{max_marks}). Missing required key terms."

        notes = question_rubric.get("grading_notes")
        if notes:
            reasoning += f" Reference: {notes}"

        return reasoning
