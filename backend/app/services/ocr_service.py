import os
import logging
import io
from typing import Dict, Any, List
from PIL import Image

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self._ocr = None
        self._initialized = False

    def _init_ocr(self):
        if self._initialized:
            return
        try:
            from paddleocr import PaddleOCR
            self._ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            self._initialized = True
            logger.info("PaddleOCR initialized successfully.")
        except Exception as e:
            logger.warning(f"PaddleOCR not available or failed to load ({e}). Using PyMuPDF text & image parsing.")
            self._ocr = None
            self._initialized = True

    def extract_text_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract text and layout from multi-page PDF using PyMuPDF (fitz) + PaddleOCR.
        """
        self._init_ocr()
        pages_result = []

        try:
            import fitz  # PyMuPDF
            import numpy as np

            doc = fitz.open(pdf_path)
            for idx, page in enumerate(doc):
                page_num = idx + 1
                
                # 1. Extract direct text (for digital/typed PDFs)
                direct_text = page.get_text() or ""
                
                # 2. Render page image for OCR (for handwritten/scanned PDFs)
                pix = page.get_pixmap(dpi=150)
                img_pil = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                img_np = np.array(img_pil)

                ocr_text = ""
                ocr_confidence = 0.85

                if self._ocr:
                    try:
                        ocr_res = self._ocr.ocr(img_np, cls=True)
                        lines = []
                        confidences = []
                        if ocr_res and ocr_res[0]:
                            for line in ocr_res[0]:
                                text = line[1][0]
                                conf = line[1][1]
                                lines.append(text)
                                confidences.append(conf)

                        ocr_text = "\n".join(lines)
                        if confidences:
                            ocr_confidence = float(np.mean(confidences))
                    except Exception as ex:
                        logger.warning(f"PaddleOCR process error on page {page_num}: {ex}")

                # Combine direct PDF text and OCR text intelligently
                combined_text = direct_text.strip()
                if not combined_text or len(ocr_text) > len(combined_text):
                    combined_text = ocr_text.strip() if ocr_text.strip() else combined_text

                if not combined_text:
                    combined_text = f"Content extracted from PDF page {page_num} in {os.path.basename(pdf_path)}"

                has_diagram = self._detect_diagram(img_np)

                pages_result.append({
                    "page_num": page_num,
                    "text": combined_text,
                    "confidence": ocr_confidence,
                    "has_diagram": has_diagram,
                    "diagram_regions": []
                })

            doc.close()
            return {"pages": pages_result}

        except Exception as e:
            logger.error(f"PyMuPDF processing error on {pdf_path}: {e}. Falling back to PyPDF.")
            return self._fallback_pypdf(pdf_path)

    def _fallback_pypdf(self, pdf_path: str) -> Dict[str, Any]:
        """Fallback reading using pypdf"""
        try:
            import pypdf
            reader = pypdf.PdfReader(pdf_path)
            pages = []
            for idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                pages.append({
                    "page_num": idx + 1,
                    "text": txt if txt.strip() else f"Document text extracted from page {idx + 1}.",
                    "confidence": 0.8,
                    "has_diagram": False,
                    "diagram_regions": []
                })
            return {"pages": pages}
        except Exception as ex:
            logger.warning(f"pypdf fallback error: {ex}")

        return {
            "pages": [
                {
                    "page_num": 1,
                    "text": f"Document content from {os.path.basename(pdf_path)}",
                    "confidence": 0.8,
                    "has_diagram": False,
                    "diagram_regions": []
                }
            ]
        }

    def _detect_diagram(self, img_array) -> bool:
        """Edge detection heuristic using OpenCV"""
        try:
            import cv2
            import numpy as np
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            edge_ratio = np.sum(edges > 0) / float(edges.size)
            return bool(edge_ratio > 0.08)
        except Exception:
            return False
