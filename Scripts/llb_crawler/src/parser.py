"""
===============================================================================
LLB Knowledge Platform
parser.py

HTML parser and document detection.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import re
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from src.constants import *
from src.logger import get_logger
from src.utils import (
    absolute_url,
    clean_text,
)

logger = get_logger(__name__)


###############################################################################
# PARSER
###############################################################################

class Parser:

    def __init__(self):

        self.parser = "html.parser"


###############################################################################
# HTML
###############################################################################

    def soup(

        self,

        html: str,

    ) -> BeautifulSoup:

        return BeautifulSoup(

            html,

            self.parser,

        )


###############################################################################
# TITLE
###############################################################################

    def title(

        self,

        html: str,

    ) -> str:

        soup = self.soup(html)

        if soup.title:

            return clean_text(

                soup.title.get_text()

            )

        return ""


###############################################################################
# PAGE TEXT
###############################################################################

    def text(

        self,

        html: str,

    ) -> str:

        soup = self.soup(html)

        return clean_text(

            soup.get_text(

                separator=" "

            )

        )


###############################################################################
# LINKS
###############################################################################

    def links(

        self,

        html: str,

        base_url: str,

    ) -> list[str]:

        soup = self.soup(html)

        results = []

        for tag in soup.find_all(

            "a",

            href=True,

        ):

            href = tag["href"].strip()

            if not href:

                continue

            url = absolute_url(

                base_url,

                href,

            )

            results.append(

                url

            )

        return list(

            dict.fromkeys(results)

        )


###############################################################################
# IMAGES
###############################################################################

    def images(

        self,

        html: str,

        base_url: str,

    ) -> list[str]:

        soup = self.soup(html)

        results = []

        for img in soup.find_all(

            "img",

            src=True,

        ):

            url = absolute_url(

                base_url,

                img["src"],

            )

            results.append(

                url

            )

        return list(

            dict.fromkeys(results)

        )


###############################################################################
# DOCUMENT LINKS
###############################################################################

    def document_links(

        self,

        html: str,

        base_url: str,

    ) -> list[str]:

        soup = self.soup(html)

        documents = []

        for tag in soup.find_all(

            "a",

            href=True,

        ):

            href = tag["href"]

            url = absolute_url(

                base_url,

                href,

            )

            lower = url.lower()

            if lower.endswith(

                DOCUMENT_EXTENSIONS

            ):

                documents.append(

                    url

                )

        return list(

            dict.fromkeys(documents)

        )


###############################################################################
# EMAILS
###############################################################################

    def emails(

        self,

        html: str,

    ) -> list[str]:

        text = self.text(html)

        return sorted(

            set(

                re.findall(

                    EMAIL_REGEX,

                    text,

                )

            )

        )


###############################################################################
# PHONE NUMBERS
###############################################################################

    def phones(

        self,

        html: str,

    ) -> list[str]:

        text = self.text(html)

        return sorted(

            set(

                re.findall(

                    PHONE_REGEX,

                    text,

                )

            )

        )

    ###############################################################################
# META TAGS
###############################################################################

    def meta_tags(

        self,

        html: str,

    ) -> dict[str, str]:

        soup = self.soup(html)

        metadata = {}

        for tag in soup.find_all("meta"):

            key = tag.get("name") or tag.get("property")

            value = tag.get("content")

            if key and value:

                metadata[key.strip().lower()] = clean_text(value)

        return metadata


###############################################################################
# HEADINGS
###############################################################################

    def headings(

        self,

        html: str,

    ) -> dict[str, list[str]]:

        soup = self.soup(html)

        result = {}

        for level in range(1, 7):

            tag = f"h{level}"

            result[tag] = [

                clean_text(node.get_text())

                for node in soup.find_all(tag)

                if clean_text(node.get_text())

            ]

        return result


###############################################################################
# TABLES
###############################################################################

    def tables(

        self,

        html: str,

    ) -> list[list[list[str]]]:

        soup = self.soup(html)

        tables = []

        for table in soup.find_all("table"):

            rows = []

            for tr in table.find_all("tr"):

                cols = [

                    clean_text(td.get_text())

                    for td in tr.find_all(

                        ["td", "th"]

                    )

                ]

                if cols:

                    rows.append(cols)

            if rows:

                tables.append(rows)

        return tables


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
# DOCUMENT TYPE
###############################################################################

    def document_type(

        self,

        text: str,

    ) -> str:

        value = text.lower()

        for item in DOCUMENT_TYPES:

            if item.lower() in value:

                return item

        return ""


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
# FILE INFORMATION
###############################################################################

    def file_information(

        self,

        url: str,

    ) -> dict:

        filename = url.split("/")[-1]

        extension = ""

        if "." in filename:

            extension = filename.rsplit(".", 1)[1].lower()

        return {

            "filename": filename,

            "extension": extension,

        }


###############################################################################
# PAGE SUMMARY
###############################################################################

    def analyze(

        self,

        html: str,

        url: str,

    ) -> dict:

        page_text = self.text(html)

        return {

            "title": self.title(html),

            "meta": self.meta_tags(html),

            "headings": self.headings(html),

            "links": self.links(html, url),

            "documents": self.document_links(html, url),

            "images": self.images(html, url),

            "emails": self.emails(html),

            "phones": self.phones(html),

            "semester": self.semester(page_text),

            "subject": self.subject(page_text),

            "document_type": self.document_type(page_text),

            "university": self.university(page_text),

        }


###############################################################################
# SINGLETON
###############################################################################

parser = Parser()