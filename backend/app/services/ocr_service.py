import os
import logging
import io
from typing import Dict, Any, List
from PIL import Image

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self._reader = None
        self._initialized = False

    def _init_ocr(self):
        if self._initialized:
            return
        try:
            import torch
            import easyocr
            use_gpu = torch.cuda.is_available()
            self._reader = easyocr.Reader(['en'], gpu=use_gpu, verbose=False)
            self._initialized = True
            logger.info(f"EasyOCR initialized successfully (GPU: {use_gpu}).")
        except Exception as e:
            logger.warning(f"EasyOCR not available ({e}). Using PyMuPDF direct text parsing.")
            self._reader = None
            self._initialized = True

    def extract_text_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract text from PDF pages.
        Supports both direct text extraction (typed PDFs) and EasyOCR (scanned handwritten image PDFs).
        """
        self._init_ocr()
        pages_result = []

        try:
            import fitz  # PyMuPDF
            import numpy as np

            doc = fitz.open(pdf_path)
            for idx, page in enumerate(doc):
                page_num = idx + 1
                
                # 1. Check direct PDF text
                direct_text = page.get_text() or ""
                
                # 2. Render page image for OCR
                pix = page.get_pixmap(dpi=150)
                img_pil = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                img_np = np.array(img_pil)

                ocr_text = ""
                ocr_confidence = 0.85

                if self._reader and len(direct_text.strip()) < 10:
                    try:
                        results = self._reader.readtext(img_np)
                        lines = []
                        confidences = []
                        for bbox, text, conf in results:
                            lines.append(text.strip())
                            confidences.append(float(conf))

                        ocr_text = "\n".join(lines)
                        if confidences:
                            ocr_confidence = float(np.mean(confidences))
                    except Exception as ex:
                        logger.warning(f"EasyOCR process error on page {page_num}: {ex}")

                # Choose best text source
                combined_text = ocr_text.strip() if len(ocr_text.strip()) > len(direct_text.strip()) else direct_text.strip()
                if not combined_text:
                    combined_text = direct_text.strip()

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
            logger.error(f"PyMuPDF/OCR processing error on {pdf_path}: {e}. Falling back to PyPDF.")
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
                    "text": txt if txt.strip() else "",
                    "confidence": 0.8,
                    "has_diagram": False,
                    "diagram_regions": []
                })
            return {"pages": pages}
        except Exception as ex:
            logger.warning(f"pypdf fallback error: {ex}")

        return {"pages": []}

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
