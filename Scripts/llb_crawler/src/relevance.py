"""
===============================================================================
LLB Knowledge Platform
relevance.py

Relevance scoring for URLs, documents, and pages.

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

from src.logger import get_logger

logger = get_logger(__name__)

###############################################################################
# PATHS
###############################################################################

_DB = Path(__file__).resolve().parent.parent / "database"

POSITIVE_KEYWORDS_FILE = _DB / "positive_keywords.csv"
NEGATIVE_KEYWORDS_FILE = _DB / "negative_keywords.csv"
PATH_BOOST_FILE        = _DB / "path_boost.csv"
PATH_PENALTY_FILE      = _DB / "path_penalty.csv"

###############################################################################
# THRESHOLDS
###############################################################################

THRESHOLD_IGNORE      = 0
THRESHOLD_VERY_LOW    = 20
THRESHOLD_CRAWL       = 50
THRESHOLD_DOWNLOAD    = 80

DECISION_IGNORE        = "ignore"
DECISION_VERY_LOW      = "very_low"
DECISION_CRAWL         = "crawl"
DECISION_DOWNLOAD      = "download"
DECISION_HIGH_PRIORITY = "high_priority"

# Categories that count as a confirmed law signal.
# A document must have at least one match from these categories to be downloaded.
LAW_SIGNAL_CATEGORIES = {"degree", "law", "department", "profession", "court"}

###############################################################################
# SCORE RESULT
###############################################################################

@dataclass
class ScoreResult:
    score: int = 0
    decision: str = DECISION_IGNORE
    has_law_signal: bool = False
    matched_positive: list[str] = field(default_factory=list)
    matched_negative: list[str] = field(default_factory=list)
    matched_boosts: list[str]   = field(default_factory=list)
    matched_penalties: list[str] = field(default_factory=list)

###############################################################################
# RELEVANCE SCORER
###############################################################################

class RelevanceScorer:

    def __init__(self):
        self._positive: list[tuple[str, int]] = []
        self._negative: list[tuple[str, int]] = []
        self._boosts:   list[tuple[str, int]] = []
        self._penalties: list[tuple[str, int]] = []
        self._loaded = False

    ###########################################################################
    # LOAD
    ###########################################################################

    def _load(self):

        if self._loaded:
            return

        self._positive  = self._read_kw(POSITIVE_KEYWORDS_FILE, "keyword", "score", "category")
        self._negative  = self._read_kw(NEGATIVE_KEYWORDS_FILE, "keyword", "score", "category")
        self._boosts    = self._read_kw(PATH_BOOST_FILE,        "path",    "score")
        self._penalties = self._read_kw(PATH_PENALTY_FILE,      "path",    "score")

        # sort longest keyword first so multi-word matches take priority
        self._positive.sort(key=lambda x: len(x[0]), reverse=True)
        self._negative.sort(key=lambda x: len(x[0]), reverse=True)

        self._loaded = True

        logger.debug(
            "RelevanceScorer loaded: %d positive, %d negative, %d boosts, %d penalties",
            len(self._positive),
            len(self._negative),
            len(self._boosts),
            len(self._penalties),
        )

    @staticmethod
    def _read_kw(
        file: Path,
        kw_col: str,
        score_col: str,
        category_col: str = "",
    ) -> list[tuple[str, int, str]]:

        if not file.exists():
            logger.warning("Relevance CSV not found: %s", file)
            return []

        df = pd.read_csv(file, encoding="utf-8")

        if kw_col not in df.columns or score_col not in df.columns:
            logger.warning("Missing columns in %s", file)
            return []

        has_cat = category_col and category_col in df.columns

        return [
            (
                str(row[kw_col]).strip().lower(),
                int(row[score_col]),
                str(row[category_col]).strip().lower() if has_cat else "",
            )
            for _, row in df.iterrows()
            if str(row[kw_col]).strip()
        ]

    ###########################################################################
    # CALCULATE SCORE
    ###########################################################################

    def calculate_score(self, *texts: str) -> ScoreResult:
        """
        Score one or more text strings combined.
        Deduplicates matches — each keyword counted once regardless of
        how many times or in how many fields it appears.
        """
        self._load()

        combined = " ".join(t.lower() for t in texts if t)

        result = ScoreResult()
        seen_positive: set[str] = set()
        seen_negative: set[str] = set()

        for keyword, pts, category in self._positive:
            if keyword in seen_positive:
                continue
            if keyword in combined:
                result.score += pts
                result.matched_positive.append(keyword)
                seen_positive.add(keyword)
                if category in LAW_SIGNAL_CATEGORIES:
                    result.has_law_signal = True

        for keyword, pts, category in self._negative:
            if keyword in seen_negative:
                continue
            if keyword in combined:
                result.score += pts
                result.matched_negative.append(keyword)
                seen_negative.add(keyword)

        result.decision = self._decide(result.score)
        return result

    ###########################################################################
    # PATH SCORE
    ###########################################################################

    def _path_score(self, url: str) -> tuple[int, list[str], list[str]]:

        path = urlparse(url).path.lower()
        total = 0
        boosts: list[str] = []
        penalties: list[str] = []

        for segment, pts, *_ in self._boosts:
            if segment.lower() in path:
                total += pts
                boosts.append(segment)

        for segment, pts, *_ in self._penalties:
            if segment.lower() in path:
                total += pts
                penalties.append(segment)

        return total, boosts, penalties

    ###########################################################################
    # DECISION
    ###########################################################################

    @staticmethod
    def _decide(score: int) -> str:
        if score < THRESHOLD_IGNORE:
            return DECISION_IGNORE
        if score < THRESHOLD_VERY_LOW:
            return DECISION_VERY_LOW
        if score < THRESHOLD_CRAWL:
            return DECISION_CRAWL
        if score < THRESHOLD_DOWNLOAD:
            return DECISION_DOWNLOAD
        return DECISION_HIGH_PRIORITY

    ###########################################################################
    # SCORE URL
    ###########################################################################

    def score_url(self, url: str) -> ScoreResult:
        """Score based on URL path and filename only."""
        self._load()

        path     = urlparse(url).path
        filename = path.rsplit("/", 1)[-1]

        result = self.calculate_score(path, filename)

        path_pts, boosts, penalties = self._path_score(url)
        result.score += path_pts
        result.matched_boosts    = boosts
        result.matched_penalties = penalties
        result.decision = self._decide(result.score)

        self._log(url, result)
        return result

    ###########################################################################
    # SCORE DOCUMENT
    ###########################################################################

    def score_document(
        self,
        url: str,
        filename: str = "",
        anchor_text: str = "",
    ) -> ScoreResult:
        """Score a downloadable document link."""
        self._load()

        path = urlparse(url).path
        fname = filename or path.rsplit("/", 1)[-1]

        result = self.calculate_score(path, fname, anchor_text)

        path_pts, boosts, penalties = self._path_score(url)
        result.score += path_pts
        result.matched_boosts    = boosts
        result.matched_penalties = penalties
        result.decision = self._decide(result.score)

        self._log(url, result)
        return result

    ###########################################################################
    # SCORE PAGE
    ###########################################################################

    def score_page(
        self,
        url: str,
        title: str = "",
        anchor_text: str = "",
    ) -> ScoreResult:
        """Score an HTML page."""
        self._load()

        path = urlparse(url).path

        result = self.calculate_score(path, title, anchor_text)

        path_pts, boosts, penalties = self._path_score(url)
        result.score += path_pts
        result.matched_boosts    = boosts
        result.matched_penalties = penalties
        result.decision = self._decide(result.score)

        self._log(url, result)
        return result

    ###########################################################################
    # CONVENIENCE WRAPPERS
    ###########################################################################

    def should_crawl(
        self,
        url: str,
        title: str = "",
        anchor_text: str = "",
    ) -> bool:
        """Allow crawling pages that score CRAWL or above (score >= 50)."""
        result = self.score_page(url, title, anchor_text)
        return result.decision in (DECISION_CRAWL, DECISION_DOWNLOAD, DECISION_HIGH_PRIORITY)

    def should_download(
        self,
        url: str,
        filename: str = "",
        anchor_text: str = "",
    ) -> bool:
        """
        Download only when:
          - score >= 80 (DOWNLOAD or HIGH_PRIORITY), AND
          - at least one law-specific keyword matched
        This prevents generic academic words (semester, dissertation, syllabus)
        from triggering downloads on non-law content.
        """
        result = self.score_document(url, filename, anchor_text)
        if result.decision not in (DECISION_DOWNLOAD, DECISION_HIGH_PRIORITY):
            return False
        if not result.has_law_signal:
            logger.debug("Skipped (no law signal): %s", url)
            return False
        return True

    ###########################################################################
    # LOGGING
    ###########################################################################

    @staticmethod
    def _log(url: str, result: ScoreResult):
        logger.debug(
            "Relevance [%s] score=%d decision=%s law_signal=%s | +%s | -%s",
            url,
            result.score,
            result.decision,
            result.has_law_signal,
            result.matched_positive or [],
            result.matched_negative or [],
        )

###############################################################################
# SINGLETON
###############################################################################

relevance_scorer = RelevanceScorer()
