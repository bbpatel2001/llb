"""
===============================================================================
LLB Knowledge Platform
metadata.py

Document metadata extraction.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import re
from pathlib import Path

from src.constants import (
    DOCUMENT_TYPES,
    SUBJECTS,
    UNIVERSITIES,
)
from src.logger import get_logger

logger = get_logger(__name__)


###############################################################################
# METADATA
###############################################################################

class MetadataExtractor:

    def __init__(self):
        pass


###############################################################################
# NORMALIZE
###############################################################################

    def normalize(

        self,

        text: str,

    ) -> str:

        if not text:

            return ""

        return " ".join(text.split())


###############################################################################
# UNIVERSITY
###############################################################################

    def university(

        self,

        text: str,

    ) -> str:

        value = text.lower()

        for university in UNIVERSITIES:

            if university.lower() in value:

                return university

        return ""


###############################################################################
# SUBJECT
###############################################################################

    def subject(

        self,

        text: str,

    ) -> str:

        value = text.lower()

        for subject in SUBJECTS:

            if subject.lower() in value:

                return subject

        return ""


###############################################################################
# DOCUMENT TYPE
###############################################################################

    def document_type(

        self,

        text: str,

    ) -> str:

        value = text.lower()

        for doc_type in DOCUMENT_TYPES:

            if doc_type.lower() in value:

                return doc_type

        return ""


###############################################################################
# SEMESTER
###############################################################################

    def semester(

        self,

        text: str,

    ) -> str:

        match = re.search(

            r"(semester|sem)[\s\-:]*([1-9]|i|ii|iii|iv|v|vi|vii|viii|ix|x)",

            text,

            re.IGNORECASE,

        )

        if match:

            return match.group(2).upper()

        return ""


###############################################################################
# YEAR
###############################################################################

    def year(

        self,

        text: str,

    ) -> str:

        match = re.search(

            r"(19|20)\d{2}",

            text,

        )

        if match:

            return match.group(0)

        return ""


###############################################################################
# FILE NAME
###############################################################################

    def filename(

        self,

        url: str,

    ) -> str:

        return Path(url).name


###############################################################################
# FILE EXTENSION
###############################################################################

    def extension(

        self,

        url: str,

    ) -> str:

        return Path(url).suffix.lower()


###############################################################################
# EXTRACT
###############################################################################

    def extract(

        self,

        url: str,

        title: str = "",

        text: str = "",

    ) -> dict:

        combined = self.normalize(

            f"{url} {title} {text}"

        )

        return {

            "filename": self.filename(url),

            "extension": self.extension(url),

            "university": self.university(combined),

            "subject": self.subject(combined),

            "semester": self.semester(combined),

            "document_type": self.document_type(combined),

            "year": self.year(combined),

        }


###############################################################################
# SINGLETON
###############################################################################

metadata = MetadataExtractor()