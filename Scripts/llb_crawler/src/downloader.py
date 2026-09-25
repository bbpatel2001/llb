"""
===============================================================================
LLB Knowledge Platform
downloader.py

Document downloader.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

from pathlib import Path

from src.config import config
from src.constants import DOWNLOAD_DIR
from src.logger import get_logger
from src.session import http
from src.storage import storage
from src.utils import (
    filename_from_url,
    md5_file,
    sha256_file,
)

logger = get_logger(__name__)


###############################################################################
# DOWNLOADER
###############################################################################

class Downloader:

    def __init__(self):

        self.download_dir = DOWNLOAD_DIR

        self.download_dir.mkdir(

            parents=True,

            exist_ok=True,

        )


###############################################################################
# FILE NAME
###############################################################################

    def file_path(

        self,

        url: str,

    ) -> Path:

        filename = filename_from_url(url)

        if not filename:

            filename = "download"

        return self.download_dir / filename


###############################################################################
# DOWNLOAD
###############################################################################

    def download(

        self,

        url: str,

        overwrite: bool = False,

    ) -> Path | None:

        destination = self.file_path(

            url,

        )

        if (

            destination.exists()

            and not overwrite

        ):

            logger.info(

                "Already downloaded : %s",

                destination.name,

            )

            return destination

        ok = http.download(

            url,

            destination,

            overwrite=overwrite,

        )

        if not ok:

            return None

        return destination


###############################################################################
# HASHES
###############################################################################

    def hashes(

        self,

        file: Path,

    ) -> tuple[str, str]:

        return (

            md5_file(file),

            sha256_file(file),

        )


###############################################################################
# FILE SIZE
###############################################################################

    def size(

        self,

        file: Path,

    ) -> int:

        return file.stat().st_size


###############################################################################
# EXISTS
###############################################################################

    def exists(

        self,

        url: str,

    ) -> bool:

        return self.file_path(

            url,

        ).exists()
    ###############################################################################
# VERIFY
###############################################################################

    def verify(

        self,

        file: Path,

    ) -> bool:

        if not file.exists():

            return False

        if file.stat().st_size == 0:

            logger.warning(

                "Empty file : %s",

                file,

            )

            return False

        return True


###############################################################################
# DOWNLOAD WITH METADATA
###############################################################################

    def download_document(

        self,

        document,

        overwrite: bool = False,

    ):

        file = self.download(

            document.url,

            overwrite=overwrite,

        )

        if file is None:

            return None

        if not self.verify(file):

            return None

        document.local_path = file

        document.file_size = self.size(file)

        document.md5, document.sha256 = self.hashes(file)

        document.downloaded = True

        storage.save_download(

            document,

        )

        return document


###############################################################################
# BATCH DOWNLOAD
###############################################################################

    def download_all(

        self,

        documents,

        overwrite: bool = False,

    ):

        results = []

        for document in documents:

            result = self.download_document(

                document,

                overwrite=overwrite,

            )

            if result:

                results.append(

                    result,

                )

        return results


###############################################################################
# DELETE
###############################################################################

    def delete(

        self,

        url: str,

    ):

        file = self.file_path(

            url,

        )

        if file.exists():

            file.unlink()

            logger.info(

                "Deleted : %s",

                file,

            )


###############################################################################
# DOWNLOAD STATISTICS
###############################################################################

    def statistics(

        self,

    ) -> dict:

        total_files = 0

        total_size = 0

        for file in self.download_dir.rglob("*"):

            if file.is_file():

                total_files += 1

                total_size += file.stat().st_size

        return {

            "files": total_files,

            "bytes": total_size,

        }


###############################################################################
# SINGLETON
###############################################################################

downloader = Downloader()