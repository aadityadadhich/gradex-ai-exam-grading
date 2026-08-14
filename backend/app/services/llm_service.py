import os
import json
import logging
import re
import csv
import io
import requests
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.mistral_api_key = settings.MISTRAL_API_KEY
        self._genai = None
        
        if self.gemini_api_key and self.gemini_api_key != "your_gemini_api_key_here":
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_api_key)
                self._genai = genai
                self.candidate_model_names = [
                    'gemini-2.5-flash',
                    'gemini-flash-latest',
                    'gemini-1.5-flash',
                    'gemini-flash-lite-latest',
                    'gemini-2.5-pro'
                ]
                logger.info("Google Generative AI service initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}")

    def _generate_with_fallback(self, prompt: str, image_bytes: bytes = None) -> str:
        """
        Multi-Provider & Multi-Model Fallback Chain:
        1. Gemini 2.5 Flash / Flash-latest / 1.5-Flash
        2. Mistral API (mistral-small-latest / mistral-medium-latest)
        """
        last_err = None

        # 1. Try Gemini Models
        if self._genai:
            for m_name in self.candidate_model_names:
                try:
                    generation_config = {"temperature": 0.2, "max_output_tokens": 8192}
                    model = self._genai.GenerativeModel(m_name, generation_config=generation_config)
                    if image_bytes:
                        res = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_bytes}])
                    else:
                        res = model.generate_content(prompt)
                    
                    if res and res.text:
                        logger.info(f"Generated response via Gemini '{m_name}'")
                        return res.text.strip()
                except Exception as ex:
                    last_err = ex
                    logger.warning(f"Gemini model '{m_name}' failed/quota ({ex}). Trying next candidate...")
                    continue

        # 2. Try Mistral API
        if self.mistral_api_key and self.mistral_api_key != "your_mistral_api_key_here":
            try:
                logger.info("Attempting generation via Mistral API...")
                return self._call_mistral_api(prompt)
            except Exception as ex:
                last_err = ex
                logger.warning(f"Mistral API call failed: {ex}")

        raise last_err or RuntimeError("All AI providers (Gemini & Mistral) failed or hit quota limits.")

    def _call_mistral_api(self, prompt: str) -> str:
        """Call Mistral AI Chat Completions API"""
        headers = {
            "Authorization": f"Bearer {self.mistral_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "mistral-small-latest",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 8192
        }
        resp = requests.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload, timeout=45)
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        else:
            raise RuntimeError(f"Mistral API HTTP {resp.status_code}: {resp.text}")

    def extract_keywords_from_text(self, student_answer: str, question_context: str = "") -> List[Dict[str, Any]]:
        """
        Extract core concepts from student answer using LLM with heuristic fallback.
        """
        if student_answer and len(student_answer.strip()) > 3:
            prompt = f"""Extract key concepts/keywords from this student answer.
Question Context: {question_context}
Answer Text: {student_answer}

Return ONLY a valid JSON array of objects with 'keyword' and 'confidence' (0.0 to 1.0):
[
  {{"keyword": "concept1", "confidence": 0.95}},
  {{"keyword": "concept2", "confidence": 0.88}}
]
Ignore spelling mistakes and grammar errors. Focus purely on technical concepts.
Do NOT include markdown formatting."""

            try:
                raw_text = self._generate_with_fallback(prompt)
                cleaned_json = self._clean_json_string(raw_text)
                parsed = json.loads(cleaned_json)
                if isinstance(parsed, list) and len(parsed) > 0:
                    return parsed
            except Exception as e:
                logger.warning(f"LLM keyword extraction fallback activated ({e}).")

        # Heuristic fallback: Extract key words from actual text
        words = re.findall(r'\b[a-zA-Z0-9_-]{3,}\b', student_answer or "")
        stop_words = {"the", "and", "are", "for", "with", "that", "this", "from", "they", "have", "were", "been", "was", "page", "text", "content"}
        unique_words = []
        for w in words:
            wl = w.lower()
            if wl not in stop_words and wl not in [uw['keyword'].lower() for uw in unique_words]:
                unique_words.append({"keyword": wl, "confidence": 0.85})
        return unique_words[:10] if unique_words else [{"keyword": "concept", "confidence": 0.8}]

    def extract_keywords_from_diagram(self, image_base64: str, question_context: str = "") -> List[Dict[str, Any]]:
        """
        Extract labels and concepts from diagram image using Vision API.
        """
        if image_base64:
            prompt = f"""Analyze this diagram image for an exam answer.
Question Context: {question_context}
Return ONLY a JSON array of extracted labels:
[
  {{"concept": "label1", "confidence": 0.95}}
]"""

            try:
                import base64
                image_bytes = base64.b64decode(image_base64)
                raw_text = self._generate_with_fallback(prompt, image_bytes=image_bytes)
                cleaned_json = self._clean_json_string(raw_text)
                parsed = json.loads(cleaned_json)
                if isinstance(parsed, list):
                    return parsed
            except Exception as e:
                logger.warning(f"Vision diagram extraction failed: {e}")

        return [{"concept": "labeled_diagram_element", "confidence": 0.75}]

    def generate_rubric_from_qna(self, question_text: str, answer_text: str) -> Dict[str, Any]:
        """
        Generate marking rubric JSON for ALL questions (no 18-question limit truncation).
        Combines AI LLM enhancement with structured Q&A CSV/TXT parser.
        """
        # Always build complete baseline questions using structured Q&A parser (handles all 35+ questions)
        structured_rubric = self._parse_structured_qna(question_text, answer_text)

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
      "keywords": ["B", "concept"],
      "keyword_weights": {{"B": 1.0}},
      "passing_threshold": 1,
      "grading_notes": "MCQ Option B"
    }}
  ]
}}
IMPORTANT:
- Extract EVERY question found in the text (do NOT stop at 15 or 18 questions).
- Output raw JSON string only without markdown codeblocks."""

            raw_text = self._generate_with_fallback(prompt)
            cleaned_json = self._clean_json_string(raw_text)
            parsed = json.loads(cleaned_json)
            if isinstance(parsed, dict) and "questions" in parsed and len(parsed["questions"]) >= len(structured_rubric.get("questions", [])):
                logger.info(f"AI generated full {len(parsed['questions'])} question rubric.")
                return parsed
        except Exception as e:
            logger.warning(f"AI rubric generation warning/quota ({e}). Returning complete structured Q&A rubric.")

        return structured_rubric

    def _parse_structured_qna(self, question_text: str, answer_text: str) -> Dict[str, Any]:
        """Smart offline parser for structured Q&A text and CSV answer keys (Parses ALL 35+ questions)"""
        questions = []
        
        # Parse CSV Answer Key rows
        csv_rows = []
        try:
            reader = csv.reader(io.StringIO(answer_text.strip()))
            for row in reader:
                if len(row) >= 3 and row[0].strip().lower() != "question_number":
                    csv_rows.append(row)
        except Exception:
            pass

        # Map questions from question_text by matching "1.", "2.", "21." etc.
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
                    kws = list(dict.fromkeys(words))[:6]
                    if not kws:
                        kws = [ans_content[:30]]

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
            logger.info(f"Structured Q&A parser successfully extracted {len(questions)} complete questions.")
            return {"questions": questions}

        # Fallback text line parser
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
        """Remove ```json and ``` codeblock wrappers"""
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
        return text.strip()
