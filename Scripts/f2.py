"""
LLB Crawler
Project Bootstrap Script

Creates missing folders only.
Safe to run multiple times.
"""

from pathlib import Path

ROOT = Path(__file__).parent

FOLDERS = [

    # Root folders
    "backup",
    "cache",
    "config",
    "database",
    "downloads",
    "logs",
    "output",
    "reports",
    "src",
    "tests",
    "text",

    # Cache
    "cache/ocr",
    "cache/embeddings",
    "cache/ai",

    # Database
    "database/sqlite",
    "database/export",

    # Output
    "output/question_bank",
    "output/answers",
    "output/flashcards",
    "output/mcq",
    "output/short_answers",
    "output/long_answers",
    "output/revision_notes",
    "output/statistics",
    "output/excel",
    "output/pdf",
    "output/markdown",

    # Reports
    "reports/charts",
    "reports/html",

    # Source
    "src/scanner",
    "src/pdf",
    "src/parser",
    "src/analysis",
    "src/ai",
    "src/search",
    "src/database",
    "src/web",
    "src/utils",

    # Scanner
    "src/scanner/university",
    "src/scanner/semester",
    "src/scanner/subject",

    # PDF
    "src/pdf/ocr",
    "src/pdf/extractor",

    # AI
    "src/ai/prompts",
    "src/ai/models",

    # Search
    "src/search/faiss",

    # Web
    "src/web/static",
    "src/web/templates",

    # Utils
    "src/utils/helpers",
]

print("=" * 60)
print("Creating Project Structure")
print("=" * 60)

created = 0

for folder in FOLDERS:
    path = ROOT / folder

    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
        print(f"[CREATED] {folder}")
        created += 1
    else:
        print(f"[OK]      {folder}")

print("\nDone")
print(f"Folders Created : {created}")
print(f"Total Folders   : {len(FOLDERS)}")