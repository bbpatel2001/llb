"""
===============================================================================
LLB Knowledge Platform
session.py

Reusable HTTP session with retries, connection pooling and download helpers.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Optional

import urllib3

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from src.config import config
from src.logger import get_logger

logger = get_logger(__name__)

###############################################################################
# HTTP SESSION
###############################################################################


class HTTPSession:

    def __init__(self):

        self.session = requests.Session()

        self.timeout = 30

        self.verify_ssl = False

        self.user_agent = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/138.0 Safari/537.36"
        )

        self.headers = {}

        self.refresh_config()

###############################################################################
# REFRESH CONFIG
###############################################################################

    def refresh_config(self):

        self.timeout = config.get_setting(
            "request_timeout",
            30,
        )

        self.verify_ssl = config.get_setting(
            "verify_ssl",
            False,
        )

        self.user_agent = config.get_setting(
            "user_agent",
            (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/138.0 Safari/537.36"
            ),
        )

        self.headers = {
            "User-Agent": self.user_agent,
            "Accept": (
                "text/html,"
                "application/xhtml+xml,"
                "application/xml;q=0.9,"
                "*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
        }

        self._configure_session()

###############################################################################
# CONFIGURE SESSION
###############################################################################

    def _configure_session(self):

        retry = Retry(

            total=config.get_setting(
                "retry_count",
                3,
            ),

            connect=3,

            read=3,

            backoff_factor=config.get_setting(
                "retry_backoff",
                1,
            ),

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

            raise_on_status=False,
        )

        adapter = HTTPAdapter(

            max_retries=retry,

            pool_connections=config.get_setting(
                "pool_connections",
                20,
            ),

            pool_maxsize=config.get_setting(
                "pool_maxsize",
                20,
            ),
        )

        self.session.mount(
            "http://",
            adapter,
        )

        self.session.mount(
            "https://",
            adapter,
        )

        self.session.headers.update(
            self.headers
        )

###############################################################################
# GET
###############################################################################

    def get(

        self,

        url: str,

        **kwargs,

    ) -> Optional[requests.Response]:

        timeout = kwargs.pop(
            "timeout",
            self.timeout,
        )

        try:

            response = self.session.get(

                url,

                timeout=timeout,

                verify=self.verify_ssl,

                **kwargs,

            )

            return response

        except requests.RequestException as ex:

            logger.error(
                "GET failed : %s : %s",
                url,
                ex,
            )

            return None

###############################################################################
# HEAD
###############################################################################

    def head(

        self,

        url: str,

        **kwargs,

    ) -> Optional[requests.Response]:

        timeout = kwargs.pop(
            "timeout",
            self.timeout,
        )

        try:

            response = self.session.head(

                url,

                timeout=timeout,

                verify=self.verify_ssl,

                allow_redirects=True,

                **kwargs,

            )

            return response

        except requests.RequestException as ex:

            logger.error(
                "HEAD failed : %s : %s",
                url,
                ex,
            )

            return None
    ###############################################################################
# DOWNLOAD FILE
###############################################################################

    def download(

        self,

        url: str,

        destination: Path,

        overwrite: bool = False,

        chunk_size: int = 8192,

    ) -> bool:

        try:

            if destination.exists() and not overwrite:

                logger.debug(
                    "Already downloaded : %s",
                    destination,
                )

                return True

            destination.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            response = self.session.get(

                url,

                timeout=self.timeout,

                verify=self.verify_ssl,

                stream=True,

            )

            response.raise_for_status()

            with open(
                destination,
                "wb",
            ) as fp:

                for chunk in response.iter_content(
                    chunk_size=chunk_size,
                ):

                    if chunk:

                        fp.write(chunk)

            logger.info(
                "Downloaded : %s",
                destination.name,
            )

            return True

        except Exception as ex:

            logger.error(
                "Download failed : %s : %s",
                url,
                ex,
            )

            return False


###############################################################################
# URL EXISTS
###############################################################################

    def url_exists(

        self,

        url: str,

    ) -> bool:

        response = self.head(url)

        if response is None:

            return False

        return response.status_code < 400


###############################################################################
# GET CONTENT TYPE
###############################################################################

    def get_content_type(

        self,

        url: str,

    ) -> str:

        response = self.head(url)

        if response is None:

            return ""

        return response.headers.get(
            "Content-Type",
            "",
        )


###############################################################################
# RATE LIMIT
###############################################################################

    @staticmethod
    def sleep(

        seconds: float,

    ):

        if seconds > 0:

            time.sleep(seconds)


###############################################################################
# CLOSE
###############################################################################

    def close(self):

        self.session.close()


###############################################################################
# CONTEXT MANAGER
###############################################################################

    def __enter__(self):

        return self


    def __exit__(

        self,

        exc_type,

        exc,

        tb,

    ):

        self.close()


###############################################################################
# SINGLETON
###############################################################################

http = HTTPSession()
