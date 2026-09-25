"""
===============================================================================
LLB Knowledge Platform
repeated_questions.py

Finds repeated / frequently asked questions across years of LLB papers.
Output is always organised BY SEMESTER for student access.

Handles all folder structures automatically at runtime:

  PATTERN A — GU style
    university / Sem-N / year / subject.pdf
    → one PDF per subject per year, already split by subject

  PATTERN B — Trichy style
    university / SemN / year / [optional-subfolder] / subject.pdf
    → same as A but may have an extra nesting level

  PATTERN C — KES style
    university / year.pdf   (one big PDF = all subjects all semesters)
    university / year / numbered_opaque.pdf
    → Gemini must identify subject + semester from content

Usage:
    python repeated_questions.py
    python repeated_questions.py --university GU
    python repeated_questions.py --university Trichy --sem Sem1
    python repeated_questions.py --university KES_LLB_Papers

Author : Xeevi
Python : 3.13+
===============================================================================
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock

import fitz  # PyMuPDF

###############################################################################
# PATHS
###############################################################################

PAPERS_DIR = Path(r"C:\projects\LLB\papers")
OUTPUT_DIR = Path(r"C:\projects\LLB\repeated_questions")

###############################################################################
# CONFIG
###############################################################################

DPI         = 150
MAX_PAGES   = 20
MAX_RETRIES = 3
RETRY_DELAY = 3

###############################################################################
# THREAD-SAFE PRINT
###############################################################################

_lock = Lock()

def log(*args):
    with _lock:
        print(*args, flush=True)

###############################################################################
# DATA STRUCTURES
###############################################################################

@dataclass
class SemesterGroup:
    """All papers for one subject across multiple years, within one semester."""
    university: str
    semester: str          # e.g. "Sem-1", "Sem1", "Semester 1"
    subject: str           # e.g. "Law of Contract", "Sem1 (combined)"
    year_pdfs: dict[str, list[Path]] = field(default_factory=dict)
    # year -> list of PDFs (usually 1, but could be multiple for combined papers)

###############################################################################
# GEMINI CLIENT
###############################################################################

def get_client():
    from google import genai
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise ValueError(
            "Set GEMINI_API_KEY environment variable.\n"
            "Free key: https://aistudio.google.com/app/apikey"
        )
    return genai.Client(api_key=key)

###############################################################################
# RENDER PDF TO IMAGES
###############################################################################

def pdf_to_images(pdf_path: Path, dpi: int = DPI) -> list[bytes]:
    images = []
    try:
        doc = fitz.open(str(pdf_path))
        for i, page in enumerate(doc):
            if i >= MAX_PAGES:
                break
            images.append(page.get_pixmap(dpi=dpi).tobytes("png"))
        doc.close()
    except Exception as ex:
        log(f"    [ERROR] render {pdf_path.name}: {ex}")
    return images

###############################################################################
# OCR — extract questions from a single PDF
###############################################################################

OCR_PROMPT_SUBJECT = (
    "You are reading an Indian LLB university exam paper.\n"
    "Extract EVERY question exactly as written. Include all sub-parts.\n"
    "Skip instructions, marks, headers, and watermarks.\n"
    "Output:\nQ1. ...\nQ2. ...\n"
)

OCR_PROMPT_COMBINED = (
    "You are reading an Indian LLB university exam paper booklet "
    "that contains papers for MULTIPLE subjects and possibly multiple semesters.\n\n"
    "For each subject paper you find:\n"
    "1. Identify the subject name and semester number\n"
    "2. Extract every question exactly as written\n\n"
    "Output format (repeat for each subject):\n"
    "=== SUBJECT: [subject name] | SEMESTER: [number] ===\n"
    "Q1. ...\nQ2. ...\n\n"
    "If you cannot determine the semester, write SEMESTER: unknown.\n"
    "Skip instructions, marks, headers, watermarks."
)

def ocr_pdf(pdf_path: Path, client, combined: bool = False) -> str:
    from google.genai import types

    images = pdf_to_images(pdf_path)
    if not images:
        return ""

    model  = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    prompt = OCR_PROMPT_COMBINED if combined else OCR_PROMPT_SUBJECT

    parts = [types.Part.from_text(prompt)]
    for img in images:
        parts.append(types.Part.from_bytes(data=img, mime_type="image/png"))

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = client.models.generate_content(model=model, contents=parts)
            return resp.text.strip()
        except Exception as ex:
            log(f"    [WARN] OCR attempt {attempt}/{MAX_RETRIES} ({pdf_path.name}): {ex}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
    return ""

###############################################################################
# PARSE COMBINED OCR OUTPUT  (KES style)
# Returns dict: "subject|semester" -> questions_text
###############################################################################

def parse_combined_ocr(raw: str) -> dict[str, str]:
    """
    Split combined OCR output into per-subject sections.
    Looks for:  === SUBJECT: xxx | SEMESTER: N ===
    """
    sections: dict[str, str] = {}
    pattern = re.compile(
        r"===\s*SUBJECT:\s*(.+?)\s*\|\s*SEMESTER:\s*(.+?)\s*===",
        re.IGNORECASE,
    )
    parts = pattern.split(raw)
    # parts = [pre, subject1, sem1, text1, subject2, sem2, text2, ...]
    i = 1
    while i + 2 < len(parts):
        subject = parts[i].strip()
        semester = parts[i + 1].strip()
        text = parts[i + 2].strip()
        if text:
            key = f"{subject}|{semester}"
            sections[key] = text
        i += 3
    return sections

###############################################################################
# FIND REPEATED QUESTIONS  (Gemini analysis)
###############################################################################

REPEATED_PROMPT = """
You are an expert LLB law professor analysing exam papers from multiple years.

Subject / Semester: {subject}

Below are questions from this subject grouped by year.
Find questions that are REPEATED or SIMILAR across different years.
Group similar questions (same concept = same group even if worded differently).
Rank by frequency (most repeated first).

Return ONLY a valid JSON array:
[
  {{
    "rank": 1,
    "frequency": 4,
    "years": ["2020", "2021", "2022", "2023"],
    "standard_question": "Define negligence and explain its essential elements with relevant case law.",
    "variations": [
      {{"year": "2020", "question": "What is negligence? Explain its elements."}},
      {{"year": "2021", "question": "Define negligence. What are its essential ingredients?"}}
    ],
    "topic": "Negligence",
    "importance": "Very High"
  }}
]

importance: Very High (4+ years) | High (3 years) | Medium (2 years) | Low (1 year)

QUESTIONS BY YEAR:
{questions_by_year}
"""

def find_repeated(label: str, questions_by_year: dict[str, str], client) -> list:
    if len(questions_by_year) < 2:
        return []

    formatted = ""
    for year in sorted(questions_by_year):
        formatted += f"\n\n=== {year} ===\n{questions_by_year[year]}"

    prompt = REPEATED_PROMPT.format(
        subject=label,
        questions_by_year=formatted,
    )
    model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = client.models.generate_content(model=model, contents=prompt)
            raw  = resp.text.strip()
            raw  = re.sub(r"^```[a-z]*\n?", "", raw)
            raw  = re.sub(r"\n?```$",        "", raw).strip()
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                m = re.search(r"\[[\s\S]*\]", raw)
                if m:
                    return json.loads(m.group())
        except Exception as ex:
            log(f"  [WARN] analysis attempt {attempt}: {ex}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
    return []

###############################################################################
# SAVE
###############################################################################

def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

def save_markdown(path: Path, label: str, results: list):
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"# {label} — Repeated Questions\n",
        f"**{len(results)} repeated question group(s) found**\n",
        "---\n",
    ]
    for item in results:
        years = ", ".join(item.get("years", []))
        lines += [
            f"## #{item.get('rank')} — {item.get('topic', '')}",
            f"**Importance:** {item.get('importance','')}  |  "
            f"**Appeared:** {item.get('frequency','')} times  |  "
            f"**Years:** {years}\n",
            f"> {item.get('standard_question','')}\n",
            "**Variations:**\n",
        ]
        for v in item.get("variations", []):
            lines.append(f"- **{v.get('year','')}**: {v.get('question','')}")
        lines.append("\n---\n")
    path.write_text("\n".join(lines), encoding="utf-8")

###############################################################################
# FOLDER SCANNER — detects pattern at runtime
###############################################################################

def scan_university(uni_dir: Path) -> list[SemesterGroup]:
    """
    Inspect a university folder and return SemesterGroups.
    Decides at runtime which pattern applies.
    """
    groups: list[SemesterGroup] = []

    # ── Detect semester subdirectories ──────────────────────────────────────
    sem_dirs = [
        d for d in sorted(uni_dir.iterdir())
        if d.is_dir() and re.match(r"[Ss]em", d.name)
    ]

    if sem_dirs:
        # PATTERN A / B  — has Sem-N subdirectories
        for sem_dir in sem_dirs:
            groups.extend(_scan_sem_dir(uni_dir.name, sem_dir))
        return groups

    # ── No sem dirs → PATTERN C (KES flat) ──────────────────────────────────
    # Two sub-cases:
    #   C1: year.pdf directly in uni_dir  (2017-2018.pdf, 2022-2023.pdf …)
    #   C2: year/ subdirs with numbered PDFs
    groups.extend(_scan_flat_dir(uni_dir.name, uni_dir))
    return groups


def _scan_sem_dir(university: str, sem_dir: Path) -> list[SemesterGroup]:
    """
    Handle Pattern A/B:
      sem_dir / year / [optional-subfolder] / subject.pdf
    """
    groups: list[SemesterGroup] = []

    # Collect year dirs
    year_dirs = {
        d.name: d
        for d in sorted(sem_dir.iterdir())
        if d.is_dir() and re.match(r"\d{4}", d.name)
    }
    if not year_dirs:
        return groups

    # Collect all PDFs per year, flattening any extra subfolder
    year_all_pdfs: dict[str, list[Path]] = {}
    for year, ydir in year_dirs.items():
        pdfs = list(ydir.rglob("*.pdf"))
        if pdfs:
            year_all_pdfs[year] = sorted(pdfs)

    if not year_all_pdfs:
        return groups

    # Decide: are PDFs per-subject (multiple per year) or combined (1-2 per year)?
    avg_pdfs = sum(len(v) for v in year_all_pdfs.values()) / len(year_all_pdfs)

    if avg_pdfs >= 3:
        # Per-subject: group by subject name across years
        groups.extend(_group_by_subject(university, sem_dir.name, year_all_pdfs))
    else:
        # Combined: treat whole year as one group, Gemini will split by subject
        g = SemesterGroup(
            university=university,
            semester=sem_dir.name,
            subject="(combined — all subjects)",
        )
        for year, pdfs in year_all_pdfs.items():
            g.year_pdfs[year] = pdfs
        groups.append(g)

    return groups


def _group_by_subject(
    university: str,
    semester: str,
    year_all_pdfs: dict[str, list[Path]],
) -> list[SemesterGroup]:
    """
    Match PDFs across years by subject name using keyword similarity.
    Falls back to positional matching if names are too opaque.
    """
    # Build subject map: normalised_key -> {year: Path}
    subject_map: dict[str, dict[str, Path]] = {}

    for year, pdfs in year_all_pdfs.items():
        for pdf in pdfs:
            key = _subject_key(pdf.stem)
            if key not in subject_map:
                subject_map[key] = {}
            # If duplicate key in same year, keep first
            if year not in subject_map[key]:
                subject_map[key][year] = pdf

    groups = []
    for key, year_pdfs in subject_map.items():
        if len(year_pdfs) < 2:
            continue
        # Use longest filename as display name
        display = max(year_pdfs.values(), key=lambda p: len(p.stem)).stem
        # Clean up display name
        display = re.sub(r"\s*[-–]\s*\d{4}.*$", "", display).strip()
        g = SemesterGroup(
            university=university,
            semester=semester,
            subject=display,
        )
        for year, pdf in year_pdfs.items():
            g.year_pdfs[year] = [pdf]
        groups.append(g)

    return groups


def _subject_key(stem: str) -> str:
    """
    Normalise a PDF filename to a subject key for matching across years.
    Strips year, codes, and punctuation; keeps core subject words.
    """
    s = stem.lower()
    # Remove year patterns
    s = re.sub(r"\b(19|20)\d{2}\b", "", s)
    s = re.sub(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b", "", s)
    # Remove paper codes like cc-101, fa5a, k-107
    s = re.sub(r"\b[a-z]{0,4}-?\d{2,4}[a-z]?\b", "", s)
    # Remove common noise words
    noise = r"\b(llb|sem|semester|paper|including|inc|and|the|of|for|"  \
            r"march|dec|nov|may|exam|question|core|course)\b"
    s = re.sub(noise, "", s)
    # Collapse whitespace and punctuation
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    # Keep first 4 significant words
    words = [w for w in s.split() if len(w) > 2][:4]
    return " ".join(words) if words else stem[:15].lower()


def _scan_flat_dir(university: str, uni_dir: Path) -> list[SemesterGroup]:
    """
    Handle Pattern C (KES):
    - year.pdf files directly in uni_dir  → combined, Gemini splits by subject+sem
    - year/ subdirs with numbered PDFs    → same treatment
    """
    # C1: year PDFs directly in folder
    year_pdfs_direct: dict[str, list[Path]] = {}
    for pdf in sorted(uni_dir.glob("*.pdf")):
        m = re.match(r"(\d{4}[-–]\d{2,4})", pdf.stem)
        if m:
            year = m.group(1)
            year_pdfs_direct.setdefault(year, []).append(pdf)

    # C2: year subdirs
    year_pdfs_subdirs: dict[str, list[Path]] = {}
    for d in sorted(uni_dir.iterdir()):
        if d.is_dir() and re.match(r"\d{4}", d.name):
            pdfs = sorted(d.rglob("*.pdf"))
            if pdfs:
                year_pdfs_subdirs[d.name] = pdfs

    # Merge: prefer direct year PDFs (they're the combined booklets)
    combined: dict[str, list[Path]] = {**year_pdfs_subdirs, **year_pdfs_direct}

    if not combined:
        return []

    # One SemesterGroup per semester, discovered from content at OCR time
    # We create a single "flat" group; process_group will handle splitting
    g = SemesterGroup(
        university=university,
        semester="(all semesters — combined)",
        subject="(combined — Gemini will split by subject and semester)",
    )
    g.year_pdfs = combined
    return [g]

###############################################################################
# PROCESS ONE SEMESTER GROUP
###############################################################################

def process_group(group: SemesterGroup, client):
    combined_mode = "combined" in group.subject.lower()

    label = f"{group.university} / {group.semester} / {group.subject}"
    log(f"\n{'='*70}")
    log(f"  {label}")
    log(f"  Years: {', '.join(sorted(group.year_pdfs))}")
    log(f"{'='*70}")

    # Output directory
    safe_subject = re.sub(r'[\\/:*?"<>|]', "_", group.subject)[:60]
    out_dir = OUTPUT_DIR / group.university / group.semester / safe_subject

    if (out_dir / "repeated_questions.json").exists():
        log("  [SKIP] Already processed.")
        return

    if combined_mode:
        _process_combined(group, label, out_dir, client)
    else:
        _process_per_subject(group, label, out_dir, client)


def _process_per_subject(
    group: SemesterGroup,
    label: str,
    out_dir: Path,
    client,
):
    """OCR each year's PDF(s) and find repeated questions."""
    questions_by_year: dict[str, str] = {}

    for year in sorted(group.year_pdfs):
        parts = []
        for pdf in group.year_pdfs[year]:
            log(f"    OCR [{year}]: {pdf.name}")
            text = ocr_pdf(pdf, client, combined=False)
            if text:
                parts.append(text)
            time.sleep(1)
        if parts:
            questions_by_year[year] = "\n\n".join(parts)
            log(f"  ✓ {year}: {len(questions_by_year[year])} chars")

    if len(questions_by_year) < 2:
        log("  [SKIP] Need at least 2 years with text.")
        return

    save_json(out_dir / "extracted_questions.json", questions_by_year)

    log(f"  Analysing {len(questions_by_year)} years...")
    results = find_repeated(label, questions_by_year, client)

    if not results:
        log("  [WARN] No repeated questions found.")
        return

    log(f"  Found {len(results)} group(s)")
    save_json(out_dir / "repeated_questions.json", results)
    save_markdown(out_dir / "repeated_questions.md", label, results)
    log(f"  ✅ {out_dir}")


def _process_combined(
    group: SemesterGroup,
    label: str,
    out_dir: Path,
    client,
):
    """
    OCR combined PDFs, parse into subject+semester sections,
    then find repeated questions per subject per semester.
    """
    # Step 1: OCR all years → parse into sections
    # sections_by_year[year][subject|sem] = questions_text
    sections_by_year: dict[str, dict[str, str]] = {}

    for year in sorted(group.year_pdfs):
        year_sections: dict[str, str] = {}
        for pdf in group.year_pdfs[year]:
            log(f"    OCR [{year}]: {pdf.name}")
            raw = ocr_pdf(pdf, client, combined=True)
            if raw:
                parsed = parse_combined_ocr(raw)
                if parsed:
                    year_sections.update(parsed)
                else:
                    # Gemini didn't use the expected format — store as-is
                    year_sections[f"unknown|unknown"] = raw
            time.sleep(1)
        if year_sections:
            sections_by_year[year] = year_sections
            log(f"  ✓ {year}: {len(year_sections)} subject section(s)")

    if not sections_by_year:
        log("  [SKIP] No text extracted.")
        return

    # Step 2: Pivot — group by subject+semester across years
    # pivot[subject|sem][year] = questions_text
    pivot: dict[str, dict[str, str]] = {}
    for year, sections in sections_by_year.items():
        for key, text in sections.items():
            pivot.setdefault(key, {})[year] = text

    # Save raw
    save_json(out_dir / "extracted_questions.json", sections_by_year)

    # Step 3: Find repeated per subject+semester
    all_results: dict[str, list] = {}
    for key, year_texts in pivot.items():
        if len(year_texts) < 2:
            continue
        subject_part, sem_part = (key.split("|") + ["?"])[:2]
        sub_label = f"{group.university} / Sem {sem_part} / {subject_part}"
        log(f"  Analysing: {sub_label} ({len(year_texts)} years)...")
        results = find_repeated(sub_label, year_texts, client)
        if results:
            all_results[key] = results
            # Save per-subject output
            safe = re.sub(r'[\\/:*?"<>|]', "_", key)[:60]
            sub_dir = out_dir / safe
            save_json(sub_dir / "repeated_questions.json", results)
            save_markdown(sub_dir / "repeated_questions.md", sub_label, results)
            log(f"    → {len(results)} group(s) for {sub_label}")

    if all_results:
        save_json(out_dir / "all_repeated_questions.json", all_results)
        log(f"  ✅ {out_dir}")
    else:
        log("  [WARN] No repeated questions found.")

###############################################################################
# CLI
###############################################################################

def parse_args():
    p = argparse.ArgumentParser(
        description="Find repeated LLB exam questions, organised by semester."
    )
    p.add_argument("--folder",      "-f", help="Root papers folder")
    p.add_argument("--university",  "-u", help="Filter by university folder name")
    p.add_argument("--sem",         "-s", help="Filter by semester name (e.g. Sem1)")
    p.add_argument("--output",      "-o", help="Output directory")
    p.add_argument("--workers",     "-w", type=int, default=1,
                   help="Concurrent groups (default 1)")
    return p.parse_args()

###############################################################################
# MAIN
###############################################################################

def main():
    args = parse_args()

    global OUTPUT_DIR
    if args.output:
        OUTPUT_DIR = Path(args.output)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    root = Path(args.folder) if args.folder else PAPERS_DIR

    log("Initialising Gemini client...")
    try:
        client = get_client()
        log("Client ready.\n")
    except ValueError as ex:
        log(f"[ERROR] {ex}")
        sys.exit(1)

    # Scan all university folders
    uni_dirs = [d for d in sorted(root.iterdir()) if d.is_dir()]
    if args.university:
        uni_dirs = [d for d in uni_dirs if args.university.lower() in d.name.lower()]

    all_groups: list[SemesterGroup] = []
    for uni_dir in uni_dirs:
        groups = scan_university(uni_dir)
        if args.sem:
            groups = [g for g in groups if args.sem.lower() in g.semester.lower()]
        all_groups.extend(groups)

    if not all_groups:
        log("[ERROR] No groups found.")
        sys.exit(1)

    log(f"Groups to process: {len(all_groups)}")
    for g in all_groups:
        log(f"  [{g.university}] {g.semester} / {g.subject}  ({len(g.year_pdfs)} years)")

    log(f"\nOutput: {OUTPUT_DIR}\n")

    if args.workers > 1:
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(process_group, g, client): g for g in all_groups}
            for future in as_completed(futures):
                g = futures[future]
                try:
                    future.result()
                except Exception as ex:
                    log(f"[ERROR] {g.university}/{g.semester}/{g.subject}: {ex}")
    else:
        for g in all_groups:
            process_group(g, client)

    log(f"\n{'='*70}")
    log(f"Done. Results: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
