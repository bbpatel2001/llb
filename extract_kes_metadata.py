#!/usr/bin/env python3
"""
Extract metadata from KES PDFs to understand their semester/subject.
Uses pdfplumber to read first few pages and detect semester info.
"""

import os
import json
from pathlib import Path
from typing import Dict, Optional
import re

try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False
    print("⚠️ pdfplumber not installed. Install with: pip install pdfplumber")

# Subject mapping from content keywords
SUBJECT_PATTERNS = {
    'criminal_law': r'criminal|ipc|procedure code|crpc|bnss',
    'torts': r'tort|negligence|defamation|motor vehicle|consumer',
    'contract': r'contract|sale|bailment|agency',
    'constitutional': r'constitution|administrative|public law',
    'family': r'family|marriage|divorce|succession|hindu|muslim',
    'property': r'property|transfer|registration|land',
    'corporate': r'company|corporate|partnership|llp',
    'labour': r'labour|labor|employment|wages',
    'banking': r'banking|finance',
    'evidence': r'evidence|proof',
    'environmental': r'environmental|pollution',
}


def extract_semester_from_content(text: str) -> Optional[int]:
    """Extract semester from PDF content"""
    lines = text.lower()
    
    # Look for explicit semester markers
    patterns = [
        (r'semester\s+([1-6])', 1),
        (r'sem[-._ ]?([1-6])', 1),
        (r'year\s+([1-3])', 'year'),  # Convert year to semester range
        (r'([1-3])\s*year', 'year'),
    ]
    
    for pattern, sem_type in patterns:
        match = re.search(pattern, lines)
        if match:
            value = int(match.group(1))
            if sem_type == 'year':
                # Convert year to semester ranges
                if value == 1:
                    return 1  # 1-year = Sem 1-2
                elif value == 2:
                    return 3  # 2-year = Sem 3-4
                elif value == 3:
                    return 5  # 3-year = Sem 5-6
            else:
                return value
    
    return None


def extract_subject_from_content(text: str) -> str:
    """Identify subject from PDF content"""
    text_lower = text.lower()
    
    for subject, pattern in SUBJECT_PATTERNS.items():
        if re.search(pattern, text_lower):
            return subject
    
    return 'general'


def analyze_kes_papers(papers_dir: str = 'c:\\projects\\LLB\\papers\\KES_LLB_Papers'):
    """Analyze KES papers to extract metadata"""
    
    if not HAS_PDF:
        print("Skipping PDF analysis - pdfplumber not available")
        return
    
    papers_path = Path(papers_dir)
    metadata = {}
    
    pdf_files = sorted(papers_path.glob('*.pdf'))
    print(f"Analyzing {len(pdf_files)} KES papers...\n")
    
    for i, pdf_file in enumerate(pdf_files, 1):
        if i % 20 == 0:
            print(f"Progress: {i}/{len(pdf_files)}...")
        
        try:
            with pdfplumber.open(pdf_file) as pdf:
                # Extract text from first 2 pages
                text = ""
                for page in pdf.pages[:2]:
                    text += page.extract_text() or ""
                
                semester = extract_semester_from_content(text)
                subject = extract_subject_from_content(text)
                
                metadata[pdf_file.name] = {
                    'semester': semester,
                    'subject': subject,
                    'first_page_text': text[:200]  # Store first 200 chars for manual review
                }
        
        except Exception as e:
            metadata[pdf_file.name] = {
                'error': str(e),
                'semester': None,
                'subject': None
            }
    
    # Save results
    output_file = papers_path / 'kes_metadata.json'
    with open(output_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Summary
    by_semester = {}
    for data in metadata.values():
        sem = data.get('semester')
        if sem:
            by_semester[sem] = by_semester.get(sem, 0) + 1
    
    print("\n" + "="*70)
    print("ANALYSIS RESULTS")
    print("="*70)
    print(f"Total papers analyzed: {len(metadata)}")
    print("\nBy semester:")
    for sem in range(1, 7):
        count = by_semester.get(sem, 0)
        print(f"  Semester {sem}: {count} papers")
    
    unknown = len([d for d in metadata.values() if d.get('semester') is None])
    print(f"\nUnknown semester: {unknown} papers")
    
    print(f"\n✅ Metadata saved to: {output_file}")
    print("   Review this file to manually assign unknown semesters")


if __name__ == '__main__':
    analyze_kes_papers()
