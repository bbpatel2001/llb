#!/usr/bin/env python3
"""
Reorganize LLB papers into clean semester-based structure.
Intelligently extracts semester info from folder structure and filenames.
"""

import os
import shutil
from pathlib import Path
from typing import Dict, List, Tuple
import re

# Mapping of source folders to their semesters
FOLDER_SEMESTER_MAP = {
    'GU': {
        'Sem-1': 1, 'Sem-2': 2, 'Sem-3': 3, 'Sem-4': 4, 'Sem-5': 5, 'Sem-6': 6
    },
    'Trichy': {
        'Sem1': 1, 'Sem2': 2, 'Sem3': 3, 'Sem4': 4, 'Sem5': 5, 'Sem6': 6
    }
}

# Keywords in filenames that indicate semester
SEMESTER_KEYWORDS = {
    r'sem[-._ ]?1|semester[-._ ]?1|llb[-._ ]?1': 1,
    r'sem[-._ ]?2|semester[-._ ]?2|llb[-._ ]?2': 2,
    r'sem[-._ ]?3|semester[-._ ]?3|llb[-._ ]?3': 3,
    r'sem[-._ ]?4|semester[-._ ]?4|llb[-._ ]?4': 4,
    r'sem[-._ ]?5|semester[-._ ]?5|llb[-._ ]?5': 5,
    r'sem[-._ ]?6|semester[-._ ]?6|llb[-._ ]?6': 6,
}

# Subject classification for better organization
SUBJECT_KEYWORDS = {
    'criminal': ['criminal', 'ipc', 'procedure code', 'crpc', 'criminal procedure', 'bnss'],
    'torts': ['tort', 'negligence', 'defamation', 'nuisance', 'motor vehicle', 'consumer'],
    'contract': ['contract', 'special contract', 'sale', 'bailment', 'agency'],
    'constitutional': ['constitution', 'constitutional', 'administrative', 'public law'],
    'civil': ['civil', 'suit', 'cpc', 'code of civil procedure', 'limitation'],
    'corporate': ['company', 'corporate', 'partnership', 'llp'],
    'family': ['family', 'marriage', 'divorce', 'succession', 'hindu', 'muslim'],
    'labour': ['labour', 'labor', 'employment', 'wages', 'industrial'],
    'property': ['property', 'land', 'transfer', 'registration'],
}


def extract_semester_from_path(file_path: str) -> int:
    """Extract semester from file path structure"""
    parts = file_path.lower().split(os.sep)
    
    for part in parts:
        for semester, sem_num in FOLDER_SEMESTER_MAP.get('Trichy', {}).items():
            if semester.lower() in part:
                return sem_num
        for semester, sem_num in FOLDER_SEMESTER_MAP.get('GU', {}).items():
            if semester.lower() in part:
                return sem_num
    
    return None


def extract_semester_from_filename(filename: str) -> int:
    """Extract semester from filename using keyword matching"""
    filename_lower = filename.lower()
    
    for pattern, semester in SEMESTER_KEYWORDS.items():
        if re.search(pattern, filename_lower):
            return semester
    
    return None


def classify_subject(filename: str) -> str:
    """Classify paper by subject based on keywords"""
    filename_lower = filename.lower()
    
    for subject, keywords in SUBJECT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in filename_lower:
                return subject
    
    return 'general'


def get_semester(file_path: str, filename: str) -> int:
    """Determine semester from path first, then filename"""
    sem = extract_semester_from_path(file_path)
    if sem:
        return sem
    
    sem = extract_semester_from_filename(filename)
    if sem:
        return sem
    
    # Default: try to infer from Trichy structure
    if 'trichy' in file_path.lower():
        for part in file_path.lower().split(os.sep):
            match = re.search(r'sem(\d)', part)
            if match:
                return int(match.group(1))
    
    return None


def organize_papers():
    """Main reorganization logic"""
    papers_dir = Path('c:\\projects\\LLB\\papers')
    organized_dir = papers_dir / 'LLB_Organized'
    
    # Create organized directory
    organized_dir.mkdir(exist_ok=True)
    
    # Create semester folders
    for sem in range(1, 7):
        (organized_dir / f'Semester-{sem}').mkdir(exist_ok=True)
    
    stats = {
        'moved': 0,
        'skipped': 0,
        'unknown_semester': [],
        'by_semester': {i: 0 for i in range(1, 7)}
    }
    
    # Process all PDFs
    print("🔍 Scanning papers...")
    pdf_files = list(papers_dir.rglob('*.pdf'))
    print(f"Found {len(pdf_files)} PDF files\n")
    
    for pdf_file in pdf_files:
        try:
            # Skip files in organized or scripts directories
            if 'organized' in str(pdf_file).lower() or 'script' in str(pdf_file).lower():
                continue
            
            filename = pdf_file.name
            semester = get_semester(str(pdf_file), filename)
            
            if semester and 1 <= semester <= 6:
                # Create clean filename with subject prefix
                subject = classify_subject(filename)
                new_name = f"Sem{semester}_{subject.upper()}_{filename}"
                
                dest = organized_dir / f'Semester-{semester}' / new_name
                
                # Avoid duplicates
                if not dest.exists():
                    shutil.copy2(pdf_file, dest)
                    stats['moved'] += 1
                    stats['by_semester'][semester] += 1
                    print(f"✓ {filename[:50]:50s} → Semester-{semester}")
                else:
                    stats['skipped'] += 1
            else:
                stats['unknown_semester'].append(filename)
                print(f"⚠ {filename[:50]:50s} → Could not determine semester")
        
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")
            stats['skipped'] += 1
    
    # Print statistics
    print("\n" + "="*70)
    print("REORGANIZATION SUMMARY")
    print("="*70)
    print(f"✓ Files moved: {stats['moved']}")
    print(f"⚠ Files skipped: {stats['skipped']}")
    print(f"? Unknown semester: {len(stats['unknown_semester'])}")
    print("\nFiles by semester:")
    for sem in range(1, 7):
        count = stats['by_semester'][sem]
        print(f"  Semester-{sem}: {count:3d} files")
    
    if stats['unknown_semester']:
        print(f"\nFiles with unknown semester ({len(stats['unknown_semester'])}):")
        for f in stats['unknown_semester'][:10]:
            print(f"  - {f}")
        if len(stats['unknown_semester']) > 10:
            print(f"  ... and {len(stats['unknown_semester']) - 10} more")
    
    print("\n✅ Organized papers saved to: LLB_Organized/")
    print("   Original papers are preserved (not deleted)")


if __name__ == '__main__':
    try:
        organize_papers()
    except KeyboardInterrupt:
        print("\n\n⚠️ Operation cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
