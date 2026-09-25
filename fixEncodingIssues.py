#!/usr/bin/env python3
"""
Fix encoding and Unicode issues in extracted questions.
Handles corrupted characters from OCR and PDF extraction.
"""

import json
import re
from pathlib import Path
from typing import Dict, Any, List

class EncodingFixer:
    """Fix encoding issues in question text."""
    
    # Map of common corruption patterns
    CORRUPTION_FIXES = {
        # Replace sequences of dots/weird characters that should be words
        r'\.{2,}': '',  # Remove multiple dots
        r'\s+': ' ',    # Normalize whitespace
    }
    
    # Questions in different languages might have specific markers
    HINDI_MARKERS = ['ख', 'क', 'च', 'ज', 'ट', 'त', 'ण', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह']
    
    def __init__(self):
        self.removed_count = 0
        self.fixed_count = 0

    def has_meaningful_content(self, text: str) -> bool:
        """Check if text has actual meaningful words (not just dots and symbols)."""
        if not text or len(text.strip()) < 5:
            return False
        
        # Count actual letters/words
        letter_count = sum(1 for c in text if c.isalpha())
        dot_count = text.count('.')
        space_count = text.count(' ')
        number_count = sum(1 for c in text if c.isdigit())
        
        # Should have meaningful letter content
        if letter_count < 3:
            return False
        
        # Too many dots relative to letters = corrupted
        if dot_count > letter_count * 2:
            return False
        
        return True

    def is_mostly_corrupted(self, text: str) -> bool:
        """Check if text is mostly garbage/corrupted."""
        if not text:
            return True
        
        text = text.strip()
        if len(text) < 5:
            return True
        
        # Check for high percentage of non-alphanumeric characters
        valid_chars = sum(1 for c in text if c.isalnum() or c in ' .,()[]{}:;-')
        if valid_chars / len(text) < 0.3:  # Less than 30% valid chars
            return True
        
        return False

    def clean_corrupted_question(self, question: Dict[str, Any]) -> Dict[str, Any] | None:
        """Try to salvage a corrupted question."""
        text = question.get('questionText', '').strip()
        
        # If completely corrupted, mark for removal
        if self.is_mostly_corrupted(text):
            self.removed_count += 1
            return None
        
        # Clean up obvious issues
        cleaned = re.sub(r'\s+', ' ', text)  # Normalize spaces
        cleaned = re.sub(r'\.+', '.', cleaned)  # Reduce multiple dots
        
        question['questionText'] = cleaned
        self.fixed_count += 1
        return question

    def filter_valid_questions(self, questions: List[Dict]) -> List[Dict]:
        """Filter out corrupted questions and keep valid ones."""
        valid = []
        
        for q in questions:
            text = q.get('questionText', '').strip()
            
            # Skip if mostly corrupted
            if self.is_mostly_corrupted(text):
                self.removed_count += 1
                continue
            
            # Keep questions that have reasonable content
            if self.has_meaningful_content(text):
                valid.append(q)
            else:
                self.removed_count += 1
        
        return valid

    def process_file(self, filepath: str) -> Dict[str, Any]:
        """Process a single file and return stats."""
        stats = {
            'file': Path(filepath).name,
            'original': 0,
            'removed': 0,
            'kept': 0,
            'error': None
        }
        
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                questions = json.load(f)
            
            stats['original'] = len(questions)
            
            # Filter out corrupted questions
            cleaned = self.filter_valid_questions(questions)
            
            stats['removed'] = len(questions) - len(cleaned)
            stats['kept'] = len(cleaned)
            
            # Save cleaned version
            backup_path = str(filepath).replace('.json', '.json.bak2')
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(cleaned, f, ensure_ascii=False, indent=2)
            
            return stats
            
        except Exception as e:
            stats['error'] = str(e)
            return stats

    def process_directory(self, directory: str) -> None:
        """Process all JSON files."""
        dir_path = Path(directory)
        json_files = sorted(dir_path.glob('*.json'))
        
        print("\n" + "=" * 70)
        print("ENCODING ISSUE FIXER")
        print("=" * 70)
        print(f"\nProcessing {len(json_files)} files from: {directory}\n")
        
        all_stats = []
        total_removed = 0
        total_kept = 0
        
        for json_file in json_files:
            stats = self.process_file(str(json_file))
            all_stats.append(stats)
            total_removed += stats['removed']
            total_kept += stats['kept']
            
            status = f"✓" if not stats['error'] else "✗ ERROR"
            print(f"{status} {stats['file']:<30} {stats['original']:>4} → {stats['kept']:>4} "
                  f"(removed {stats['removed']:>3})")
            
            if stats['error']:
                print(f"    Error: {stats['error']}")
        
        print("\n" + "-" * 70)
        print(f"TOTAL: Removed {total_removed} corrupted questions, Kept {total_kept} valid questions")
        print("-" * 70)

def main():
    """Main entry point."""
    extracted_dir = r"c:\projects\LLB\extracted_questions"
    
    fixer = EncodingFixer()
    fixer.process_directory(extracted_dir)
    
    print("\nEncoding fixes complete!")
    print("Backups saved with .json.bak2 extension")


if __name__ == '__main__':
    main()
