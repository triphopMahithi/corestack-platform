from fpdf import FPDF
from typing import Callable, List

# แต่ละสเต็ป คือฟังก์ชันที่รับ builder แล้วคืน builder ต่อ
Step = Callable[['PDFBuilder'], 'PDFBuilder']

class PDFBuilder:
    def __init__(self, font_path: str = 'THSarabunNew.ttf'):
        self.font_path = font_path
        self.pdf = FPDF()
        self._steps: List[Step] = []

    def setup(self) -> 'PDFBuilder':
        # เอาไว้ตอนรัน pipeline หรือ chaining
        def step(builder: PDFBuilder) -> PDFBuilder:
            pdf = builder.pdf
            pdf.add_page()
            pdf.add_font('THSarabunNew', '', builder.font_path, uni=True)
            pdf.set_font('THSarabunNew', '', 12)
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.set_margins(left=1, top=10, right=1)
            return builder

        self._steps.append(step)
        return self

    def add_lines(self, lines: List[str]) -> 'PDFBuilder':
        def step(builder: PDFBuilder) -> PDFBuilder:
            for line in lines:
                builder.pdf.cell(0, 10, line, ln=True)
            return builder

        self._steps.append(step)
        return self

    def save(self, filename: str) -> 'PDFBuilder': 
        def step(builder: PDFBuilder) -> PDFBuilder:
            builder.pdf.output(filename)
            return builder

        self._steps.append(step)
        return self

    def set_steps(self, steps: List[Step]) -> 'PDFBuilder':
        self._steps = steps
        return self

    def execute(self) -> 'PDFBuilder':
        # นำทุก step มาทำทีเดียวบน execute โดยเราได้เก็บข้อมูลทั้ง builder&self ทุกขั้นตอนสุดท้ายจึงนำมาทำงานทีเดียว
        for step in self._steps:
            step(self)
        return self
