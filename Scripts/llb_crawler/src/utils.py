"""
===============================================================================
LLB Knowledge Platform
utils.py

Common utility functions.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import hashlib
import mimetypes
import re
from pathlib import Path
from urllib.parse import urljoin
from urllib.parse import urlparse
from urllib.parse import urldefrag

###############################################################################
# URL HELPERS
###############################################################################

def normalize_url(url: str) -> str:
    """
    Normalize URL.
    """

    if not url:
        return ""

    url = urldefrag(url)[0]

    return url.strip()


def absolute_url(
    base_url: str,
    link: str,
) -> str:
    """
    Convert relative URL to absolute.
    """

    return normalize_url(
        urljoin(
            base_url,
            link,
        )
    )


def get_domain(
    url: str,
) -> str:
    """
    Return domain.
    """

    return urlparse(url).netloc.lower()


def get_scheme(
    url: str,
) -> str:

    return urlparse(url).scheme.lower()


###############################################################################
# FILE HELPERS
###############################################################################

def filename_from_url(
    url: str,
) -> str:

    return Path(
        urlparse(url).path
    ).name


def extension_from_url(
    url: str,
) -> str:

    return Path(
        urlparse(url).path
    ).suffix.lower()


def mime_type(
    filename: str,
) -> str:

    value, _ = mimetypes.guess_type(
        filename
    )

    return value or ""


###############################################################################
# HASH
###############################################################################

def md5_file(
    file: Path,
) -> str:

    h = hashlib.md5()

    with open(
        file,
        "rb",
    ) as fp:

        while True:

            chunk = fp.read(8192)

            if not chunk:
                break

            h.update(chunk)

    return h.hexdigest()


def sha256_file(
    file: Path,
) -> str:

    h = hashlib.sha256()

    with open(
        file,
        "rb",
    ) as fp:

        while True:

            chunk = fp.read(8192)

            if not chunk:
                break

            h.update(chunk)

    return h.hexdigest()


###############################################################################
# TEXT
###############################################################################

def clean_text(
    text: str,
) -> str:

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def contains_keyword(
    text: str,
    keywords: list[str],
) -> bool:

    text = text.lower()

    for keyword in keywords:

        if keyword.lower() in text:

            return True

    return False


###############################################################################
# SAFE CONVERSIONS
###############################################################################

def safe_int(
    value,
    default=0,
):

    try:
        return int(value)
    except Exception:
        return default


def safe_float(
    value,
    default=0.0,
):

    try:
        return float(value)
    except Exception:
        return default


###############################################################################
# FILE SIZE
###############################################################################

def human_size(
    size: int,
) -> str:

    units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB",
    ]

    value = float(size)

    for unit in units:

        if value < 1024:

            return f"{value:.2f} {unit}"

        value /= 1024

    return f"{value:.2f} PB"