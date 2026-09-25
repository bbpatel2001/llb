"""
===============================================================================
LLB Knowledge Platform

crawl.py

Main Application Entry Point

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import sys

from src.config import config
from src.crawler import crawler
from src.logger import get_logger
from src.models import CrawlTask
from src.progress import progress
from src.storage import storage

logger = get_logger(__name__)


###############################################################################
# INITIALIZATION
###############################################################################

def initialize():

    logger.info("=" * 80)
    logger.info("LLB KNOWLEDGE PLATFORM")
    logger.info("Crawler Starting...")
    logger.info("=" * 80)

    config.load()


###############################################################################
# LOAD UNIVERSITIES
###############################################################################

def load_tasks() -> list[CrawlTask]:

    universities = storage.load_universities()

    tasks = []

    for university in universities:

        if not university.enabled:

            continue

        task = CrawlTask(

            university=university,

            url=university.base_url,

            depth=0,

        )

        tasks.append(task)

    logger.info(

        "%d universities loaded.",

        len(tasks),

    )

    return tasks


###############################################################################
# EXECUTE
###############################################################################

def execute(tasks: list[CrawlTask]):

    progress.start()

    for index, task in enumerate(tasks, start=1):

        logger.info(

            "[%d/%d] Crawling %s",

            index,

            len(tasks),

            task.university.name,

        )

        crawler.run([task.url], resume=False)


###############################################################################
# SHUTDOWN
###############################################################################

def shutdown():

    crawler.shutdown()

    logger.info("Crawler finished.")


###############################################################################
# MAIN
###############################################################################

def main() -> int:

    try:

        initialize()

        tasks = load_tasks()

        if not tasks:

            logger.error(

                "No enabled universities found."

            )

            return 1

        execute(tasks)

        shutdown()

        return 0

    except KeyboardInterrupt:

        logger.warning(

            "Interrupted by user."

        )

        shutdown()

        return 130

    except Exception:

        logger.exception(

            "Fatal error."

        )

        shutdown()

        return 1


###############################################################################
# ENTRY POINT
###############################################################################

if __name__ == "__main__":

    sys.exit(

        main()

    )