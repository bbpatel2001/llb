#!/usr/bin/env python3
"""
Extract questions from LLB PDF papers into structured format.
Parses PDFs → Detects questions → Stores in database.
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging
from dataclasses import dataclass, asdict
from enum import Enum

try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False
    print("⚠️ pdfplumber not installed. Install with: pip install pdfplumber")

try:
    from pymongo import MongoClient
    HAS_MONGO = True
except ImportError:
    HAS_MONGO = False

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class QuestionType(Enum):
    """Question types in LLB papers"""
    SHORT = "SHORT"
    LONG = "LONG"
    MCQ = "MCQ"
    CASE_STUDY = "CASE_STUDY"
    DESCRIPTIVE = "DESCRIPTIVE"


class DifficultyLevel(Enum):
    """Difficulty classification"""
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


@dataclass
class Question:
    """Question data structure"""
    question_number: str
    question_text: str
    marks: int
    question_type: QuestionType
    difficulty: DifficultyLevel
    tags: List[str]
    options: Optional[List[Dict]] = None
    correct_answer: Optional[str] = None
    
    def to_dict(self):
        return {
            'questionNumber': self.question_number,
            'questionText': self.question_text,
            'marks': self.marks,
            'type': self.question_type.value,
            'difficulty': self.difficulty.value,
            'tags': self.tags,
            'options': self.options,
            'correctAnswer': self.correct_answer,
        }


class QuestionExtractor:
    """Extract questions from PDF texts"""
    
    # Question number patterns
    QUESTION_PATTERNS = [
        r'^Q\.?\s*(\d+\s*[a-zA-Z]?)',           # Q.1, Q.1(a)
        r'^Question\s+(\d+\s*[a-zA-Z]?)',       # Question 1
        r'^(\d+)\s*\.',                          # 1.
        r'^\[?(\d+\s*[a-zA-Z]?)\]?\s*\(',       # 1( or [1](
    ]
    
    # Marks patterns
    MARKS_PATTERNS = [
        r'\((\d+)\s*(?:marks?|points?)\)',      # (5 marks)
        r'\[(\d+)\s*(?:marks?|points?)\]',      # [5 marks]
        r'(?:marks?|points?):\s*(\d+)',         # marks: 5
    ]
    
    # MCQ patterns
    MCQ_PATTERNS = [
        r'^[A-D]\)\s+(.+)',                      # A) Option text
        r'^[A-D]\]\s+(.+)',                      # A] Option text
    ]
    
    # Subject keywords
    SUBJECT_KEYWORDS = {
        'TORTS': ['tort', 'negligence', 'defamation', 'motor vehicle'],
        'CRIMINAL': ['criminal', 'ipc', 'crime', 'offense'],
        'CONTRACT': ['contract', 'agreement', 'sale', 'bailment'],
        'CONSTITUTIONAL': ['constitution', 'administrative', 'government'],
        'FAMILY': ['family', 'marriage', 'divorce', 'succession'],
        'PROPERTY': ['property', 'land', 'transfer', 'registration'],
        'CORPORATE': ['company', 'corporate', 'partnership', 'shares'],
        'LABOUR': ['labour', 'labor', 'employment', 'wages'],
        'EVIDENCE': ['evidence', 'proof', 'testimony'],
        'ENVIRONMENTAL': ['environmental', 'pollution', 'conservation'],
    }
    
    def __init__(self, semester: int, subject: str, university: str, year: int):
        self.semester = semester
        self.subject = subject
        self.university = university
        self.year = year
        self.questions: List[Question] = []
    
    def extract_from_text(self, text: str) -> List[Question]:
        """Extract questions from raw PDF text"""
        self.questions = []
        lines = text.split('\n')
        
        current_question = None
        question_buffer = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if this is a new question
            is_new_question = False
            question_num = None
            
            for pattern in self.QUESTION_PATTERNS:
                match = re.match(pattern, line, re.IGNORECASE)
                if match:
                    is_new_question = True
                    question_num = match.group(1)
                    break
            
            if is_new_question:
                # Save previous question
                if question_buffer:
                    self._parse_question(current_question, '\n'.join(question_buffer))
                
                current_question = question_num
                # Extract question text (everything after the number)
                question_buffer = [re.sub(r'^\d+[a-zA-Z]?\)\s*', '', line)]
            else:
                if current_question is not None:
                    question_buffer.append(line)
        
        # Save last question
        if question_buffer and current_question:
            self._parse_question(current_question, '\n'.join(question_buffer))
        
        return self.questions
    
    def _parse_question(self, q_num: str, q_text: str):
        """Parse individual question"""
        if not q_text.strip():
            return
        
        # Extract marks
        marks = self._extract_marks(q_text)
        if marks is None:
            marks = 5  # Default
        
        # Detect question type
        q_type = self._detect_question_type(q_text)
        
        # Detect difficulty
        difficulty = self._detect_difficulty(marks)
        
        # Extract tags
        tags = self._extract_tags(q_text)
        
        # Handle MCQ separately
        options = None
        correct_answer = None
        if q_type == QuestionType.MCQ:
            options, correct_answer = self._extract_mcq_options(q_text)
            # Remove options from question text
            q_text = self._remove_options_from_text(q_text)
        
        question = Question(
            question_number=q_num,
            question_text=q_text[:500].strip(),  # Limit to 500 chars
            marks=marks,
            question_type=q_type,
            difficulty=difficulty,
            tags=tags,
            options=options,
            correct_answer=correct_answer,
        )
        
        self.questions.append(question)
    
    def _extract_marks(self, text: str) -> Optional[int]:
        """Extract marks from question text"""
        for pattern in self.MARKS_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except (ValueError, IndexError):
                    pass
        return None
    
    def _detect_question_type(self, text: str) -> QuestionType:
        """Detect question type"""
        text_lower = text.lower()
        
        # Check for MCQ
        if re.search(r'^[A-D]\)', text, re.MULTILINE) or \
           text.count('A)') > 0 and text.count('B)') > 0:
            return QuestionType.MCQ
        
        # Check for case study
        if 'read the case' in text_lower or 'consider the following' in text_lower:
            return QuestionType.CASE_STUDY
        
        # Check for short vs long based on keywords
        short_keywords = ['state', 'define', 'name', 'list', 'write']
        long_keywords = ['discuss', 'explain', 'analyze', 'elaborate', 'describe in detail']
        
        has_short = any(f'{kw}' in text_lower for kw in short_keywords)
        has_long = any(f'{kw}' in text_lower for kw in long_keywords)
        
        if has_short and not has_long:
            return QuestionType.SHORT
        elif has_long:
            return QuestionType.LONG
        else:
            return QuestionType.DESCRIPTIVE
    
    def _detect_difficulty(self, marks: int) -> DifficultyLevel:
        """Detect difficulty based on marks"""
        if marks <= 2:
            return DifficultyLevel.EASY
        elif marks <= 5:
            return DifficultyLevel.MEDIUM
        else:
            return DifficultyLevel.HARD
    
    def _extract_tags(self, text: str) -> List[str]:
        """Extract subject tags from question"""
        tags = [self.subject.lower()]
        
        text_lower = text.lower()
        for subject, keywords in self.SUBJECT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    tags.append(keyword)
        
        return list(set(tags))
    
    def _extract_mcq_options(self, text: str) -> Tuple[Optional[List[Dict]], Optional[str]]:
        """Extract MCQ options"""
        options = []
        correct_answer = None
        
        lines = text.split('\n')
        for line in lines:
            match = re.match(r'^([A-D])\)\s+(.+)', line)
            if match:
                label = match.group(1)
                option_text = match.group(2).strip()
                options.append({'label': label, 'text': option_text})
        
        # Try to find correct answer
        for line in lines:
            if re.search(r'correct\s*(?:answer|option).*?([A-D])', line, re.IGNORECASE):
                match = re.search(r'([A-D])', line)
                if match:
                    correct_answer = match.group(1)
        
        return (options if options else None, correct_answer)
    
    def _remove_options_from_text(self, text: str) -> str:
        """Remove MCQ options from question text"""
        lines = [l for l in text.split('\n') 
                if not re.match(r'^[A-D]\)', l)]
        return '\n'.join(lines)


class QuestionExtractorPipeline:
    """Main extraction pipeline"""
    
    def __init__(self, db_connection_string: Optional[str] = None):
        self.papers_dir = Path('c:/projects/LLB/papers/LLB_Papers')
        self.output_dir = Path('c:/projects/LLB/extracted_questions')
        self.output_dir.mkdir(exist_ok=True)
        
        self.db_client = None
        self.db = None
        
        if db_connection_string and HAS_MONGO:
            self.db_client = MongoClient(db_connection_string)
            self.db = self.db_client['llb']
    
    def process_all_papers(self):
        """Process all papers in organized structure"""
        logger.info("Starting question extraction pipeline...")
        
        stats = {
            'total_papers': 0,
            'processed': 0,
            'total_questions': 0,
            'by_semester': {},
            'errors': []
        }
        
        for sem in range(1, 7):
            sem_dir = self.papers_dir / f'Semester-{sem}'
            if not sem_dir.exists():
                continue
            
            stats['by_semester'][f'Semester-{sem}'] = 0
            logger.info(f"\n📖 Processing {sem_dir.name}...")
            
            for pdf_file in sorted(sem_dir.glob('*.pdf')):
                try:
                    stats['total_papers'] += 1
                    questions = self._process_paper(pdf_file, sem)
                    
                    stats['processed'] += 1
                    stats['total_questions'] += len(questions)
                    stats['by_semester'][f'Semester-{sem}'] += len(questions)
                    
                    logger.info(f"  ✓ {pdf_file.name}: {len(questions)} questions")
                
                except Exception as e:
                    error_msg = f"Error processing {pdf_file.name}: {str(e)}"
                    logger.error(f"  ❌ {error_msg}")
                    stats['errors'].append(error_msg)
        
        self._print_summary(stats)
        return stats
    
    def _process_paper(self, pdf_file: Path, semester: int) -> List[Question]:
        """Process single paper"""
        if not HAS_PDF:
            logger.error("pdfplumber not available")
            return []
        
        # Extract metadata from filename
        filename = pdf_file.name
        # Format: Sem[N]_[SUBJECT]_[rest].pdf
        parts = filename.split('_', 2)
        subject = parts[1] if len(parts) > 1 else 'GENERAL'
        
        # Try to extract year
        year = 2020
        if re.search(r'\d{4}', filename):
            year = int(re.search(r'\d{4}', filename).group())
        
        # Determine university
        university = 'UNKNOWN'
        if 'GU' in filename:
            university = 'GU'
        elif 'Trichy' in filename:
            university = 'TRICHY'
        elif 'KES' in filename:
            university = 'KES'
        
        # Extract text
        text = self._extract_pdf_text(pdf_file)
        if not text:
            return []
        
        # Parse questions
        extractor = QuestionExtractor(semester, subject, university, year)
        questions = extractor.extract_from_text(text)
        
        # Store questions
        self._store_questions(pdf_file, semester, subject, questions)
        
        return questions
    
    def _extract_pdf_text(self, pdf_file: Path) -> str:
        """Extract text from PDF"""
        text = ""
        try:
            with pdfplumber.open(str(pdf_file)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.error(f"Failed to extract text from {pdf_file.name}: {e}")
        
        return text
    
    def _store_questions(self, pdf_file: Path, semester: int, subject: str, 
                        questions: List[Question]):
        """Store questions to JSON and optionally MongoDB"""
        
        # Store as JSON
        output_file = self.output_dir / f'sem{semester}_{subject.lower()}.json'
        
        q_dicts = [q.to_dict() for q in questions]
        
        # Append to existing file
        existing = []
        if output_file.exists():
            with open(output_file, 'r') as f:
                existing = json.load(f)
        
        existing.extend(q_dicts)
        
        with open(output_file, 'w') as f:
            json.dump(existing, f, indent=2)
        
        # Store in MongoDB if connected
        if self.db is not None and HAS_MONGO:
            try:
                # Insert questions
                self.db.questions.insert_many(q_dicts)
                
                # Update paper metadata
                self.db.papers.update_one(
                    {'fileName': pdf_file.name},
                    {'$set': {'questionsExtracted': len(questions)}},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Failed to store in MongoDB: {e}")
    
    def _print_summary(self, stats: dict):
        """Print extraction summary"""
        print("\n" + "="*70)
        print("QUESTION EXTRACTION SUMMARY")
        print("="*70)
        print(f"Total papers processed:    {stats['processed']}/{stats['total_papers']}")
        print(f"Total questions extracted: {stats['total_questions']}")
        print(f"\nBy semester:")
        for sem, count in stats['by_semester'].items():
            print(f"  {sem}: {count} questions")
        
        if stats['errors']:
            print(f"\nErrors ({len(stats['errors'])}):")
            for error in stats['errors'][:5]:
                print(f"  - {error}")
            if len(stats['errors']) > 5:
                print(f"  ... and {len(stats['errors']) - 5} more")
        
        print("\n✅ Extraction complete!")
        print(f"📁 Questions saved to: {self.output_dir}/")


def main():
    """Main entry point"""
    pipeline = QuestionExtractorPipeline(
        db_connection_string="mongodb://localhost:27017"
    )
    pipeline.process_all_papers()


if __name__ == '__main__':
    main()
