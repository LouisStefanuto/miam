import io
from typing import Any
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from miam.domain.ports_secondary import WordExporterPort
from miam.infra.db.base import Recipe


class WordExporter(WordExporterPort):
    def __init__(self, title: str = "My Recipe Book"):
        self.document = Document()
        self._setup_styles()
        self._add_title(title)

    def _setup_styles(self) -> None:
        style = self.document.styles["Normal"]
        font = style.font
        font.name = "Calibri"
        font.size = Pt(11)

    def _add_title(self, title: str) -> None:
        heading = self.document.add_heading(title, level=0)
        heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    def export(self, recipes: list[Recipe], output_path: str) -> None:
        for recipe in recipes:
            self._add_recipe(recipe)
            self.document.add_page_break()  # type: ignore[no-untyped-call]

        self.document.save(output_path)

    def to_bytes(self, recipes: list[Recipe]) -> bytes:
        for recipe in recipes:
            self._add_recipe(recipe)
            self.document.add_page_break()  # type: ignore[no-untyped-call]

        buffer = io.BytesIO()
        self.document.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()

    def _add_recipe(self, recipe: Recipe) -> None:
        # Title
        self.document.add_heading(recipe.title, level=1)

        # Meta info line
        meta_parts = [
            f"Category: {recipe.category.value}",
            f"Season: {recipe.season.value}" if recipe.season else None,
            "Vegetarian 🌱" if recipe.is_veggie else None,
        ]
        meta_text = " • ".join(p for p in meta_parts if p)

        meta_p = self.document.add_paragraph(meta_text)
        meta_p.runs[0].italic = True

        # Times table
        self._add_times_table(recipe)

        # Description
        self.document.add_heading("Description", level=2)
        self.document.add_paragraph(recipe.description)

        # Ingredients
        self.document.add_heading("Ingredients", level=2)
        for ri in recipe.ingredients:
            qty = f"{ri.quantity:g} " if ri.quantity else ""
            unit = f"{ri.unit} " if ri.unit else ""
            line = f"{qty}{unit}{ri.ingredient.name}"
            self.document.add_paragraph(line, style="List Bullet")

    def _add_times_table(self, recipe: Recipe) -> None:
        table = self.document.add_table(rows=1, cols=3)
        table.style = "Light Grid Accent 1"

        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = "Prep"
        hdr_cells[1].text = "Cook"
        hdr_cells[2].text = "Rest"

        row = table.add_row().cells
        row[0].text = self._fmt_minutes(recipe.prep_time_minutes)
        row[1].text = self._fmt_minutes(recipe.cook_time_minutes)
        row[2].text = self._fmt_minutes(recipe.rest_time_minutes)

    @staticmethod
    def _fmt_minutes(value: Any) -> str:
        return f"{value} min" if value is not None else "—"
