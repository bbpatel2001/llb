"""
===============================================================================
LLB Knowledge Platform
config.py

Loads and validates all configuration files.

Author : Xeevi
Python : 3.13+

===============================================================================
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from src.constants import *

###############################################################################
# CONFIG MANAGER
###############################################################################

class Config:

    """
    Global configuration object.

    Example
    -------

    cfg = Config()

    cfg.universities
    cfg.keywords
    cfg.settings

    """

    def __init__(self):

        self.settings: dict[str, Any] = {}

        self.universities = pd.DataFrame()

        self.keywords = pd.DataFrame()

        self.ignore_domains = pd.DataFrame()

        self.file_extensions = pd.DataFrame()

        self.page_priority = pd.DataFrame()

        self.url_patterns = pd.DataFrame()

        self.document_types = pd.DataFrame()

        self.semester_patterns = pd.DataFrame()

        self.metadata_fields = pd.DataFrame()

        self.regex_patterns = pd.DataFrame()

        self.ignore_keywords = pd.DataFrame()

        self.ignore_paths = pd.DataFrame()

        self.keyword_list: list[str] = []

        self.ignore_domain_list: list[str] = []

        self.download_extensions: set[str] = set()

        self.url_pattern_list: list[str] = []

        self.ignore_keyword_list: list[str] = []

        self.ignore_path_list: list[str] = []

        self._loaded = False

###############################################################################
# FILE VALIDATION
###############################################################################

    @staticmethod
    def _validate_file(file: Path):

        if not file.exists():

            raise FileNotFoundError(file)

###############################################################################
# LOAD JSON
###############################################################################

    def _load_json(
        self,
        file: Path,
    ) -> dict:

        self._validate_file(file)

        with open(
            file,
            encoding="utf8",
        ) as fp:

            return json.load(fp)

###############################################################################
# LOAD CSV
###############################################################################

    def _load_csv(
        self,
        file: Path,
    ) -> pd.DataFrame:

        self._validate_file(file)

        return pd.read_csv(
            file,
            encoding=CSV_ENCODING,
        )

###############################################################################
# LOAD SETTINGS
###############################################################################

    def load_settings(self):

        self.settings = self._load_json(
            CRAWL_SETTINGS_FILE
        )

###############################################################################
# LOAD CSV FILES
###############################################################################

    def load_csv_files(self):

        self.universities = self._load_csv(
            UNIVERSITIES_FILE
        )

        self.keywords = self._load_csv(
            KEYWORDS_FILE
        )

        self.ignore_domains = self._load_csv(
            IGNORE_DOMAINS_FILE
        )

        self.file_extensions = self._load_csv(
            FILE_EXTENSIONS_FILE
        )

        self.page_priority = self._load_csv(
            PAGE_PRIORITY_FILE
        )

        self.url_patterns = self._load_csv(
            URL_PATTERNS_FILE
        )

        self.document_types = self._load_csv(
            DOCUMENT_TYPES_FILE
        )

        self.semester_patterns = self._load_csv(
            SEMESTER_PATTERNS_FILE
        )

        self.metadata_fields = self._load_csv(
            METADATA_FIELDS_FILE
        )

        self.regex_patterns = self._load_csv(
            REGEX_PATTERNS_FILE
        )

        self.ignore_keywords = self._load_csv(
            IGNORE_KEYWORDS_FILE
        )

        self.ignore_paths = self._load_csv(
            IGNORE_PATHS_FILE
        )

###############################################################################
# PUBLIC LOAD
###############################################################################

    def load(self):

        if self._loaded:
            return

        self.load_settings()

        self.load_csv_files()

        self.validate()

        self.build_cache()

        self._loaded = True

###############################################################################
# COUNTS
###############################################################################

    @property
    def university_count(self):

        return len(self.universities)

    @property
    def keyword_count(self):

        return len(self.keywords)

    @property
    def ignore_domain_count(self):

        return len(self.ignore_domains)

    @property
    def url_pattern_count(self):

        return len(self.url_patterns)

###############################################################################
# PRINT SUMMARY
###############################################################################

    def summary(self):

        print()

        print("=" * 70)

        print("Configuration Loaded")

        print("=" * 70)

        print(
            f"Universities      : {self.university_count}"
        )

        print(
            f"Keywords          : {self.keyword_count}"
        )

        print(
            f"Ignore Domains    : {self.ignore_domain_count}"
        )

        print(
            f"URL Patterns      : {self.url_pattern_count}"
        )

        print("=" * 70)

        print()

###############################################################################
# COLUMN VALIDATION
###############################################################################

    REQUIRED_COLUMNS = {
        "universities": [
            "University",
            "Type",
            "BaseURL",
            "CrawlDepth",
            "MaxPages",
            "Enabled",
        ],
        "keywords": [
            "Category",
            "Keyword",
            "Weight",
            "Enabled",
        ],
        "ignore_domains": [
            "Domain",
        ],
        "file_extensions": [
            "Extension",
            "Download",
        ],
        "page_priority": [
            "Pattern",
            "Priority",
        ],
        "url_patterns": [
            "Pattern",
            "Type",
            "Priority",
            "Recursive",
        ],
        "document_types": [
            "DocumentType",
            "Category",
            "Priority",
            "Download",
            "OCR",
            "Index",
            "Enabled",
        ],
        "semester_patterns": [
            "Semester",
            "Patterns",
        ],
        "metadata_fields": [
            "FieldName",
            "Source",
            "Required",
            "ExtractUsing",
            "Enabled",
        ],
        "regex_patterns": [
            "Field",
            "Pattern",
            "Priority",
        ],
        "ignore_keywords": ["keyword"],
        "ignore_paths": ["path"],
    }

###############################################################################
# VALIDATE DATAFRAME
###############################################################################

    def _validate_dataframe(
        self,
        name: str,
        dataframe: pd.DataFrame,
    ) -> None:

        expected = self.REQUIRED_COLUMNS.get(name, [])

        missing = [
            column
            for column in expected
            if column not in dataframe.columns
        ]

        if missing:

            raise ValueError(
                f"{name} is missing columns : {missing}"
            )

###############################################################################
# VALIDATE ALL CONFIGS
###############################################################################

    def validate(self):

        self._validate_dataframe(
            "universities",
            self.universities,
        )

        self._validate_dataframe(
            "keywords",
            self.keywords,
        )

        self._validate_dataframe(
            "ignore_domains",
            self.ignore_domains,
        )

        self._validate_dataframe(
            "file_extensions",
            self.file_extensions,
        )

        self._validate_dataframe(
            "page_priority",
            self.page_priority,
        )

        self._validate_dataframe(
            "url_patterns",
            self.url_patterns,
        )

        self._validate_dataframe(
            "document_types",
            self.document_types,
        )

        self._validate_dataframe(
            "semester_patterns",
            self.semester_patterns,
        )

        self._validate_dataframe(
            "metadata_fields",
            self.metadata_fields,
        )

        self._validate_dataframe(
            "regex_patterns",
            self.regex_patterns,
        )

        self._validate_dataframe(
            "ignore_keywords",
            self.ignore_keywords,
        )

        self._validate_dataframe(
            "ignore_paths",
            self.ignore_paths,
        )

###############################################################################
# YES / NO CONVERTER
###############################################################################

    @staticmethod
    def yes_no(value) -> bool:

        if pd.isna(value):
            return False

        value = str(value).strip().lower()

        return value in (
            "yes",
            "true",
            "1",
            "y",
        )

###############################################################################
# LOOKUP CACHE
###############################################################################

    def build_cache(self):

        self.keyword_list = (
            self.keywords["Keyword"]
            .dropna()
            .astype(str)
            .str.lower()
            .tolist()
        )

        self.ignore_domain_list = (
            self.ignore_domains["Domain"]
            .dropna()
            .astype(str)
            .str.lower()
            .tolist()
        )

        self.download_extensions = set(
            self.file_extensions
            .loc[
                self.file_extensions["Download"]
                .astype(str)
                .str.lower()
                == "yes"
            ]["Extension"]
            .astype(str)
            .str.lower()
            .apply(lambda value: value if value.startswith(".") else f".{value}")
            .tolist()
        )

        self.url_pattern_list = (
            self.url_patterns["Pattern"]
            .dropna()
            .astype(str)
            .str.lower()
            .tolist()
        )

        self.ignore_keyword_list = (
            self.ignore_keywords["keyword"]
            .dropna()
            .astype(str)
            .str.lower()
            .tolist()
        )

        self.ignore_path_list = (
            self.ignore_paths["path"]
            .dropna()
            .astype(str)
            .str.lower()
            .tolist()
        )

###############################################################################
# SETTINGS
###############################################################################

    def get_setting(
        self,
        key,
        default=None,
    ):

        return self.settings.get(
            key,
            default,
        )

###############################################################################
# HELPERS
###############################################################################

    def is_downloadable(
        self,
        extension: str,
    ) -> bool:

        return (
            extension.lower()
            in self.download_extensions
        )

    def is_ignored_domain(
        self,
        domain: str,
    ) -> bool:

        domain = domain.lower()

        for ignore in self.ignore_domain_list:

            if ignore in domain:
                return True

        return False

    def keyword_exists(
        self,
        word: str,
    ) -> bool:

        return (
            word.lower()
            in self.keyword_list
        )

###############################################################################
# CONVENIENCE METHODS
###############################################################################

    def reload(self):
        self._loaded = False
        self.load()

    def get_universities(self):
        if "Enabled" not in self.universities.columns:
            return self.universities
        enabled = self.universities["Enabled"].astype(str).str.lower().isin(["yes", "true", "1", "y"])
        return self.universities.loc[enabled].reset_index(drop=True)

    def get_crawl_setting(self, key, default=None):
        return self.get_setting(key, default)

    def get_extensions(self):
        return self.download_extensions

    def get_ignore_domains(self):
        return self.ignore_domain_list

    def get_keywords(self):
        return self.keyword_list

    def get_url_patterns(self):
        return self.url_pattern_list

    def __repr__(self):
        return f"<Config universities={len(self.universities)} keywords={len(self.keywords)} loaded={self._loaded}>"

    ###############################################################################
    # COMMON SETTINGS
    ###############################################################################

    @property
    def allowed_domains(self):
        return self.get_setting("allowed_domains", [])

    @property
    def max_depth(self):
        return self.get_setting("max_depth", 5)

    @property
    def max_pages(self):
        return self.get_setting("max_pages", 10000)

    @property
    def request_timeout(self):
        return self.get_setting("request_timeout", 30)

    @property
    def verify_ssl(self):
        return self.get_setting("verify_ssl", True)

    @property
    def follow_redirects(self):
        return self.get_setting("follow_redirects", True)

    @property
    def ignore_query_string(self):
        return self.get_setting("ignore_query_string", True)

    @property
    def retry_count(self):
        return self.get_setting("retry_count", 3)

    @property
    def retry_delay(self):
        return self.get_setting("retry_delay", 5)

    @property
    def delay_between_requests(self):
        return self.get_setting("delay_between_requests", 1)

    @property
    def start_urls(self):
        return self.get_setting("start_urls", [])

    @property
    def user_agent(self):
        return self.get_setting(
            "user_agent",
            "LLB-Crawler/1.0",
        )

###############################################################################
# SINGLETON
###############################################################################

config = Config()
