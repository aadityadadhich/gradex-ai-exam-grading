import os
import json
import logging
import re
import csv
import io
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self._genai = None
        
        if self.gemini_api_key and self.gemini_api_key != "your_gemini_api_key_here":
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_api_key)
                self._genai = genai
                # Gemini candidate models
                self.candidate_model_names = [
                    'gemini-2.5-flash',
                    'gemini-flash-latest',
                    'gemini-1.5-flash',
                    'gemini-flash-lite-latest',
                    'gemini-2.5-pro'
                ]
                logger.info("Google Generative AI service (Gemini only) initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}")

    def _generate_with_gemini(self, prompt: str, image_bytes: bytes = None) -> str:
        """Call Gemini API across candidate models with automatic quota fallback"""
        if not self._genai:
            raise RuntimeError("Gemini API not configured")

        last_err = None
        for m_name in self.candidate_model_names:
            try:
                generation_config = {"temperature": 0.2, "max_output_tokens": 8192}
                model = self._genai.GenerativeModel(m_name, generation_config=generation_config)
                if image_bytes:
                    res = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_bytes}])
                else:
                    res = model.generate_content(prompt)
                
                if res and res.text:
                    return res.text.strip()
            except Exception as ex:
                last_err = ex
                logger.warning(f"Gemini model '{m_name}' failed/quota ({ex}). Trying next candidate...")
                continue

        raise last_err or RuntimeError("All Gemini candidate models failed")

    def evaluate_answer_semantically(
        self,
        question_prompt: str,
        reference_answer: str,
        student_answer: str,
        max_marks: float,
        threshold_tolerance: float = 0.70
    ) -> Dict[str, Any]:
        """
        Simplified semantic evaluation using Gemini AI.
        Compares student's OCR answer to the rubric reference solution and awards marks
        based on meaning, accuracy, and tolerance threshold.
        """
        if self._genai and student_answer and len(student_answer.strip()) > 2:
            prompt = f"""You are an objective and fair exam evaluator.
Evaluate the student's handwritten answer against the reference solution for this question.

Question: {question_prompt}
Reference Solution: {reference_answer}
Student's Extracted Answer: {student_answer}
Max Marks: {max_marks}
Tolerance Threshold: {threshold_tolerance * 100}%

Instructions:
1. Assess the conceptual understanding and core facts present in the student's answer.
2. If the answer satisfies at least {threshold_tolerance * 100}% of the key requirements, award full or proportional marks.
3. Ignore handwriting artifacts, OCR misspellings, and minor grammatical imperfections.
4. If the student made a valid attempt with partial concepts, award partial credit.

Return ONLY a JSON object:
{{
  "marks_awarded": 1.5,
  "confidence_score": 0.90,
  "requires_hitl": false,
  "ai_reasoning": "Clear concise explanation of why marks were awarded."
}}"""

            try:
                raw_text = self._generate_with_gemini(prompt)
                cleaned_json = self._clean_json_string(raw_text)
                parsed = json.loads(cleaned_json)
                if isinstance(parsed, dict) and "marks_awarded" in parsed:
                    awarded = float(parsed.get("marks_awarded", 0.0))
                    awarded = min(max(awarded, 0.0), max_marks)
                    conf = float(parsed.get("confidence_score", 0.85))
                    return {
                        "marks_awarded": awarded,
                        "confidence_score": conf,
                        "requires_hitl": bool(conf < 0.70 or parsed.get("requires_hitl", False)),
                        "ai_reasoning": parsed.get("ai_reasoning", f"Evaluated with semantic similarity ({awarded}/{max_marks} marks).")
                    }
            except Exception as ex:
                logger.warning(f"Gemini semantic evaluation fallback ({ex}).")

        # Heuristic fallback if Gemini API is unreachable
        return self._heuristic_semantic_fallback(question_prompt, reference_answer, student_answer, max_marks, threshold_tolerance)

    def _heuristic_semantic_fallback(
        self,
        question_prompt: str,
        reference_answer: str,
        student_answer: str,
        max_marks: float,
        threshold_tolerance: float = 0.70
    ) -> Dict[str, Any]:
        """Fast keyword/concept heuristic fallback"""
        ref_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', reference_answer.lower()))
        stud_words = set(re.findall(r'\b[a-zA-Z]{4,}\b', student_answer.lower()))
        
        stop_words = {"this", "that", "with", "from", "have", "model", "data", "used"}
        ref_keywords = ref_words - stop_words
        
        if not ref_keywords:
            return {
                "marks_awarded": max_marks,
                "confidence_score": 0.85,
                "requires_hitl": False,
                "ai_reasoning": f"Full credit awarded ({max_marks}/{max_marks}). Student response provided."
            }

        matched = ref_keywords.intersection(stud_words)
        match_ratio = len(matched) / len(ref_keywords)

        if match_ratio >= threshold_tolerance:
            marks = max_marks
            conf = 0.90
            requires_hitl = False
            reasoning = f"Full credit ({marks}/{max_marks}). Student covered key concepts ({', '.join(list(matched)[:3])})."
        elif match_ratio >= 0.35:
            marks = round(max_marks * (match_ratio / threshold_tolerance), 1)
            conf = 0.75
            requires_hitl = False
            reasoning = f"Partial credit ({marks}/{max_marks}). Matched concepts: {', '.join(list(matched))}."
        else:
            marks = 0.0
            conf = 0.60
            requires_hitl = True
            reasoning = f"Flagged for teacher review (0/{max_marks}). Student response lacked sufficient reference terms."

        return {
            "marks_awarded": min(marks, max_marks),
            "confidence_score": conf,
            "requires_hitl": requires_hitl,
            "ai_reasoning": reasoning
        }

    def extract_keywords_from_diagram(self, image_base64: str, question_context: str = "") -> List[Dict[str, Any]]:
        """Extract text and concepts from diagram using Gemini Vision"""
        if self._genai and image_base64:
            prompt = f"""Analyze this diagram image for an exam answer.
Question Context: {question_context}
Return ONLY a JSON array of extracted labels:
[
  {{"concept": "label1", "confidence": 0.95}}
]"""

            try:
                import base64
                image_bytes = base64.b64decode(image_base64)
                raw_text = self._generate_with_gemini(prompt, image_bytes=image_bytes)
                cleaned_json = self._clean_json_string(raw_text)
                parsed = json.loads(cleaned_json)
                if isinstance(parsed, list):
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini Vision diagram extraction failed: {e}")

        return [{"concept": "labeled_diagram_element", "confidence": 0.75}]

    def generate_rubric_from_qna(self, question_text: str, answer_text: str) -> Dict[str, Any]:
        """Generate marking rubric JSON for ALL questions using Gemini & Structured Parser"""
        structured_rubric = self._parse_structured_qna(question_text, answer_text)

        if self._genai:
            try:
                prompt = f"""You are an expert exam evaluation rubric generator.
Analyze the uploaded Question Paper and Answer Key text and generate marking rubrics for ALL questions.

--- UPLOADED QUESTION PAPER TEXT ---
{question_text[:4000]}

--- UPLOADED ANSWER KEY TEXT ---
{answer_text[:4000]}

Return ONLY a valid JSON object matching this exact structure:
{{
  "questions": [
    {{
      "q_id": "Q1",
      "question_text": "Question prompt text",
      "type": "MCQ",
      "correct_answer": "B",
      "marks": 1,
      "keywords": ["B"],
      "keyword_weights": {{"B": 1.0}},
      "passing_threshold": 1,
      "grading_notes": "MCQ Option B"
    }}
  ]
}}
IMPORTANT:
- Extract EVERY question found in the text.
- Output raw JSON string only without markdown codeblocks."""

                raw_text = self._generate_with_gemini(prompt)
                cleaned_json = self._clean_json_string(raw_text)
                parsed = json.loads(cleaned_json)
                if isinstance(parsed, dict) and "questions" in parsed and len(parsed["questions"]) >= len(structured_rubric.get("questions", [])):
                    logger.info(f"Gemini generated full {len(parsed['questions'])} question rubric.")
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini rubric generation warning/quota ({e}). Using structured Q&A rubric.")

        return structured_rubric

    def _parse_structured_qna(self, question_text: str, answer_text: str) -> Dict[str, Any]:
        """Smart offline parser for structured Q&A text and CSV answer keys"""
        questions = []
        csv_rows = []
        try:
            reader = csv.reader(io.StringIO(answer_text.strip()))
            for row in reader:
                if len(row) >= 3 and row[0].strip().lower() != "question_number":
                    csv_rows.append(row)
        except Exception:
            pass

        q_text_map = {}
        for match in re.finditer(r'(?:^|\n)(\d+)\.\s*(.+?)(?=\n\d+\.|\nPart|\Z)', question_text, re.DOTALL):
            q_num = match.group(1)
            q_body = match.group(2).strip()
            q_first_line = q_body.split('\n')[0].strip()
            q_text_map[q_num] = q_first_line if len(q_first_line) > 5 else q_body[:150]

        if csv_rows:
            for row in csv_rows:
                q_num = row[0].strip()
                q_type = row[1].strip()
                ans_content = row[2].strip()

                q_prompt = q_text_map.get(q_num, f"Question {q_num}")
                is_mcq = q_type.upper() == "MCQ" or len(ans_content) == 1

                if is_mcq:
                    questions.append({
                        "q_id": f"Q{q_num}",
                        "question_text": q_prompt,
                        "type": "MCQ",
                        "correct_answer": ans_content.upper(),
                        "marks": 1,
                        "keywords": [ans_content.upper()],
                        "keyword_weights": {ans_content.upper(): 1.0},
                        "passing_threshold": 1,
                        "grading_notes": f"MCQ Question. Correct Option: {ans_content.upper()}"
                    })
                else:
                    words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{4,}\b', ans_content) if w.lower() not in {"this", "that", "with", "from", "have", "model"}]
                    kws = list(dict.fromkeys(words))[:6] or [ans_content[:30]]

                    questions.append({
                        "q_id": f"Q{q_num}",
                        "question_text": q_prompt,
                        "type": "Short_Answer",
                        "marks": 2,
                        "keywords": kws,
                        "keyword_weights": {kw: 1.0 for kw in kws},
                        "passing_threshold": max(1, len(kws) // 2),
                        "grading_notes": f"Reference Solution: {ans_content[:150]}"
                    })

        if questions:
            return {"questions": questions}

        # Fallback text lines
        lines = [line.strip() for line in question_text.split("\n") if line.strip()]
        for idx, line in enumerate(lines[:35]):
            if len(line) < 5: continue
            words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{4,}\b', line) if w.lower() not in {"what", "explain", "define", "question"}]
            kws = list(dict.fromkeys(words))[:4] or ["concept"]
            questions.append({
                "q_id": f"Q{idx+1}",
                "question_text": line[:150],
                "type": "Short_Answer",
                "marks": 2,
                "keywords": kws,
                "keyword_weights": {kw: 1.0 for kw in kws},
                "passing_threshold": 1,
                "grading_notes": f"Parsed from line: {line[:60]}"
            })

        return {"questions": questions or [{
            "q_id": "Q1",
            "question_text": "Question 1 from uploaded document",
            "type": "Short_Answer",
            "marks": 2,
            "keywords": ["concept"],
            "keyword_weights": {"concept": 1.0},
            "passing_threshold": 1,
            "grading_notes": "Default question"
        }]}

    def _clean_json_string(self, text: str) -> str:
        """Remove ```json codeblocks"""
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
        return text.strip()
