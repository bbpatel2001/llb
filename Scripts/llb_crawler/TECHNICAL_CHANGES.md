# Technical Changes Reference

## Detailed Line-by-Line Changes

### 1. src/url_filter.py

#### Change 1: Fix __init__ indentation (Lines 31-62)

**Location**: Class URLFilter, __init__ method

**Before**:
```python
def __init__(self):
    self.visited: set[str] = set()
    self.allowed_domains = {
        domain.lower()
        for domain in config.allowed_domains
    }
    self.blocked_extensions = set()

if not config.file_extensions.empty:  # <-- WRONG INDENTATION
    blocked = config.file_extensions.loc[...]
    self.blocked_extensions = {...}

self.document_extensions = config.get_extensions()  # <-- WRONG INDENTATION
```

**After**:
```python
def __init__(self):
    self.visited: set[str] = set()
    self.allowed_domains = set()
    self.blocked_extensions = set()
    self.document_extensions = set()
    self._initialized = False

def initialize(self):
    """Initialize after config is loaded."""
    if self._initialized:
        return
    
    self.allowed_domains = {
        domain.lower()
        for domain in config.allowed_domains
    }
    
    self.blocked_extensions = set()
    if not config.file_extensions.empty:
        blocked = config.file_extensions.loc[...]
        self.blocked_extensions = {...}
    
    self.document_extensions = config.get_extensions()
    self._initialized = True
```

**Reason**: Defers config loading to lazy initialization pattern. Config may be empty at import time.

#### Change 2: Add initialize() call in should_crawl (Line 209)

**Before**:
```python
def should_crawl(self, url: str, depth: int = 0) -> bool:
    url = self.normalize(url)
    # ... rest of checks ...
```

**After**:
```python
def should_crawl(self, url: str, depth: int = 0) -> bool:
    self.initialize()  # <-- ADDED
    url = self.normalize(url)
    # ... rest of checks ...
```

**Reason**: Ensures config is loaded before first use of URLFilter.

---

### 2. src/crawler.py

#### Change 1: Add missing import (Line 28)

**Before**:
```python
from src.constants import *
# Missing REPORTS_DIR
```

**After**:
```python
from src.constants import REPORTS_DIR
```

**Reason**: REPORTS_DIR used on line 348 in write_report() method.

#### Change 2: Fix stats attribute in fetch() (Line 132)

**Before**:
```python
if response is None:
    self.stats.failed_pages += 1  # <-- WRONG
    return None

page.http_status = response.status_code
self.stats.pages += 1  # <-- WRONG
return response.text
```

**After**:
```python
if response is None:
    self.stats.pages_failed += 1  # <-- CORRECT
    return None

page.http_status = response.status_code
self.stats.pages_crawled += 1  # <-- CORRECT
return response.text
```

**Reason**: Attributes in CrawlStats dataclass are `pages_failed` and `pages_crawled`, not `failed_pages` and `pages`.

#### Change 3: Fix Document constructor (Lines 175-186)

**Before**:
```python
for url in links:
    document = Document(  # <-- INCOMPLETE
        url=url,
        page_url=page.url,
    )
```

**After**:
```python
for url in links:
    from src.utils import filename_from_url
    
    document = Document(
        university="",
        url=url,
        file_name=filename_from_url(url) or "document",
        extension=url.split(".")[-1] if "." in url else "",
    )
```

**Reason**: Document dataclass requires `university` and `file_name` fields (no optional defaults).

#### Change 4: Fix stats attributes in process_page() (Lines 270-275)

**Before**:
```python
self.stats.links += len(
    analysis.get("links", [])
)
self.stats.images += len(
    analysis.get("images", [])
)
```

**After**:
```python
self.stats.urls_discovered += len(
    analysis.get("links", [])
)
self.stats.urls_discovered += len(
    analysis.get("images", [])
)
```

**Reason**: CrawlStats has `urls_discovered` field, not separate `links` and `images` fields.

#### Change 5: Fix stats attribute in crawl() (Line 291)

**Before**:
```python
except Exception as ex:
    logger.exception("Crawler error : %s", ex)
    self.stats.failed_pages += 1  # <-- WRONG
```

**After**:
```python
except Exception as ex:
    logger.exception("Crawler error : %s", ex)
    self.stats.pages_failed += 1  # <-- CORRECT
```

**Reason**: CrawlStats dataclass attribute is `pages_failed`, not `failed_pages`.

#### Change 6: Fix summary() method (Lines 338-352)

**Before**:
```python
return {
    "pages_crawled": self.stats.pages,
    "failed_pages": self.stats.failed_pages,
    "documents_found": self.stats.documents,
    "links_found": self.stats.links,
    "images_found": self.stats.images,
    # ...
}
```

**After**:
```python
return {
    "pages_crawled": self.stats.pages_crawled,
    "pages_failed": self.stats.pages_failed,
    "documents_found": self.stats.documents_found,
    "urls_discovered": self.stats.urls_discovered,
    # ...
}
```

**Reason**: Attribute names must match CrawlStats dataclass definition.

---

### 3. src/storage.py

#### Change 1: Add missing import (Line 8)

**Before**:
```python
from src.constants import *
from src.logger import get_logger
# Missing config import
```

**After**:
```python
from src.constants import *
from src.logger import get_logger
from src.config import config
```

**Reason**: config needed in load_universities() method.

#### Change 2: Add null checks in save_download() (Lines 223-231)

**Before**:
```python
row = {
    "University": document.university,
    "DocumentType": document.document_type,
    "Semester": document.semester,
    "Subject": document.subject,
    "URL": document.url,
    "LocalPath": str(document.local_path),
    # ...
}
```

**After**:
```python
row = {
    "University": document.university or "",
    "DocumentType": document.document_type or "",
    "Semester": document.semester or "",
    "Subject": document.subject or "",
    "URL": document.url,
    "LocalPath": str(document.local_path) if document.local_path else "",
    # ...
}
```

**Reason**: Some fields default to empty string, need null checks before CSV export.

#### Change 3: Add null checks in save_discovered_url() (Lines 238-251)

**Before**:
```python
row = {
    "URL": page.url,
    "Parent": page.parent_url,
    "Depth": page.depth,
    "Type": page.page_type,
    "Status": page.http_status,
}
```

**After**:
```python
row = {
    "URL": page.url,
    "Parent": page.parent_url or "",
    "Depth": page.depth,
    "Type": page.page_type or "",
    "Status": page.http_status,
}
```

**Reason**: parent_url and page_type default to empty string in Page dataclass.

#### Change 4: Add load_universities() method (After load_downloaded_urls)

**Added**:
```python
def load_universities(self):
    """Load universities from config."""
    from src.models import University
    
    universities = []
    
    if config._loaded:
        for _, row in config.universities.iterrows():
            university = University(
                name=row.get("University", ""),
                type=row.get("Type", ""),
                base_url=row.get("BaseURL", ""),
                crawl_depth=int(row.get("CrawlDepth", 5)),
                max_pages=int(row.get("MaxPages", 1000)),
                enabled=config.yes_no(row.get("Enabled", False)),
            )
            universities.append(university)
    
    return universities
```

**Reason**: crawl.py calls storage.load_universities() which didn't exist.

---

### 4. src/progress.py

#### Change 1: Fix display() method attributes (Line 62)

**Before**:
```python
logger.info(
    "Pages=%d  Docs=%d  Failed=%d  Queue=%d  Elapsed=%ds",
    stats.pages,
    stats.documents,
    stats.failed_pages,
    stats.queue_size,
    int(self.elapsed),
)
```

**After**:
```python
logger.info(
    "Pages=%d  Docs=%d  Failed=%d  Queue=%d  Elapsed=%ds",
    stats.pages_crawled,
    stats.documents_found,
    stats.pages_failed,
    0,  # queue_size not tracked
    int(self.elapsed),
)
```

**Reason**: Attributes must match CrawlStats dataclass.

#### Change 2: Fix print_summary() method (Lines 87-103)

**Before**:
```python
def print_summary(self, stats):
    logger.info("=" * 70)
    logger.info("CRAWL SUMMARY")
    logger.info("=" * 70)
    for key, value in self.summary(stats).items():
        logger.info("%-25s : %s", key, value)
    logger.info("=" * 70)
```

**After**:
```python
def print_summary(self, stats):
    logger.info("=" * 70)
    logger.info("CRAWL SUMMARY")
    logger.info("=" * 70)
    summary_data = {
        "pages_crawled": stats.pages_crawled,
        "pages_failed": stats.pages_failed,
        "documents_found": stats.documents_found,
        "urls_discovered": stats.urls_discovered,
        "downloaded_documents": stats.downloaded_documents,
        "ignored_urls": stats.ignored_urls,
        "elapsed_seconds": round(self.elapsed, 2),
    }
    for key, value in summary_data.items():
        logger.info("%-25s : %s", key, value)
    logger.info("=" * 70)
```

**Reason**: Replaces broken self.summary() call with direct dict construction using correct attributes.

---

### 5. crawl.py

#### Change 1: Fix load_tasks() function (Lines 40-57)

**Before**:
```python
def load_tasks() -> list[CrawlTask]:
    universities = storage.load_universities()
    tasks = []
    
    for university in universities:
        if not university.enabled:
            continue
        
        task = CrawlTask(
            university=university.name,  # <-- WRONG TYPE
            state=university.state,      # <-- FIELD DOESN'T EXIST
            start_url=university.website,  # <-- FIELD DOESN'T EXIST
            max_depth=config.max_depth,  # <-- WRONG FIELD NAME
            enabled=True,                # <-- FIELD DOESN'T EXIST
        )
        tasks.append(task)
    
    return tasks
```

**After**:
```python
def load_tasks() -> list[CrawlTask]:
    universities = storage.load_universities()
    tasks = []
    
    for university in universities:
        if not university.enabled:
            continue
        
        task = CrawlTask(
            university=university,      # <-- CORRECT: University object
            url=university.base_url,    # <-- CORRECT: URL string
            depth=0,                    # <-- CORRECT: Initial depth
        )
        tasks.append(task)
    
    return tasks
```

**Reason**: CrawlTask dataclass fields are (university: University, url: str, depth: int, parent_url: str = "").

#### Change 2: Fix execute() function (Lines 66-73)

**Before**:
```python
def execute(tasks: list[CrawlTask]):
    progress.start()
    
    for index, task in enumerate(tasks, start=1):
        logger.info(
            "[%d/%d] Crawling %s",
            index,
            len(tasks),
            task.university,  # <-- task.university is University object
        )
        
        crawler.run(task)  # <-- crawler.run() expects list[str] not CrawlTask
```

**After**:
```python
def execute(tasks: list[CrawlTask]):
    progress.start()
    
    for index, task in enumerate(tasks, start=1):
        logger.info(
            "[%d/%d] Crawling %s",
            index,
            len(tasks),
            task.university.name,  # <-- Access name attribute
        )
        
        crawler.run([task.url], resume=False)  # <-- Pass list of URLs
```

**Reason**: crawler.run(start_urls: list[str], resume: bool = False) signature.

---

## Summary of Changes by Type

### Indentation Errors (1)
- url_filter.py lines 42-62: Fixed class-level code moved into __init__

### Missing Imports (2)
- crawler.py: Added REPORTS_DIR
- storage.py: Added config

### Missing Methods (1)
- storage.py: Added load_universities()

### Attribute Name Mismatches (8)
- crawler.py: pages → pages_crawled, failed_pages → pages_failed, etc.
- progress.py: pages → pages_crawled, etc.

### Constructor/Signature Mismatches (2)
- Document constructor in crawler.py
- CrawlTask constructor in crawl.py

### Wrong Function Arguments (1)
- crawler.run() call in crawl.py

### Null Safety Improvements (2)
- storage.py save_download() and save_discovered_url()

### Lazy Initialization Pattern (1)
- url_filter.py: Added initialize() method

---

## CrawlStats Field Reference

Current fields in CrawlStats dataclass:
```python
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
```

---

## CrawlTask Field Reference

Current fields in CrawlTask dataclass:
```python
university: University      # Required
url: str                     # Required
depth: int                  # Required
parent_url: str = ""        # Optional
```

---

## Document Field Reference

Current fields in Document dataclass:
```python
university: str             # Required
url: str                    # Required
file_name: str             # Required
extension: str             # Required
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
```
