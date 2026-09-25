"""
===============================================================================
LLB Knowledge Platform
generate.py

AI Content Generator for LLB Question Papers

Generates concurrently from each PDF:
  - Long Answers
  - Short Answers
  - Bare Acts
  - Case Laws
  - Flashcards
  - MCQs
  - Revision Notes

All tasks run in parallel. Multiple PDFs processed concurrently.

Usage:
    python generate.py                          # process papers/ + downloads/
    python generate.py --input C:\path\to\pdfs
    python generate.py --file paper.pdf
    python generate.py --tasks mcqs flashcards
    python generate.py --workers 4 --task-workers 7

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
from pathlib import Path
from threading import Lock

###############################################################################
# PATHS
###############################################################################

ROOT          = Path(__file__).resolve().parent
PAPERS_DIR    = Path(r"C:\projects\LLB\papers")
DOWNLOADS_DIR = ROOT / "Scripts" / "llb_crawler" / "downloads"
OUTPUT_DIR    = ROOT / "generated"

###############################################################################
# TASKS
###############################################################################

TASKS = [
    "long_answers",
    "short_answers",
    "bare_acts",
    "case_laws",
    "flashcards",
    "mcqs",
    "revision_notes",
]

###############################################################################
# PROMPTS
###############################################################################

PROMPTS: dict[str, str] = {

    "long_answers": """
You are an expert LLB law professor. Based on the following question paper, generate detailed long answers (minimum 500 words each) for EVERY question asked in the paper.

Rules:
- State each question exactly as written
- Provide a comprehensive legal answer with definitions, principles, case references, and statutory provisions
- Use headings and sub-headings inside the answer field
- Cite relevant sections of Acts and landmark judgments
- Cover all parts of each question

Return ONLY a valid JSON array, no extra text:
[
  {
    "question": "...",
    "answer": "...",
    "acts_cited": ["Indian Penal Code, 1860 - Section 300", "..."],
    "cases_cited": ["State of Maharashtra v. Mayer Hans George (1965)", "..."]
  }
]

PAPER TEXT:
{text}
""",

    "short_answers": """
You are an expert LLB law professor. Based on the following question paper, generate concise short answers (100-200 words each) for EVERY question.

Rules:
- State each question exactly
- Give a precise, exam-ready answer
- Include key legal terms and relevant section numbers
- Cover all parts of each question

Return ONLY a valid JSON array, no extra text:
[
  {
    "question": "...",
    "answer": "...",
    "key_terms": ["consideration", "offer", "acceptance"]
  }
]

PAPER TEXT:
{text}
""",

    "bare_acts": """
You are an expert Indian law researcher. From the following question paper, identify ALL Acts, Sections, and Provisions relevant to the topics covered.

For each Act provide:
- Full official name
- Year of enactment
- Every relevant section with its title and a clear description

Return ONLY a valid JSON array, no extra text:
[
  {
    "act_name": "The Indian Penal Code, 1860",
    "year": "1860",
    "sections": [
      {
        "section": "Section 300",
        "title": "Murder",
        "description": "Defines when culpable homicide amounts to murder..."
      }
    ]
  }
]

PAPER TEXT:
{text}
""",

    "case_laws": """
You are an expert Indian law researcher. From the topics in the following question paper, provide ALL important case laws students must know for their exam.

For each case provide:
- Full case name and citation
- Court and year decided
- Brief facts (2-3 sentences)
- Legal issue
- Held / Ratio Decidendi
- Why it matters for exams

Return ONLY a valid JSON array, no extra text:
[
  {
    "case_name": "Donoghue v Stevenson",
    "citation": "[1932] AC 562",
    "court": "House of Lords",
    "year": "1932",
    "facts": "...",
    "issue": "...",
    "held": "...",
    "significance": "..."
  }
]

PAPER TEXT:
{text}
""",

    "flashcards": """
You are an expert LLB law professor. Create comprehensive flashcards from the following question paper for quick revision.

Rules:
- Front: a concise question, legal term, section number, or case name
- Back: a clear, memorable answer (1-4 sentences max)
- Category must be one of: Definition | Section | Case | Principle | Concept | Act
- Generate AT LEAST 40 flashcards covering every major topic in the paper
- Include definitions, sections, cases, doctrines, and principles

Return ONLY a valid JSON array, no extra text:
[
  {
    "front": "What is the definition of 'consideration' under the Indian Contract Act?",
    "back": "Consideration is something in return. Under Section 2(d) of the Indian Contract Act 1872, when at the desire of the promisor, the promisee or any other person has done or abstained from doing something, such act or abstinence is called consideration.",
    "category": "Definition"
  },
  {
    "front": "Section 300 IPC",
    "back": "Defines when culpable homicide amounts to murder. Culpable homicide is murder if done with intention to cause death, or with knowledge that the act is likely to cause death.",
    "category": "Section"
  }
]

PAPER TEXT:
{text}
""",

    "mcqs": """
You are an expert LLB law professor. Create multiple choice questions from the following question paper for exam practice.

Rules:
- Base each MCQ on actual legal provisions, cases, or principles from the paper topics
- Exactly 4 options (A, B, C, D) — only one correct
- Include a clear explanation citing the relevant section or case
- Generate AT LEAST 25 MCQs
- Vary difficulty: easy, medium, hard

Return ONLY a valid JSON array, no extra text:
[
  {
    "question": "Under Section 2(d) of the Indian Contract Act 1872, consideration must move at the desire of:",
    "options": {
      "A": "The promisee only",
      "B": "The promisor",
      "C": "Any third party",
      "D": "The court"
    },
    "correct": "B",
    "explanation": "Section 2(d) ICA 1872 states that consideration must move at the desire of the promisor. This was affirmed in Durga Prasad v Baldeo (1880).",
    "difficulty": "medium"
  }
]

PAPER TEXT:
{text}
""",

    "revision_notes": """
You are an expert LLB law professor. Create comprehensive revision notes from the following question paper.

Structure the notes as follows:
# [Subject Name] — Revision Notes

## 1. Subject Overview
Brief overview of the subject and its importance.

## 2. Key Definitions
All important legal terms defined clearly.

## 3. Core Principles & Doctrines
All major legal principles and doctrines.

## 4. Important Statutory Provisions
Table format: Act | Section | What it says

## 5. Landmark Cases
Table format: Case Name | Court & Year | Key Holding

## 6. Frequently Asked Topics
Bullet list of topics that appear repeatedly in this paper.

## 7. Exam Tips
- What to write first
- How to structure answers
- Common mistakes to avoid

## 8. Quick Revision Checklist
Checkbox list of everything to revise before the exam.

Format as clean Markdown. Be thorough and exam-focused.

PAPER TEXT:
{text}
""",
}

###############################################################################
# PRINT LOCK  (thread-safe console output)
###############################################################################

_print_lock = Lock()

def tprint(*args, **kwargs):
    with _print_lock:
        print(*args, **kwargs)

###############################################################################
# PDF TEXT EXTRACTION
###############################################################################

def extract_text(pdf_path: Path) -> str:
    try:
        import pdfplumber
        parts = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    parts.append(t)
        return "\n".join(parts).strip()
    except Exception as ex:
        tprint(f"  [ERROR] extract_text: {ex}")
        return ""

###############################################################################
# LLM CLIENT
###############################################################################

def get_llm_client():
    provider = os.environ.get("LLM_PROVIDER", "gemini").lower()

    if provider == "gemini":
        import google.generativeai as genai
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "Set GEMINI_API_KEY environment variable.\n"
                "Free key: https://aistudio.google.com/app/apikey"
            )
        genai.configure(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        return genai.GenerativeModel(model_name), "gemini"

    if provider == "openai":
        from openai import OpenAI
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Set OPENAI_API_KEY environment variable.")
        return OpenAI(api_key=api_key), "openai"

    raise ValueError(f"Unknown LLM_PROVIDER '{provider}'. Use 'gemini' or 'openai'.")


def call_llm(client, provider: str, prompt: str, retries: int = 3) -> str:
    for attempt in range(1, retries + 1):
        try:
            if provider == "gemini":
                response = client.generate_content(prompt)
                return response.text

            if provider == "openai":
                model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                return response.choices[0].message.content

        except Exception as ex:
            tprint(f"  [WARN] LLM attempt {attempt}/{retries} failed: {ex}")
            if attempt < retries:
                time.sleep(2 ** attempt)

    return ""

###############################################################################
# PARSE RESPONSE
###############################################################################

def parse_response(task: str, raw: str) -> dict | list | str:
    if task == "revision_notes":
        return raw.strip()

    text = raw.strip()

    # Strip ```json ... ``` fences
    text = re.sub(r"^```[a-z]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find first JSON array or object
    match = re.search(r"(\[[\s\S]*\]|\{[\s\S]*\})", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    return raw.strip()

###############################################################################
# SAVE OUTPUT
###############################################################################

def save_output(out_dir: Path, task: str, data: dict | list | str):
    out_dir.mkdir(parents=True, exist_ok=True)

    if task == "revision_notes":
        path = out_dir / "revision_notes.md"
        path.write_text(str(data), encoding="utf-8")
    else:
        path = out_dir / f"{task}.json"
        content = data if isinstance(data, str) else json.dumps(data, indent=2, ensure_ascii=False)
        path.write_text(content, encoding="utf-8")

    tprint(f"    ✓ {task:<20} → {path.name}")

###############################################################################
# RUN ONE TASK  (called from thread pool)
###############################################################################

def run_task(
    task: str,
    text: str,
    out_dir: Path,
    client,
    provider: str,
) -> str:
    """Execute a single generation task. Returns task name on success."""
    tprint(f"    → {task} starting...")
    prompt = PROMPTS[task].format(text=text)
    raw = call_llm(client, provider, prompt)

    if not raw:
        tprint(f"    [SKIP] {task}: empty response")
        return ""

    data = parse_response(task, raw)
    save_output(out_dir, task, data)
    return task

###############################################################################
# PROCESS ONE PDF  (all tasks in parallel)
###############################################################################

def process_pdf(
    pdf_path: Path,
    tasks: list[str],
    client,
    provider: str,
    task_workers: int,
):
    tprint(f"\n{'─'*70}")
    tprint(f"  📄 {pdf_path.name}")
    tprint(f"{'─'*70}")

    # Resolve output directory
    for base, label in [(PAPERS_DIR, "papers"), (DOWNLOADS_DIR, "downloads")]:
        try:
            rel = pdf_path.relative_to(base)
            out_dir = OUTPUT_DIR / label / rel.parent / rel.stem
            break
        except ValueError:
            pass
    else:
        out_dir = OUTPUT_DIR / "other" / pdf_path.stem

    # Determine which tasks still need to be done
    done = {p.stem for p in out_dir.glob("*") if p.is_file()}
    remaining = [t for t in tasks if t not in done]

    if not remaining:
        tprint("  [SKIP] All tasks already completed.")
        return

    # Extract text once
    tprint("  Extracting text...")
    text = extract_text(pdf_path)

    if not text or len(text) < 50:
        tprint("  [SKIP] No readable text (scanned or empty PDF).")
        return

    max_chars = int(os.environ.get("MAX_TEXT_CHARS", "14000"))
    if len(text) > max_chars:
        text = text[:max_chars] + "\n\n[... truncated ...]"

    tprint(f"  Text: {len(text):,} chars  |  Tasks: {', '.join(remaining)}")

    # Fire all remaining tasks concurrently
    with ThreadPoolExecutor(max_workers=min(task_workers, len(remaining))) as pool:
        futures = {
            pool.submit(run_task, task, text, out_dir, client, provider): task
            for task in remaining
        }
        for future in as_completed(futures):
            task = futures[future]
            try:
                result = future.result()
                if not result:
                    tprint(f"  [FAIL] {task}")
            except Exception as ex:
                tprint(f"  [ERROR] {task}: {ex}")

    tprint(f"  ✅ {pdf_path.name} done.")

###############################################################################
# COLLECT PDFS
###############################################################################

def collect_pdfs(dirs: list[Path], recursive: bool = True) -> list[Path]:
    pdfs: list[Path] = []
    for d in dirs:
        if not d.exists():
            tprint(f"[WARN] Not found: {d}")
            continue
        pattern = "**/*.pdf" if recursive else "*.pdf"
        pdfs.extend(sorted(d.glob(pattern)))
    return pdfs

###############################################################################
# CLI
###############################################################################

def parse_args():
    p = argparse.ArgumentParser(
        description="Generate LLB study content from question papers using AI."
    )
    p.add_argument("--input",  "-i", nargs="+", help="Input directories")
    p.add_argument("--file",   "-f", help="Single PDF file")
    p.add_argument("--output", "-o", help="Output directory")
    p.add_argument(
        "--tasks", "-t",
        nargs="+", choices=TASKS, default=TASKS,
        metavar="TASK",
        help=f"Tasks to run. Choices: {', '.join(TASKS)}",
    )
    p.add_argument(
        "--workers", "-w",
        type=int, default=2,
        help="Number of PDFs to process concurrently (default: 2)",
    )
    p.add_argument(
        "--task-workers",
        type=int, default=7,
        help="Number of tasks to run concurrently per PDF (default: 7 = all at once)",
    )
    p.add_argument(
        "--no-recursive",
        action="store_true",
        help="Do not recurse into subdirectories",
    )
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

    tprint("Initializing LLM client...")
    try:
        client, provider = get_llm_client()
        tprint(f"Provider     : {provider}")
    except ValueError as ex:
        tprint(f"[ERROR] {ex}")
        sys.exit(1)

    if args.file:
        pdfs = [Path(args.file)]
    else:
        dirs = [Path(d) for d in args.input] if args.input else [PAPERS_DIR, DOWNLOADS_DIR]
        pdfs = collect_pdfs(dirs, recursive=not args.no_recursive)

    if not pdfs:
        tprint("[ERROR] No PDF files found.")
        sys.exit(1)

    tprint(f"PDFs found   : {len(pdfs)}")
    tprint(f"Tasks        : {', '.join(args.tasks)}")
    tprint(f"PDF workers  : {args.workers}")
    tprint(f"Task workers : {args.task_workers}")
    tprint(f"Output       : {OUTPUT_DIR}")

    # Process PDFs concurrently
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(
                process_pdf,
                pdf,
                args.tasks,
                client,
                provider,
                args.task_workers,
            ): pdf
            for pdf in pdfs
        }
        completed = 0
        for future in as_completed(futures):
            pdf = futures[future]
            completed += 1
            try:
                future.result()
            except Exception as ex:
                tprint(f"[ERROR] {pdf.name}: {ex}")
            tprint(f"\n[{completed}/{len(pdfs)}] PDFs processed so far.")

    tprint(f"\n{'='*70}")
    tprint(f"All done. Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
