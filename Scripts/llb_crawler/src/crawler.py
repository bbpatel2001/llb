"""
===============================================================================
LLB Knowledge Platform
crawler.py

Main crawling engine.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

from collections import deque

from src.config import config
from src.downloader import downloader
from src.logger import get_logger
from src.models import (
    CrawlStats,
    Document,
    Page,
)
from src.parser import parser
from src.session import http
from src.storage import storage
from src.url_filter import url_filter
from src.relevance import relevance_scorer
from src.constants import REPORTS_DIR

logger = get_logger(__name__)


###############################################################################
# CRAWLER
###############################################################################

class Crawler:

    def __init__(self):

        self.queue = deque()

        self.stats = CrawlStats()

        self.running = False


###############################################################################
# QUEUE
###############################################################################

    def add_url(

        self,

        url: str,

        depth: int = 0,

        parent: str = "",

    ):

        if not url_filter.should_crawl(

            url,

            depth,

        ):

            return

        self.queue.append(

            Page(

                url=url,

                parent_url=parent,

                depth=depth,

            )

        )

        url_filter.mark_visited(

            url,

        )


###############################################################################
# START
###############################################################################

    def start(

        self,

        start_urls: list[str],

    ):

        self.running = True

        logger.info(

            "Crawler started"

        )

        for url in start_urls:

            self.add_url(

                url,

                0,

            )


###############################################################################
# NEXT PAGE
###############################################################################

    def next_page(

        self,

    ) -> Page | None:

        if not self.queue:

            return None

        return self.queue.popleft()


###############################################################################
# FETCH
###############################################################################

    def fetch(

        self,

        page: Page,

    ) -> str | None:

        response = http.get(

            page.url,

        )

        if response is None:

            self.stats.pages_failed += 1

            return None

        page.http_status = response.status_code

        self.stats.pages_crawled += 1

        return response.text


###############################################################################
# DISCOVER LINKS
###############################################################################

    def discover_links(

        self,

        html: str,

        page: Page,

    ):

        links = parser.links(

            html,

            page.url,

        )

        for url in links:

            if not relevance_scorer.should_crawl(url):

                continue

            self.add_url(

                url,

                page.depth + 1,

                page.url,

            )


###############################################################################
# DISCOVER DOCUMENTS
###############################################################################

    def discover_documents(

        self,

        html: str,

        page: Page,

    ):

        links = parser.document_links(

            html,

            page.url,

        )

        for url in links:

            from src.utils import filename_from_url

            filename = filename_from_url(url) or "document"

            if not relevance_scorer.should_download(url, filename):

                logger.debug("Skipped (low relevance): %s", url)

                continue

            document = Document(

                university="",

                url=url,

                file_name=filename,

                extension=url.split(".")[-1] if "." in url else "",

            )

            downloader.download_document(

                document,

            )

            self.stats.documents_found += 1

        ###############################################################################
# ANALYZE PAGE
###############################################################################

    def analyze_page(

        self,

        html: str,

        page: Page,

    ) -> dict:

        data = parser.analyze(

            html,

            page.url,

        )

        page.title = data.get(

            "title",

            "",

        )

        page.page_type = data.get(

            "document_type",

            "",

        )

        storage.save_discovered_url(

            page,

        )

        return data


###############################################################################
# PROCESS PAGE
###############################################################################

    def process_page(

        self,

        page: Page,

    ):

        html = self.fetch(

            page,

        )

        if html is None:

            return

        analysis = self.analyze_page(

            html,

            page,

        )

        self.discover_links(

            html,

            page,

        )

        self.discover_documents(

            html,

            page,

        )

        self.stats.urls_discovered += len(

            analysis.get(

                "links",

                [],

            )

        )

        self.stats.urls_discovered += len(

            analysis.get(

                "images",

                [],

            )

        )


###############################################################################
# MAIN LOOP
###############################################################################

    def crawl(self):

        while self.running:

            page = self.next_page()

            if page is None:

                break

            logger.info(

                "Crawling [%d] %s",

                page.depth,

                page.url,

            )

            try:

                self.process_page(

                    page,

                )

            except Exception as ex:

                logger.exception(

                    "Crawler error : %s",

                    ex,

                )

                self.stats.pages_failed += 1

        logger.info(

            "Crawler finished."

        )


###############################################################################
# SAVE PROGRESS
###############################################################################

    def save_progress(self):

        storage.save_progress(

            {

                "queue": [

                    {

                        "url": page.url,

                        "parent": page.parent_url,

                        "depth": page.depth,

                    }

                    for page in self.queue

                ],

                "visited": list(

                    url_filter.visited

                ),

            }

        )


###############################################################################
# LOAD PROGRESS
###############################################################################

    def load_progress(self):

        progress = storage.load_progress()

        if not progress:

            return

        self.queue.clear()

        url_filter.clear()

        for item in progress.get(

            "queue",

            [],

        ):

            self.queue.append(

                Page(

                    url=item["url"],

                    parent_url=item.get(

                        "parent",

                        "",

                    ),

                    depth=item.get(

                        "depth",

                        0,

                    ),

                )

            )

        for url in progress.get(

            "visited",

            [],

        ):

            url_filter.mark_visited(

                url,

            )


###############################################################################
# STOP
###############################################################################

    def stop(self):

        self.running = False

        self.save_progress()

        logger.info(

            "Crawler stopped."

        )

    ###############################################################################
# SUMMARY
###############################################################################

    def summary(

        self,

    ) -> dict:

        download_stats = downloader.statistics()

        return {

            "pages_crawled": self.stats.pages_crawled,

            "pages_failed": self.stats.pages_failed,

            "documents_found": self.stats.documents_found,

            "urls_discovered": self.stats.urls_discovered,

            "queue_remaining": len(self.queue),

            "visited_urls": url_filter.visited_count(),

            "downloaded_files": download_stats["files"],

            "downloaded_bytes": download_stats["bytes"],

        }


###############################################################################
# REPORT
###############################################################################

    def write_report(

        self,

    ):

        summary = self.summary()

        lines = [

            "=" * 70,

            "LLB KNOWLEDGE PLATFORM",

            "CRAWLER REPORT",

            "=" * 70,

            "",

        ]

        for key, value in summary.items():

            lines.append(

                f"{key:25} : {value}"

            )

        storage.write_report(

            REPORTS_DIR / "crawl_report.txt",

            lines,

        )

        logger.info(

            "Report written."

        )


###############################################################################
# RESET
###############################################################################

    def reset(

        self,

    ):

        self.queue.clear()

        url_filter.reset()

        self.stats = CrawlStats()

        self.running = False


###############################################################################
# RUN
###############################################################################

    def run(

        self,

        start_urls: list[str],

        resume: bool = False,

    ):

        self.reset()

        if resume:

            logger.info(

                "Loading previous crawl..."

            )

            self.load_progress()

            self.running = True

        else:

            self.start(

                start_urls,

            )

        self.crawl()

        self.write_report()

        storage.save_statistics(

            self.summary(),

        )


###############################################################################
# SHUTDOWN
###############################################################################

    def shutdown(

        self,

    ):

        self.stop()

        http.close()

        logger.info(

            "Crawler shutdown complete."

        )


###############################################################################
# SINGLETON
###############################################################################

crawler = Crawler()