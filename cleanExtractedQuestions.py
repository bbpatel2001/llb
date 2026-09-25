#!/usr/bin/env python3
"""
Clean and repair extracted question data from PDFs.
Removes watermarks, metadata, OCR artifacts, and fixes encoding issues.
"""

import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any

class QuestionCleaner:
    """Clean extracted question data."""
    
    def __init__(self):
        self.watermark_patterns = [
            r'Instagram\s*:\s*@\w+',
            r'www\.[\w\.]+\.(in|com)',
            r'Seat\s+No\.\s*:.*?(?=\n|$)',
            r'\[?Max\.\s+Marks?\s*:\s*\d+\]?',
            r'\[?Time\s*:\s*[\d.:HPM\s]+\]?',
            r'P\.T\.O\.',
            r'P\.T\.0\.',
            r'Instructions?\s*:\s*.*?(?=\n\n|\n[0-9]|$)',
            r'(?:NG|MD|ME|MF|NP|JV|JT)-\d+\s+[0-9P.TO]*',
            r'(?:January|February|March|April|May|June|July|August|September|October|November|December)[-–]\d{4}',
            r'LL\.B\.,?\s+Sem\.\s*-?\s*[IVivx]+',
            r'\d{3}\s+[-–]\s+(?:Law|Contract|Constitutional)',
            r'(?:LONG|SHORT|MCQ|DESCRIPTIVE|MULTIPLE)\s+(?:\d+\s+)?marks?',
            r'^[a-z]\s*$',  # Single orphan letters
            r'^[a-z]\n',
            r'\n[a-z]\n',
        ]
        
        self.metadata_line_patterns = [
            r'^[a-z]\s*$',
            r'^[a-z]\.\s*$',
            r'^\.?\s*$',
            r'^(w|i|s|l|a|e|n|r|o|f)\s*$',
            r'^\s*[\.]?\s*$',
        ]
        
        self.encoding_patterns = [
            (r'\\ue\d{3}', ''),  # Remove Unicode escape sequences
            (r'[^\x00-\x7F]+', ''),  # Remove non-ASCII if corrupted
        ]

    def is_valid_question(self, question: Dict[str, Any]) -> bool:
        """Check if a question has meaningful content."""
        text = question.get('questionText', '').strip()
        
        # Filter out questions that are too short or only numbers
        if not text or len(text) < 10:
            return False
        
        # Filter questions that are just marks and metadata
        if re.match(r'^[\d\.\s\-:]*$', text):
            return False
        
        # Check if it's actual question content (not metadata)
        if text.lower().startswith(('seat no', 'time', 'marks', 'instruction', 'max.', 'note:', 'page')):
            return False
        
        return True

    def clean_text(self, text: str) -> str:
        """Remove watermarks and metadata from question text."""
        if not text:
            return ""
        
        # Remove watermark patterns
        for pattern in self.watermark_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.MULTILINE)
        
        # Remove single orphan letters/artifacts on their own lines
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Skip lines that are just metadata or OCR artifacts
            if re.match(self.metadata_line_patterns[0], line.strip()) or \
               re.match(self.metadata_line_patterns[1], line.strip()) or \
               re.match(self.metadata_line_patterns[2], line.strip()) or \
               re.match(self.metadata_line_patterns[3], line.strip()) or \
               re.match(self.metadata_line_patterns[4], line.strip()):
                continue
            
            # Clean up the line
            clean_line = line.strip()
            if clean_line:
                cleaned_lines.append(clean_line)
        
        # Join back and clean up extra whitespace
        text = ' '.join(cleaned_lines)
        
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common OCR artifacts
        text = re.sub(r'\b(withoiut|Fedweral|Govaernment|Expiain|Cripps\s+Miission)\b', 
                      lambda m: {
                          'withoiut': 'without',
                          'Fedweral': 'Federal',
                          'Govaernment': 'Government',
                          'Expiain': 'Explain',
                          'Cripps\s+Miission': 'Cripps Mission'
                      }.get(m.group(0).lower(), m.group(0)), text, flags=re.IGNORECASE)
        
        # Remove Unicode escape sequences if present
        text = re.sub(r'\\ue[0-9a-fA-F]{3}', '', text)
        
        # Clean up question-answer separators
        text = re.sub(r'\bOR\s+', ' OR ', text)
        
        # Fix common spacing issues
        text = re.sub(r'\s+\.', '.', text)
        text = re.sub(r'\s+,', ',', text)
        text = re.sub(r'\(\s+', '(', text)
        text = re.sub(r'\s+\)', ')', text)
        
        return text.strip()

    def deduplicate_questions(self, questions: List[Dict]) -> List[Dict]:
        """Remove exact duplicate questions."""
        seen = set()
        unique = []
        
        for q in questions:
            text_hash = hash(q.get('questionText', '').lower().strip())
            if text_hash not in seen:
                seen.add(text_hash)
                unique.append(q)
        
        return unique

    def renumber_questions(self, questions: List[Dict]) -> List[Dict]:
        """Re-number questions sequentially, accounting for OR alternatives."""
        renumbered = []
        q_num = 1
        
        for q in questions:
            text = q.get('questionText', '').strip()
            
            # Check if this is an OR alternative (shouldn't increment number)
            if text.startswith('OR') or text.startswith('or'):
                q['questionNumber'] = str(q_num - 1) + '_alt'
            else:
                q['questionNumber'] = str(q_num)
                q_num += 1
            
            renumbered.append(q)
        
        return renumbered

    def clean_file(self, filepath: str) -> List[Dict]:
        """Clean a single JSON question file."""
        print(f"Processing: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                questions = json.load(f)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            print(f"  ERROR reading file: {e}")
            return []
        
        # Clean each question
        cleaned = []
        for q in questions:
            if self.is_valid_question(q):
                q['questionText'] = self.clean_text(q.get('questionText', ''))
                cleaned.append(q)
        
        # Deduplicate
        cleaned = self.deduplicate_questions(cleaned)
        
        # Renumber
        cleaned = self.renumber_questions(cleaned)
        
        print(f"  Original: {len(questions)} → Cleaned: {len(cleaned)} questions")
        
        return cleaned

    def process_directory(self, directory: str) -> None:
        """Process all JSON files in a directory."""
        dir_path = Path(directory)
        json_files = list(dir_path.glob('*.json'))
        
        print(f"\nFound {len(json_files)} JSON files in {directory}\n")
        
        for json_file in json_files:
            try:
                cleaned_questions = self.clean_file(str(json_file))
                
                if cleaned_questions:
                    # Save cleaned version
                    backup_path = str(json_file).replace('.json', '.json.backup')
                    os.rename(str(json_file), backup_path)
                    print(f"  Backed up to: {backup_path}")
                    
                    with open(str(json_file), 'w', encoding='utf-8') as f:
                        json.dump(cleaned_questions, f, ensure_ascii=False, indent=2)
                    print(f"  Saved cleaned: {json_file}\n")
                else:
                    print(f"  WARNING: No valid questions found after cleaning\n")
                    
            except Exception as e:
                print(f"  ERROR processing {json_file}: {e}\n")

    def generate_report(self, directory: str) -> None:
        """Generate a report of cleaning results."""
        dir_path = Path(directory)
        report = []
        report.append("=" * 60)
        report.append("QUESTION CLEANING REPORT")
        report.append("=" * 60)
        
        for json_file in sorted(dir_path.glob('*.json')):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    questions = json.load(f)
                
                valid_count = sum(1 for q in questions if self.is_valid_question(q))
                report.append(f"\n{json_file.name}")
                report.append(f"  Total questions: {len(questions)}")
                report.append(f"  Valid questions: {valid_count}")
                
                if questions:
                    sample = questions[0].get('questionText', '')[:100]
                    report.append(f"  Sample: {sample}...")
                    
            except Exception as e:
                report.append(f"\n{json_file.name}: ERROR - {e}")
        
        report.append("\n" + "=" * 60)
        
        report_text = '\n'.join(report)
        print(report_text)
        
        # Save report
        report_path = os.path.join(directory, 'CLEANING_REPORT.txt')
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_text)
        
        print(f"\nReport saved to: {report_path}")


def main():
    """Main entry point."""
    extracted_dir = r"c:\projects\LLB\extracted_questions"
    
    cleaner = QuestionCleaner()
    
    print("Starting question data cleaning...\n")
    cleaner.process_directory(extracted_dir)
    
    print("\nGenerating report...\n")
    cleaner.generate_report(extracted_dir)
    
    print("\nCleaning complete!")
    print(f"All files have been cleaned and backups saved with .json.backup extension")


if __name__ == '__main__':
    main()
