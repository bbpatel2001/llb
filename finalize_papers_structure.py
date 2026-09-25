#!/usr/bin/env python3
"""
Finalize paper organization:
1. Move LLB_Organized to replace old papers structure
2. Keep originals in a backup folder
3. Create a manifest CSV
"""

import os
import shutil
from pathlib import Path
from datetime import datetime
import csv

def finalize_structure():
    """Move organized papers and clean up"""
    
    base_dir = Path('c:\\projects\\LLB\\papers')
    organized_dir = base_dir / 'LLB_Organized'
    backup_dir = base_dir / '.BACKUP_Original_Flat_Structure'
    final_papers_dir = base_dir / 'LLB_Papers'
    
    print("🔄 Finalizing paper structure...\n")
    
    # Step 1: Create backup of flat structure
    print("Step 1: Creating backup of original flat structure...")
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    backup_dir.mkdir(exist_ok=True)
    
    # Backup the confusing folders
    for folder in ['GU', 'KES_LLB_Papers', 'Trichy']:
        src = base_dir / folder
        if src.exists():
            dst = backup_dir / folder
            shutil.copytree(src, dst)
            print(f"  ✓ Backed up {folder}/")
    
    # Step 2: Rename organized to final location
    print("\nStep 2: Moving organized structure to final location...")
    if final_papers_dir.exists():
        shutil.rmtree(final_papers_dir)
    organized_dir.rename(final_papers_dir)
    print(f"  ✓ Moved to {final_papers_dir.name}/")
    
    # Step 3: Generate manifest
    print("\nStep 3: Generating manifest...")
    manifest_file = base_dir / 'PAPERS_MANIFEST.csv'
    
    rows = [['Semester', 'Subject', 'File Count', 'Files']]
    total_files = 0
    
    for sem_folder in sorted(final_papers_dir.glob('Semester-*')):
        papers = list(sem_folder.glob('*.pdf'))
        
        by_subject = {}
        for paper in papers:
            # Extract subject from filename
            name = paper.name
            if name.startswith('Sem'):
                parts = name.split('_', 2)
                subject = parts[1] if len(parts) > 1 else 'GENERAL'
            else:
                subject = 'OTHER'
            
            if subject not in by_subject:
                by_subject[subject] = []
            by_subject[subject].append(name)
        
        for subject, files in sorted(by_subject.items()):
            rows.append([
                sem_folder.name,
                subject,
                len(files),
                '; '.join(files[:3]) + ('...' if len(files) > 3 else '')
            ])
            total_files += len(files)
    
    with open(manifest_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    
    print(f"  ✓ Manifest saved: {manifest_file.name}")
    print(f"  ✓ Total files: {total_files}")
    
    # Step 4: Summary
    print("\n" + "="*70)
    print("STRUCTURE FINALIZATION COMPLETE")
    print("="*70)
    print("\nNew structure:")
    print(f"  📁 {final_papers_dir.name}/")
    for sem in range(1, 7):
        sem_folder = final_papers_dir / f'Semester-{sem}'
        if sem_folder.exists():
            count = len(list(sem_folder.glob('*.pdf')))
            print(f"     Semester-{sem}/  ({count} files)")
    
    print(f"\n💾 Original structure backed up:")
    print(f"  📁 {backup_dir.name}/")
    print(f"     Contains: GU/, KES_LLB_Papers/, Trichy/")
    
    print(f"\n📋 Manifest generated:")
    print(f"  📄 {manifest_file.name}")
    
    print(f"\n✅ Done! Papers are now organized by semester.")
    print(f"\nNext steps:")
    print(f"  1. Review the manifest to verify organization")
    print(f"  2. The original papers are safely backed up")
    print(f"  3. Delete backup when you're confident with new structure")


if __name__ == '__main__':
    try:
        finalize_structure()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
