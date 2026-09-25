"""
===============================================================================
LLB KNOWLEDGE PLATFORM
University Crawler
Version : 0.1
Part    : 1
Author  : ChatGPT

Purpose
-------
Loads configuration
Creates folders
Initializes crawler state
Loads all config files
Creates logger

===============================================================================
"""

from __future__ import annotations

import os
import re
import csv
import json
import time
import hashlib
import logging
import threading

from pathlib import Path
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlparse

import pandas as pd

import requests

from bs4 import BeautifulSoup

from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import as_completed

###########################################################################
# FOLDERS
###########################################################################

ROOT = Path(__file__).parent

CONFIG = ROOT / "config"

OUTPUT = ROOT / "output"

DOWNLOADS = ROOT / "downloads"

LOGS = ROOT / "logs"

CACHE = ROOT / "cache"

TEXT = ROOT / "text"

for folder in [
    OUTPUT,
    DOWNLOADS,
    LOGS,
    CACHE,
    TEXT,
]:
    folder.mkdir(exist_ok=True)

###########################################################################
# LOGGER
###########################################################################

logger = logging.getLogger("crawler")

logger.setLevel(logging.INFO)

formatter = logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(message)s"
)

file_handler = logging.FileHandler(
    LOGS / "crawler.log",
    encoding="utf8",
)

file_handler.setFormatter(formatter)

console = logging.StreamHandler()

console.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(console)

###########################################################################
# CONFIG
###########################################################################

SETTINGS_FILE = CONFIG / "crawl_settings.json"

if not SETTINGS_FILE.exists():
    raise FileNotFoundError(SETTINGS_FILE)

with open(SETTINGS_FILE, encoding="utf8") as fp:
    SETTINGS = json.load(fp)

###########################################################################
# CSV FILES
###########################################################################

CSV_FILES = {
    "universities": CONFIG / "universities.csv",
    "keywords": CONFIG / "keywords.csv",
    "ignore_domains": CONFIG / "ignore_domains.csv",
    "file_extensions": CONFIG / "file_extensions.csv",
    "page_priority": CONFIG / "page_priority.csv",
    "url_patterns": CONFIG / "url_patterns.csv",
    "document_types": CONFIG / "document_types.csv",
    "semester_patterns": CONFIG / "semester_patterns.csv",
    "metadata_fields": CONFIG / "metadata_fields.csv",
    "regex_patterns": CONFIG / "regex_patterns.csv",
}

###########################################################################
# LOAD CSV
###########################################################################

def load_csv(path: Path) -> pd.DataFrame:

    if not path.exists():
        raise FileNotFoundError(path)

    df = pd.read_csv(path)

    logger.info("Loaded %-25s %5d rows", path.name, len(df))

    return df


###########################################################################
# LOAD ALL CONFIG
###########################################################################

CONFIG_DATA = {}

for name, file in CSV_FILES.items():
    CONFIG_DATA[name] = load_csv(file)

###########################################################################
# DATA CLASSES
###########################################################################

@dataclass
class University:

    name: str

    type: str

    base_url: str

    crawl_depth: int

    max_pages: int

    enabled: bool


@dataclass
class CrawlPage:

    url: str

    title: str = ""

    depth: int = 0

    parent: str = ""

    status: str = ""

    page_type: str = ""

    http_status: int = 0


@dataclass
class CrawlStats:

    pages_crawled: int = 0

    urls_discovered: int = 0

    pdf_found: int = 0

    failed: int = 0

    skipped: int = 0

###########################################################################
# GLOBAL STATE
###########################################################################

visited_urls = set()

queued_urls = set()

pdf_urls = set()

documents = []

pages = []

stats = CrawlStats()

lock = threading.Lock()

###########################################################################
# LOAD UNIVERSITIES
###########################################################################

universities = []

df = CONFIG_DATA["universities"]

for _, row in df.iterrows():

    enabled = str(row["Enabled"]).lower() == "yes"

    if not enabled:
        continue

    universities.append(
        University(
            name=row["University"],
            type=row["Type"],
            base_url=row["BaseURL"],
            crawl_depth=int(row["CrawlDepth"]),
            max_pages=int(row["MaxPages"]),
            enabled=enabled,
        )
    )

logger.info("")
logger.info("=" * 70)
logger.info("Universities Loaded : %d", len(universities))
logger.info("=" * 70)

###########################################################################
# IGNORE DOMAINS
###########################################################################

IGNORE_DOMAINS = set(
    CONFIG_DATA["ignore_domains"]["Domain"]
    .astype(str)
    .str.lower()
)

###########################################################################
# FILE EXTENSIONS
###########################################################################

DOWNLOAD_EXTENSIONS = set(
    CONFIG_DATA["file_extensions"]
    .loc[
        CONFIG_DATA["file_extensions"]["Download"] == "Yes",
        "Extension",
    ]
    .astype(str)
    .str.lower()
)

###########################################################################
# KEYWORDS
###########################################################################

KEYWORDS = (
    CONFIG_DATA["keywords"]["Keyword"]
    .astype(str)
    .str.lower()
    .tolist()
)

###########################################################################
# URL PATTERNS
###########################################################################

URL_PATTERNS = (
    CONFIG_DATA["url_patterns"]["Pattern"]
    .astype(str)
    .str.lower()
    .tolist()
)

###########################################################################
# STARTUP
###########################################################################

logger.info("Keywords           : %d", len(KEYWORDS))
logger.info("Ignore Domains     : %d", len(IGNORE_DOMAINS))
logger.info("Extensions         : %d", len(DOWNLOAD_EXTENSIONS))
logger.info("URL Patterns       : %d", len(URL_PATTERNS))

logger.info("")
logger.info("Initialization Complete")
logger.info("Ready to Crawl.")
logger.info("")
###########################################################################
# HTTP SESSION
###########################################################################

from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry_strategy = Retry(
    total=3,
    connect=3,
    read=3,
    status=3,
    backoff_factor=2,
    status_forcelist=[
        429,
        500,
        502,
        503,
        504,
    ],
    allowed_methods=[
        "GET",
        "HEAD",
    ],
)

adapter = HTTPAdapter(
    max_retries=retry_strategy,
    pool_connections=20,
    pool_maxsize=20,
)

session = requests.Session()

session.mount("http://", adapter)
session.mount("https://", adapter)

session.headers.update({
    "User-Agent": SETTINGS["user_agent"],
})

###########################################################################
# URL HELPERS
###########################################################################

INVALID_SCHEMES = (
    "javascript:",
    "mailto:",
    "tel:",
    "#",
)

def normalize_url(url: str) -> str:

    url = url.strip()

    if "#" in url:
        url = url.split("#")[0]

    return url.rstrip("/")


def is_valid_scheme(url: str) -> bool:

    url = url.lower()

    for s in INVALID_SCHEMES:
        if url.startswith(s):
            return False

    return True


def get_domain(url: str) -> str:

    return urlparse(url).netloc.lower()


def is_same_domain(base_url: str, target_url: str) -> bool:

    return get_domain(base_url) == get_domain(target_url)


def ignored_domain(url: str) -> bool:

    domain = get_domain(url)

    for ignore in IGNORE_DOMAINS:

        if ignore in domain:
            return True

    return False


###########################################################################
# FILE TYPE
###########################################################################

def file_extension(url: str) -> str:

    path = urlparse(url).path

    if "." not in path:
        return ""

    return path.split(".")[-1].lower()


def downloadable(url: str) -> bool:

    ext = file_extension(url)

    return ext in DOWNLOAD_EXTENSIONS


###########################################################################
# PAGE CLASSIFICATION
###########################################################################

def classify_page(url: str) -> str:

    lower = url.lower()

    for pattern in URL_PATTERNS:

        if pattern in lower:
            return pattern

    return "page"


###########################################################################
# SAVE DISCOVERED URL
###########################################################################

DISCOVERED_FILE = OUTPUT / "discovered_urls.csv"

if not DISCOVERED_FILE.exists():

    with open(
        DISCOVERED_FILE,
        "w",
        newline="",
        encoding="utf8",
    ) as fp:

        writer = csv.writer(fp)

        writer.writerow([
            "University",
            "URL",
            "Parent",
            "Depth",
            "PageType",
            "HTTPStatus",
        ])


def save_discovered(
    university: str,
    page: CrawlPage,
):

    with lock:

        with open(
            DISCOVERED_FILE,
            "a",
            newline="",
            encoding="utf8",
        ) as fp:

            writer = csv.writer(fp)

            writer.writerow([
                university,
                page.url,
                page.parent,
                page.depth,
                page.page_type,
                page.http_status,
            ])


###########################################################################
# DOWNLOAD PAGE
###########################################################################

def fetch(url: str):

    try:

        r = session.get(
            url,
            timeout=SETTINGS["request_timeout"],
            allow_redirects=True,
        )

        return r

    except Exception as ex:

        logger.error("%s -> %s", url, ex)

        stats.failed += 1

        return None


###########################################################################
# LINK EXTRACTION
###########################################################################

def extract_links(
    html: str,
    current_url: str,
):

    soup = BeautifulSoup(
        html,
        "lxml",
    )

    urls = []

    for tag in soup.find_all("a", href=True):

        href = tag["href"].strip()

        if not href:
            continue

        if not is_valid_scheme(href):
            continue

        absolute = urljoin(
            current_url,
            href,
        )

        absolute = normalize_url(absolute)

        urls.append(absolute)

    return list(set(urls))


###########################################################################
# FILTER LINKS
###########################################################################

def filter_links(
    base_url: str,
    links: list[str],
):

    result = []

    for link in links:

        if ignored_domain(link):
            continue

        if not is_same_domain(
            base_url,
            link,
        ):
            continue

        result.append(link)

    return result


###########################################################################
# VISITED
###########################################################################

def already_seen(url: str):

    with lock:

        if url in visited_urls:
            return True

        visited_urls.add(url)

        return False


###########################################################################
# PAGE PROCESSOR
###########################################################################

def process_page(
    university: University,
    url: str,
    depth: int,
    parent: str,
):

    if depth > university.crawl_depth:
        return []

    if already_seen(url):
        return []

    response = fetch(url)

    if response is None:
        return []

    stats.pages_crawled += 1

    page = CrawlPage(
        url=url,
        parent=parent,
        depth=depth,
        http_status=response.status_code,
        page_type=classify_page(url),
    )

    save_discovered(
        university.name,
        page,
    )

    if downloadable(url):

        pdf_urls.add(url)

        stats.pdf_found += 1

        return []

    ctype = response.headers.get(
        "Content-Type",
        "",
    ).lower()

    if "html" not in ctype:
        return []

    links = extract_links(
        response.text,
        url,
    )

    links = filter_links(
        university.base_url,
        links,
    )

    stats.urls_discovered += len(links)

    return links