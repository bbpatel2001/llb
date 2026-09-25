"""
===============================================================================
LLB Knowledge Platform
logger.py

Central logging configuration.

Every module should import the logger from here instead of creating its own.

Example
-------
from src.logger import get_logger

logger = get_logger(__name__)
logger.info("Crawler started")
===============================================================================
"""

from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from src.constants import (
    LOG_DIR,
    CRAWLER_LOG,
    ERROR_LOG,
    LINE,
)

###############################################################################
# CREATE LOG DIRECTORY
###############################################################################

LOG_DIR.mkdir(parents=True, exist_ok=True)

###############################################################################
# FORMATTERS
###############################################################################

DEFAULT_FORMAT = (
    "%(asctime)s | "
    "%(levelname)-8s | "
    "%(name)-20s | "
    "%(message)s"
)

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

formatter = logging.Formatter(
    DEFAULT_FORMAT,
    DATE_FORMAT,
)

###############################################################################
# ROOT LOGGER CONFIGURATION
###############################################################################

_initialized = False


def setup_logging(level: int = logging.INFO) -> None:
    """
    Configure application logging.

    Safe to call multiple times.
    """

    global _initialized

    if _initialized:
        return

    root = logging.getLogger()

    root.setLevel(level)

    root.handlers.clear()

    ###########################################################################
    # Console
    ###########################################################################

    console = logging.StreamHandler()

    console.setLevel(level)

    console.setFormatter(formatter)

    root.addHandler(console)

    ###########################################################################
    # Main Log File
    ###########################################################################

    file_handler = RotatingFileHandler(
        CRAWLER_LOG,
        maxBytes=10 * 1024 * 1024,     # 10 MB
        backupCount=10,
        encoding="utf-8",
    )

    file_handler.setLevel(level)

    file_handler.setFormatter(formatter)

    root.addHandler(file_handler)

    ###########################################################################
    # Error Log
    ###########################################################################

    error_handler = RotatingFileHandler(
        ERROR_LOG,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )

    error_handler.setLevel(logging.ERROR)

    error_handler.setFormatter(formatter)

    root.addHandler(error_handler)

    _initialized = True


###############################################################################
# LOGGER FACTORY
###############################################################################

def get_logger(name: str) -> logging.Logger:
    """
    Return a configured logger.

    Example
    -------
    logger = get_logger(__name__)
    """

    if not _initialized:
        setup_logging()

    return logging.getLogger(name)


###############################################################################
# BANNER
###############################################################################

def print_banner(logger: logging.Logger) -> None:

    logger.info(LINE)
    logger.info("LLB Knowledge Platform")
    logger.info("University Crawler")
    logger.info(LINE)


###############################################################################
# EXCEPTION LOGGER
###############################################################################

def log_exception(
    logger: logging.Logger,
    ex: Exception,
    message: str = "",
) -> None:
    """
    Log an exception with traceback.
    """

    if message:
        logger.exception("%s : %s", message, ex)
    else:
        logger.exception(ex)


###############################################################################
# SHUTDOWN
###############################################################################

def shutdown_logging() -> None:
    """
    Flush and close all handlers.
    """

    logging.shutdown()