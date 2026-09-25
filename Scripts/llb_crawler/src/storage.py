"""
===============================================================================
LLB Knowledge Platform
storage.py

Storage manager for CSV, JSON and downloaded documents.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from threading import Lock

from src.constants import *
from src.logger import get_logger
from src.config import config

logger = get_logger(__name__)

###############################################################################
# STORAGE
###############################################################################


class Storage:

    def __init__(self):

        self.lock = Lock()

        self._create_directories()

###############################################################################
# DIRECTORIES
###############################################################################

    def _create_directories(self):

        for directory in REQUIRED_DIRS:

            Path(directory).mkdir(

                parents=True,

                exist_ok=True,

            )

###############################################################################
# JSON
###############################################################################

    def save_json(

        self,

        file: Path,

        data,

    ):

        with self.lock:

            with open(

                file,

                "w",

                encoding="utf-8",

            ) as fp:

                json.dump(

                    data,

                    fp,

                    indent=4,

                    ensure_ascii=False,

                )


    def load_json(

        self,

        file: Path,

        default=None,

    ):

        if not file.exists():

            return default

        with open(

            file,

            encoding="utf-8",

        ) as fp:

            return json.load(fp)

###############################################################################
# CSV
###############################################################################

    def append_csv(

        self,

        file: Path,

        row: dict,

    ):

        with self.lock:

            file_exists = file.exists()

            with open(

                file,

                "a",

                newline="",

                encoding="utf-8",

            ) as fp:

                writer = csv.DictWriter(

                    fp,

                    fieldnames=row.keys(),

                )

                if not file_exists:

                    writer.writeheader()

                writer.writerow(row)


###############################################################################
# TEXT
###############################################################################

    def append_text(

        self,

        file: Path,

        text: str,

    ):

        with self.lock:

            with open(

                file,

                "a",

                encoding="utf-8",

            ) as fp:

                fp.write(text)

                fp.write("\n")


###############################################################################
# FILE
###############################################################################

    def exists(

        self,

        file: Path,

    ) -> bool:

        return file.exists()


    def delete(

        self,

        file: Path,

    ):

        if file.exists():

            file.unlink()


###############################################################################
# DOWNLOAD DATABASE
###############################################################################

    def save_download(

        self,

        document,

    ):

        row = {

            "University": document.university or "",

            "DocumentType": document.document_type or "",

            "Semester": document.semester or "",

            "Subject": document.subject or "",

            "URL": document.url,

            "LocalPath": str(document.local_path) if document.local_path else "",

            "Downloaded": document.downloaded,

            "Size": document.file_size,

            "MD5": document.md5,

            "SHA256": document.sha256,

        }

        self.append_csv(

            DOWNLOAD_DATABASE,

            row,

        )


###############################################################################
# DISCOVERED URL
###############################################################################

    def save_discovered_url(

        self,

        page,

    ):

        row = {

            "URL": page.url,

            "Parent": page.parent_url or "",

            "Depth": page.depth,

            "Type": page.page_type or "",

            "Status": page.http_status,

        }

        self.append_csv(

            DISCOVERED_URLS,

            row,

        )
        ###############################################################################
# METADATA
###############################################################################

    def save_metadata(

        self,

        metadata,

    ):

        self.append_csv(

            METADATA_DATABASE,

            metadata,

        )


###############################################################################
# PROGRESS
###############################################################################

    def save_progress(

        self,

        progress: dict,

    ):

        self.save_json(

            PROGRESS_FILE,

            progress,

        )


    def load_progress(self):

        return self.load_json(

            PROGRESS_FILE,

            {},

        )


###############################################################################
# STATISTICS
###############################################################################

    def save_statistics(

        self,

        stats: dict,

    ):

        self.save_json(

            STATISTICS_FILE,

            stats,

        )


    def load_statistics(self):

        return self.load_json(

            STATISTICS_FILE,

            {},

        )


###############################################################################
# DUPLICATE CHECK
###############################################################################

    def load_downloaded_urls(self):

        urls = set()

        if not DOWNLOAD_DATABASE.exists():

            return urls

        with open(

            DOWNLOAD_DATABASE,

            newline="",

            encoding="utf-8",

        ) as fp:

            reader = csv.DictReader(fp)

            for row in reader:

                urls.add(

                    row.get(

                        "URL",

                        "",

                    )

                )

        return urls

###############################################################################
# LOAD UNIVERSITIES
###############################################################################

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


###############################################################################
# CACHE
###############################################################################

    def save_cache(

        self,

        name: str,

        data,

    ):

        file = CACHE_DIR / f"{name}.json"

        self.save_json(

            file,

            data,

        )


    def load_cache(

        self,

        name: str,

        default=None,

    ):

        file = CACHE_DIR / f"{name}.json"

        return self.load_json(

            file,

            default,

        )


###############################################################################
# BACKUP
###############################################################################

    def backup(

        self,

        source: Path,

    ):

        if not source.exists():

            return

        backup_dir = BACKUP_DIR

        backup_dir.mkdir(

            parents=True,

            exist_ok=True,

        )

        target = backup_dir / source.name

        target.write_bytes(

            source.read_bytes()

        )

        logger.info(

            "Backup created : %s",

            target,

        )


###############################################################################
# CLEAR CACHE
###############################################################################

    def clear_cache(self):

        if not CACHE_DIR.exists():

            return

        for file in CACHE_DIR.glob("*"):

            if file.is_file():

                file.unlink()


###############################################################################
# REPORT
###############################################################################

    def write_report(

        self,

        file: Path,

        lines: list[str],

    ):

        with open(

            file,

            "w",

            encoding="utf-8",

        ) as fp:

            fp.write(

                "\n".join(lines)

            )


###############################################################################
# SINGLETON
###############################################################################

storage = Storage()