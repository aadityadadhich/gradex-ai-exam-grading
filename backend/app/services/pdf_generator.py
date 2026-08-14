import csv
from io import BytesIO, StringIO
from typing import List, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.colors import HexColor, grey, black

class PDFGenerator:
    def generate_grade_pdf(
        self,
        exam_name: str,
        subject: str,
        roll_no: str,
        total_marks: float,
        max_total_marks: float,
        evaluations: List[Dict[str, Any]]
    ) -> BytesIO:
        """
        Generate individual grade report PDF with question-by-question breakdown & AI reasoning.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=HexColor('#1E293B'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'HeaderSub',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            textColor=HexColor('#64748B')
        )
        body_style = ParagraphStyle(
            'TableText',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=HexColor('#334155')
        )
        bold_body = ParagraphStyle(
            'TableTextBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        # Title Block
        elements.append(Paragraph(f"<b>Grade Evaluation Report</b> — {exam_name}", title_style))
        elements.append(Paragraph(f"Subject: {subject} | Student Roll No: <b>{roll_no}</b> | Final Score: <b>{total_marks} / {max_total_marks}</b>", subtitle_style))
        elements.append(Spacer(1, 0.25 * inch))

        # Evaluations Table
        for i, ev in enumerate(evaluations):
            q_id = ev.get("question_id", f"Q{i+1}")
            awarded = ev.get("marks_awarded", 0.0)
            max_m = ev.get("max_marks", 2.0)
            reasoning = ev.get("ai_reasoning", "No detailed reasoning provided.")
            ocr_text = ev.get("ocr_text_preview", "N/A")
            hitl_badge = "Teacher Reviewed" if ev.get("finalized") and ev.get("hitl_review") else "Auto-Graded"

            left_cell = f"""
            <b>Question ID:</b> {q_id}<br/><br/>
            <b>Extracted Student Answer (OCR):</b><br/>
            <i>{ocr_text[:300]}</i>
            """

            right_cell = f"""
            <b>Marks:</b> {awarded} / {max_m} ({hitl_badge})<br/><br/>
            <b>AI Reasoning & Justification:</b><br/>
            {reasoning}
            """

            data = [
                [Paragraph("Student OCR Extract", bold_body), Paragraph("AI Evaluation & Marks", bold_body)],
                [Paragraph(left_cell, body_style), Paragraph(right_cell, body_style)]
            ]

            t = Table(data, colWidths=[3.2 * inch, 3.8 * inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#F1F5F9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#0F172A')),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CBD5E1')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))

            elements.append(t)
            elements.append(Spacer(1, 0.2 * inch))

            if (i + 1) % 3 == 0 and i < len(evaluations) - 1:
                elements.append(PageBreak())

        doc.build(elements)
        buffer.seek(0)
        return buffer

    def generate_csv_results(self, exam_name: str, results: List[Dict[str, Any]]) -> str:
        """
        Generate master CSV string for exam scoresheet.
        """
        output = StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Roll No",
            "Total Marks",
            "Confidence Average (%)",
            "Auto-Passed Questions",
            "HITL Reviewed Questions",
            "Finalized Timestamp"
        ])

        for r in results:
            writer.writerow([
                r.get("roll_no", ""),
                r.get("total_marks", 0.0),
                f"{round(r.get('confidence_average', 0.0) * 100, 1)}%",
                r.get("num_auto_passed", 0),
                r.get("num_hitl_reviews", 0),
                str(r.get("finalized_at", ""))
            ])

        return output.getvalue()
