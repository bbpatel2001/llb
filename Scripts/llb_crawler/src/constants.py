"""
===============================================================================
LLB Knowledge Platform
constants.py

Application-wide constants.

Nothing in this file should perform any processing.
===============================================================================
"""

from pathlib import Path

###############################################################################
# PROJECT
###############################################################################

PROJECT_NAME = "LLB Knowledge Platform"

VERSION = "1.0.0"

AUTHOR = "Xeevi"

###############################################################################
# ROOT FOLDERS
###############################################################################

ROOT = Path(__file__).resolve().parent.parent

CONFIG_DIR = ROOT / "config"

OUTPUT_DIR = ROOT / "output"

DOWNLOAD_DIR = ROOT / "downloads"

LOG_DIR = ROOT / "logs"

CACHE_DIR = ROOT / "cache"

TEXT_DIR = ROOT / "text"

DATABASE_DIR = ROOT / "database"

REPORT_DIR = ROOT / "reports"

TEST_DIR = ROOT / "tests"

###############################################################################
# CONFIG FILES
###############################################################################

UNIVERSITIES_FILE = CONFIG_DIR / "universities.csv"

KEYWORDS_FILE = CONFIG_DIR / "keywords.csv"

IGNORE_DOMAINS_FILE = CONFIG_DIR / "ignore_domains.csv"

FILE_EXTENSIONS_FILE = CONFIG_DIR / "file_extensions.csv"

PAGE_PRIORITY_FILE = CONFIG_DIR / "page_priority.csv"

URL_PATTERNS_FILE = CONFIG_DIR / "url_patterns.csv"

DOCUMENT_TYPES_FILE = CONFIG_DIR / "document_types.csv"

SEMESTER_PATTERNS_FILE = CONFIG_DIR / "semester_patterns.csv"

METADATA_FIELDS_FILE = CONFIG_DIR / "metadata_fields.csv"

REGEX_PATTERNS_FILE = CONFIG_DIR / "regex_patterns.csv"

IGNORE_KEYWORDS_FILE = CONFIG_DIR / "ignore_kewyrods.csv"

IGNORE_PATHS_FILE = CONFIG_DIR / "ignore_paths.csv"

IGNORE_KEYWORDS_FILE = CONFIG_DIR / "ignore_kewyrods.csv"

IGNORE_PATHS_FILE = CONFIG_DIR / "ignore_paths.csv"

CRAWL_SETTINGS_FILE = CONFIG_DIR / "crawl_settings.json"

###############################################################################
# OUTPUT FILES
###############################################################################

DISCOVERED_URLS_FILE = OUTPUT_DIR / "discovered_urls.csv"

CRAWL_REPORT_FILE = OUTPUT_DIR / "crawl_report.json"

DOWNLOAD_REPORT_FILE = OUTPUT_DIR / "download_report.csv"

METADATA_FILE = OUTPUT_DIR / "metadata.csv"

FAILED_URLS_FILE = OUTPUT_DIR / "failed_urls.csv"

DOWNLOAD_DATABASE = DOWNLOAD_REPORT_FILE

DISCOVERED_URLS = DISCOVERED_URLS_FILE

METADATA_DATABASE = METADATA_FILE

PROGRESS_FILE = OUTPUT_DIR / "progress.json"

STATISTICS_FILE = OUTPUT_DIR / "statistics.json"

BACKUP_DIR = ROOT / "backup"

REPORTS_DIR = REPORT_DIR

###############################################################################
# LOG FILES
###############################################################################

CRAWLER_LOG = LOG_DIR / "crawler.log"

DOWNLOAD_LOG = LOG_DIR / "download.log"

ERROR_LOG = LOG_DIR / "errors.log"

###############################################################################
# NETWORK
###############################################################################

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 "
    "(Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 "
    "(KHTML, like Gecko) "
    "Chrome/138.0 Safari/537.36"
)

DEFAULT_TIMEOUT = 30

CONNECT_TIMEOUT = 10

READ_TIMEOUT = 30

MAX_RETRIES = 3

BACKOFF_FACTOR = 2

MAX_REDIRECTS = 10

###############################################################################
# THREADING
###############################################################################

DEFAULT_WORKERS = 10

QUEUE_SIZE = 10000

SAVE_PROGRESS_EVERY = 100

###############################################################################
# HTTP STATUS
###############################################################################

SUCCESS_STATUS = {
    200,
    201,
    202,
}

RETRY_STATUS = {
    429,
    500,
    502,
    503,
    504,
}

###############################################################################
# MIME TYPES
###############################################################################

HTML_TYPES = {
    "text/html",
    "application/xhtml+xml",
}

PDF_TYPES = {
    "application/pdf",
}

###############################################################################
# DOWNLOADABLE FILE TYPES
###############################################################################

DOWNLOADABLE_EXTENSIONS = {
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "zip",
    "rar",
}

DOCUMENT_EXTENSIONS = tuple(
    f".{extension}"
    for extension in DOWNLOADABLE_EXTENSIONS
)

###############################################################################
# URL FILTERS
###############################################################################

INVALID_SCHEMES = (
    "javascript:",
    "mailto:",
    "tel:",
    "#",
)

###############################################################################
# FILE LIMITS
###############################################################################

MAX_FILE_SIZE_MB = 100

MAX_HTML_SIZE_MB = 20

###############################################################################
# CSV ENCODING
###############################################################################

CSV_ENCODING = "utf-8"

CSV_SEPARATOR = ","

###############################################################################
# TEXT EXTRACTION
###############################################################################

MIN_TEXT_LENGTH = 100

OCR_LANGUAGE = "eng"

###############################################################################
# DATABASE
###############################################################################

DATABASE_NAME = "llb_knowledge.db"

###############################################################################
# PAGE TYPES
###############################################################################

PAGE_UNKNOWN = "Unknown"

PAGE_HOME = "Home"

PAGE_FACULTY = "Faculty"

PAGE_LAW = "Law"

PAGE_SYLLABUS = "Syllabus"

PAGE_EXAM = "Exam"

PAGE_QUESTION_PAPER = "QuestionPaper"

PAGE_DOWNLOAD = "Download"

PAGE_DOCUMENT = "Document"

###############################################################################
# DOCUMENT TYPES
###############################################################################

DOC_UNKNOWN = "Unknown"

DOC_PDF = "PDF"

DOC_DOC = "DOC"

DOC_DOCX = "DOCX"

DOC_ZIP = "ZIP"

###############################################################################
# REGEX
###############################################################################

YEAR_REGEX = r"(19|20)\d{2}"

SEMESTER_REGEX = (
    r"(semester|sem)"
    r"\s*"
    r"([1-9]|10)"
)

EMAIL_REGEX = r"[\w\.-]+@[\w\.-]+\.\w+"

PHONE_REGEX = r"(?:\+?\d[\d\s().-]{7,}\d)"

DOCUMENT_TYPES = (
    PAGE_SYLLABUS,
    PAGE_EXAM,
    PAGE_QUESTION_PAPER,
    PAGE_DOCUMENT,
)

UNIVERSITIES = ()

SUBJECTS = ()

###############################################################################
# CONSOLE
###############################################################################

LINE = "=" * 80

SMALL_LINE = "-" * 80

###############################################################################
# CREATE REQUIRED DIRECTORIES
###############################################################################

REQUIRED_DIRS = [
    CONFIG_DIR,
    OUTPUT_DIR,
    DOWNLOAD_DIR,
    LOG_DIR,
    CACHE_DIR,
    TEXT_DIR,
    DATABASE_DIR,
    REPORT_DIR,
    TEST_DIR,
    BACKUP_DIR,
]
