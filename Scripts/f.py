from pathlib import Path

ROOT = Path("llb_crawler")

folders = [
    "config",
    "src",
    "output",
    "downloads",
    "logs",
    "cache",
    "text",
    "database",
    "reports",
    "tests"
]

files = [
    "crawl.py",
    "requirements.txt",
    "README.md",

    "config/universities.csv",
    "config/keywords.csv",
    "config/ignore_domains.csv",
    "config/file_extensions.csv",
    "config/page_priority.csv",
    "config/url_patterns.csv",
    "config/document_types.csv",
    "config/semester_patterns.csv",
    "config/metadata_fields.csv",
    "config/regex_patterns.csv",
    "config/crawl_settings.json",

    "src/__init__.py",
    "src/config.py",
    "src/logger.py",
    "src/models.py",
    "src/utils.py",
    "src/parser.py",
    "src/url_filter.py",
    "src/storage.py",
    "src/crawler.py",
    "src/downloader.py",
    "src/metadata.py",
    "src/progress.py",
    "src/session.py",
    "src/constants.py",
]

ROOT.mkdir(exist_ok=True)

for folder in folders:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)

for file in files:
    path = ROOT / file

    path.parent.mkdir(parents=True, exist_ok=True)

    if not path.exists():
        path.touch()

print("=" * 60)
print("Project created successfully")
print(ROOT.resolve())
print("=" * 60)

for p in sorted(ROOT.rglob("*")):
    print(p.relative_to(ROOT))