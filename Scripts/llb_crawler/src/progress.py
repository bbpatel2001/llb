"""
===============================================================================
LLB Knowledge Platform
progress.py

Progress reporting utilities.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import time
from dataclasses import asdict

from src.logger import get_logger

logger = get_logger(__name__)


###############################################################################
# PROGRESS
###############################################################################

class Progress:

    def __init__(self):

        self.start_time = time.time()

        self.last_display = 0

        self.display_interval = 2

        self.current_url = ""

        self.current_depth = 0

###############################################################################
# START
###############################################################################

    def start(self):

        self.start_time = time.time()

        logger.info("Crawler started")


###############################################################################
# UPDATE
###############################################################################

    def update(

        self,

        url: str,

        depth: int,

    ):

        self.current_url = url

        self.current_depth = depth


###############################################################################
# ELAPSED
###############################################################################

    @property
    def elapsed(self) -> float:

        return time.time() - self.start_time


###############################################################################
# DISPLAY
###############################################################################

    def display(

        self,

        stats,

    ):

        now = time.time()

        if now - self.last_display < self.display_interval:

            return

        self.last_display = now

        logger.info(
            "Pages=%d  Docs=%d  Failed=%d  Queue=%d  Elapsed=%ds",
            stats.pages_crawled,
            stats.documents_found,
            stats.pages_failed,
            0,
            int(self.elapsed),
        )

        if self.current_url:

            logger.info(
                "Depth=%d  URL=%s",
                self.current_depth,
                self.current_url,
            )


###############################################################################
# SUMMARY
###############################################################################

    def summary(

        self,

        stats,

    ) -> dict:

        data = asdict(stats)

        data["elapsed_seconds"] = round(

            self.elapsed,

            2,

        )

        return data


###############################################################################
# PRINT SUMMARY
###############################################################################

    def print_summary(

        self,

        stats,

    ):

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

            logger.info(

                "%-25s : %s",

                key,

                value,

            )

        logger.info("=" * 70)


###############################################################################
# RESET
###############################################################################

    def reset(self):

        self.start_time = time.time()

        self.last_display = 0

        self.current_url = ""

        self.current_depth = 0


###############################################################################
# SINGLETON
###############################################################################

progress = Progress()