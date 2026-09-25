"""
===============================================================================
LLB Knowledge Platform
models.py

Shared data models used throughout the application.
===============================================================================
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional


###############################################################################
# UNIVERSITY
###############################################################################

@dataclass(slots=True)
class University:
    name: str
    type: str
    base_url: str
    crawl_depth: int
    max_pages: int
    enabled: bool = True


###############################################################################
# PAGE
###############################################################################

@dataclass(slots=True)
class Page:

    url: str
    parent_url: str = ""
    title: str = ""

    depth: int = 0

    page_type: str = "Unknown"

    http_status: int = 0

    content_type: str = ""

    discovered_at: datetime = field(default_factory=datetime.utcnow)


###############################################################################
# DOCUMENT
###############################################################################

@dataclass(slots=True)
class Document:

    university: str

    url: str

    file_name: str

    extension: str

    local_path: Optional[Path] = None

    document_type: str = "Unknown"

    semester: str = ""

    subject: str = ""

    paper_code: str = ""

    academic_year: str = ""

    exam_year: str = ""

    language: str = ""

    file_size: int = 0

    md5: str = ""

    sha256: str = ""

    downloaded: bool = False

    ocr_completed: bool = False

    indexed: bool = False

    created_at: datetime = field(default_factory=datetime.utcnow)


###############################################################################
# URL TASK
###############################################################################

@dataclass(slots=True)
class CrawlTask:

    university: University

    url: str

    depth: int

    parent_url: str = ""


###############################################################################
# HTTP RESPONSE
###############################################################################

@dataclass(slots=True)
class FetchResult:

    url: str

    status_code: int

    content_type: str

    html: str = ""

    success: bool = False

    elapsed: float = 0.0

    error: str = ""


###############################################################################
# CRAWL STATISTICS
###############################################################################

@dataclass(slots=True)
class CrawlStats:

    universities: int = 0

    pages_crawled: int = 0

    pages_skipped: int = 0

    pages_failed: int = 0

    urls_discovered: int = 0

    documents_found: int = 0

    downloaded_documents: int = 0

    duplicate_urls: int = 0

    ignored_urls: int = 0

    start_time: Optional[datetime] = None

    end_time: Optional[datetime] = None

    @property
    def duration(self):

        if self.start_time is None:
            return 0

        end = self.end_time or datetime.utcnow()

        return (end - self.start_time).total_seconds()


###############################################################################
# CRAWLER STATE
###############################################################################

@dataclass
class CrawlState:

    visited: set[str] = field(default_factory=set)

    queued: set[str] = field(default_factory=set)

    downloaded: set[str] = field(default_factory=set)

    failed: set[str] = field(default_factory=set)


###############################################################################
# METADATA
###############################################################################

@dataclass(slots=True)
class Metadata:

    university: str = ""

    semester: str = ""

    subject: str = ""

    paper_code: str = ""

    academic_year: str = ""

    exam_year: str = ""

    month: str = ""

    language: str = ""

    document_type: str = ""

    title: str = ""

    keywords: list[str] = field(default_factory=list)


###############################################################################
# SEARCH RESULT
###############################################################################

@dataclass(slots=True)
class SearchResult:

    score: float

    url: str

    title: str

    snippet: str

    university: str

    semester: str

    subject: str


###############################################################################
# DOWNLOAD RESULT
###############################################################################

@dataclass(slots=True)
class DownloadResult:

    url: str

    success: bool

    file_path: Optional[Path] = None

    size: int = 0

    error: str = ""


###############################################################################
# OCR RESULT
###############################################################################

@dataclass(slots=True)
class OCRResult:

    text: str

    pages: int

    language: str

    success: bool

    error: str = ""


###############################################################################
# AI RESULT
###############################################################################

@dataclass(slots=True)
class AIResult:

    summary: str = ""

    short_notes: str = ""

    long_notes: str = ""

    flashcards: list = field(default_factory=list)

    mcqs: list = field(default_factory=list)

    keywords: list[str] = field(default_factory=list)


###############################################################################
# REPORT
###############################################################################

@dataclass(slots=True)
class CrawlReport:

    university: str

    started: datetime

    completed: Optional[datetime] = None

    pages: int = 0

    documents: int = 0

    errors: int = 0

    status: str = "Running"