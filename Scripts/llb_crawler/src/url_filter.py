"""
===============================================================================
LLB Knowledge Platform
url_filter.py

URL filtering and crawl policy.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

from urllib.parse import (
    urlparse,
    urldefrag,
)

from src.constants import *
from src.config import config
from src.logger import get_logger

logger = get_logger(__name__)

###############################################################################
# URL FILTER
###############################################################################

class URLFilter:

    def __init__(self):

        self.visited: set[str] = set()

        self.allowed_domains = set()

        self.blocked_extensions = set()

        self.document_extensions = set()

        self._initialized = False

    def initialize(self):

        """Initialize after config is loaded."""

        if self._initialized:

            return

        self.allowed_domains = {

            domain.lower()

            for domain in config.allowed_domains

        }

        self.blocked_extensions = set()

        if not config.file_extensions.empty:

            blocked = config.file_extensions.loc[
                config.file_extensions["Download"]
                .astype(str)
                .str.lower()
                != "yes",
                "Extension",
            ]

            self.blocked_extensions = {
                str(ext).lower()
                for ext in blocked
            }

        self.document_extensions = config.get_extensions()

        self._initialized = True


###############################################################################
# NORMALIZE
###############################################################################

    def normalize(

        self,

        url: str,

    ) -> str:

        if not url:

            return ""

        url = urldefrag(url)[0]

        url = url.strip()

        if config.ignore_query_string:

            parsed = urlparse(url)

            url = parsed._replace(

                query="",

            ).geturl()

        return url


###############################################################################
# DOMAIN
###############################################################################

    def domain(

        self,

        url: str,

    ) -> str:

        return urlparse(

            url,

        ).netloc.lower()


###############################################################################
# EXTENSION
###############################################################################

    def extension(

        self,

        url: str,

    ) -> str:

        path = urlparse(url).path.lower()

        if "." not in path:

            return ""

        return "." + path.rsplit(".", 1)[1]


###############################################################################
# VALID HTTP URL
###############################################################################

    def is_http(

        self,

        url: str,

    ) -> bool:

        scheme = urlparse(

            url,

        ).scheme.lower()

        return scheme in {

            "http",

            "https",

        }


###############################################################################
# DOMAIN CHECK
###############################################################################

    def is_allowed_domain(

        self,

        url: str,

    ) -> bool:

        if not self.allowed_domains:

            return True

        domain = self.domain(url)

        return any(

            domain == allowed

            or domain.endswith(

                "." + allowed

            )

            for allowed in self.allowed_domains

        )


###############################################################################
# DOCUMENT
###############################################################################

    def is_document(

        self,

        url: str,

    ) -> bool:

        return (

            self.extension(url)

            in self.document_extensions

        )


###############################################################################
# BLOCKED FILE
###############################################################################

    def is_blocked_extension(

        self,

        url: str,

    ) -> bool:

        return (

            self.extension(url)

            in self.blocked_extensions

        )


###############################################################################
# IGNORED PATH
###############################################################################

    def is_ignored_path(

        self,

        url: str,

    ) -> bool:

        path = urlparse(url).path.lower()

        return any(

            path.startswith(p) or ("/" + p.lstrip("/")) in path

            for p in config.ignore_path_list

        )


###############################################################################
# IGNORED FILENAME
###############################################################################

    def is_ignored_filename(

        self,

        url: str,

    ) -> bool:

        filename = urlparse(url).path.lower().rsplit("/", 1)[-1]

        return any(

            keyword in filename

            for keyword in config.ignore_keyword_list

        )


###############################################################################
# DUPLICATE
###############################################################################

    def is_duplicate(

        self,

        url: str,

    ) -> bool:

        url = self.normalize(

            url,

        )

        return url in self.visited


###############################################################################
# MARK VISITED
###############################################################################

    def mark_visited(

        self,

        url: str,

    ):

        self.visited.add(

            self.normalize(url)

        )

###############################################################################
# DEPTH CHECK
###############################################################################

    def within_depth(

        self,

        depth: int,

    ) -> bool:

        return depth <= config.max_depth


###############################################################################
# SHOULD CRAWL
###############################################################################

    def should_crawl(

        self,

        url: str,

        depth: int = 0,

    ) -> bool:

        self.initialize()

        url = self.normalize(url)

        if not url:

            return False

        if not self.is_http(url):

            return False

        if not self.within_depth(depth):

            return False

        if not self.is_allowed_domain(url):

            return False

        if self.is_blocked_extension(url):

            return False

        if self.is_ignored_path(url):

            return False

        if self.is_duplicate(url):

            return False

        return True


###############################################################################
# SHOULD DOWNLOAD
###############################################################################

    def should_download(

        self,

        url: str,

    ) -> bool:

        url = self.normalize(url)

        if not self.is_http(url):

            return False

        if not self.is_allowed_domain(url):

            return False

        if self.is_ignored_path(url):

            return False

        if self.is_ignored_filename(url):

            return False

        if self.is_document(url):

            return True

        return False


###############################################################################
# VISITED
###############################################################################

    def visited_count(

        self,

    ) -> int:

        return len(self.visited)


    def clear(self):

        self.visited.clear()


###############################################################################
# IMPORT / EXPORT
###############################################################################

    def export_visited(

        self,

        file,

    ):

        with open(

            file,

            "w",

            encoding="utf-8",

        ) as fp:

            for url in sorted(self.visited):

                fp.write(url)

                fp.write("\n")


    def import_visited(

        self,

        file,

    ):

        if not file.exists():

            return

        with open(

            file,

            encoding="utf-8",

        ) as fp:

            for line in fp:

                line = line.strip()

                if line:

                    self.visited.add(

                        self.normalize(line)

                    )


###############################################################################
# STATISTICS
###############################################################################

    def statistics(

        self,

    ) -> dict:

        return {

            "visited": len(self.visited),

            "allowed_domains": len(self.allowed_domains),

            "blocked_extensions": len(self.blocked_extensions),

            "document_extensions": len(self.document_extensions),

        }


###############################################################################
# RESET
###############################################################################

    def reset(self):

        self.clear()


###############################################################################
# SINGLETON
###############################################################################

url_filter = URLFilter()
