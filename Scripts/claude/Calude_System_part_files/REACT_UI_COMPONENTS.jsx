/**
 * LLB Question Bank - React UI Components
 * Modern React components for studying law exam questions
 */

import React, { useState, useEffect } from 'react';
import './styles.css';

// ============================================================================
// 1. MAIN DASHBOARD
// ============================================================================
export const QuestionBankDashboard = () => {
  const [activeTab, setActiveTab] = useState('questions');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [statistics, setStatistics] = useState({
    totalQuestions: 250,
    questionsReviewed: 85,
    masteredQuestions: 42,
    currentStreak: 12,
    averageScore: 78
  });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>📚 LLB Question Bank</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Questions</span>
            <span className="stat-value">{statistics.totalQuestions}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Reviewed</span>
            <span className="stat-value">{statistics.questionsReviewed}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Mastered</span>
            <span className="stat-value">{statistics.masteredQuestions}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Current Streak</span>
            <span className="stat-value">🔥 {statistics.currentStreak}</span>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          ❓ Questions
        </button>
        <button 
          className={`nav-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
          onClick={() => setActiveTab('flashcards')}
        >
          🃏 Flashcards
        </button>
        <button 
          className={`nav-btn ${activeTab === 'mcq' ? 'active' : ''}`}
          onClick={() => setActiveTab('mcq')}
        >
          ✅ MCQ Quiz
        </button>
        <button 
          className={`nav-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          📊 Progress
        </button>
        <button 
          className={`nav-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          📝 Notes
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'questions' && <QuestionsView selectedSubject={selectedSubject} />}
        {activeTab === 'flashcards' && <FlashcardsView />}
        {activeTab === 'mcq' && <MCQQuizView />}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'notes' && <NotesView />}
      </div>
    </div>
  );
};

// ============================================================================
// 2. QUESTIONS VIEW
// ============================================================================
export const QuestionsView = ({ selectedSubject }) => {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      number: '1',
      text: 'Define tort and explain its elements...',
      subject: 'Law of Torts',
      year: 2024,
      marks: 20,
      type: 'Long Answer',
      difficulty: 'Medium'
    },
    // More questions...
  ]);

  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  return (
    <div className="questions-view">
      <div className="questions-filter">
        <select className="filter-select">
          <option value="all">All Subjects</option>
          <option value="tort">Law of Torts</option>
          <option value="criminal">Criminal Law</option>
          <option value="contract">Law of Contract</option>
        </select>
        
        <select className="filter-select">
          <option value="all">All Years</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>

        <select className="filter-select">
          <option value="all">All Types</option>
          <option value="long">Long Answer</option>
          <option value="short">Short Answer</option>
          <option value="mcq">MCQ</option>
        </select>
      </div>

      <div className="questions-list">
        {questions.map((question) => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <div className="question-meta">
                <span className="question-number">Q{question.number}</span>
                <span className="question-marks">{question.marks} Marks</span>
                <span className={`difficulty ${question.difficulty.toLowerCase()}`}>
                  {question.difficulty}
                </span>
              </div>
              <button 
                className="expand-btn"
                onClick={() => setCurrentQuestion(question)}
              >
                📖 View
              </button>
            </div>
            <div className="question-preview">
              <p>{question.text.substring(0, 100)}...</p>
              <div className="question-tags">
                <span className="tag subject-tag">{question.subject}</span>
                <span className="tag year-tag">{question.year}</span>
                <span className="tag type-tag">{question.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentQuestion && (
        <QuestionDetailModal 
          question={currentQuestion}
          onClose={() => setCurrentQuestion(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// 3. QUESTION DETAIL MODAL
// ============================================================================
export const QuestionDetailModal = ({ question, onClose }) => {
  const [activeTab, setActiveTab] = useState('longAnswer');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2>Question {question.number}</h2>
        <div className="modal-meta">
          <span>{question.subject}</span>
          <span>{question.year}</span>
          <span>{question.marks} Marks</span>
        </div>

        <div className="question-text">
          <p>{question.text}</p>
        </div>

        <div className="study-tabs">
          <button 
            className={`tab-btn ${activeTab === 'longAnswer' ? 'active' : ''}`}
            onClick={() => setActiveTab('longAnswer')}
          >
            📝 Long Answer
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shortAnswer' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortAnswer')}
          >
            ⚡ Short Answer
          </button>
          <button 
            className={`tab-btn ${activeTab === 'keyPoints' ? 'active' : ''}`}
            onClick={() => setActiveTab('keyPoints')}
          >
            ✓ Key Points
          </button>
          <button 
            className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            ⚖️ Case Laws
          </button>
          <button 
            className={`tab-btn ${activeTab === 'acts' ? 'active' : ''}`}
            onClick={() => setActiveTab('acts')}
          >
            📜 Acts
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'longAnswer' && (
            <div className="answer-content">
              <h3>Comprehensive Answer (20 Marks)</h3>
              <p>Introduction:</p>
              <p>This question pertains to fundamental legal concepts...</p>
              <p>Main Body:</p>
              <ol>
                <li>Definition and Scope</li>
                <li>Legal Principles</li>
                <li>Application and Examples</li>
              </ol>
              <p>Conclusion: The law recognizes this principle as essential...</p>
            </div>
          )}

          {activeTab === 'shortAnswer' && (
            <div className="answer-content">
              <h3>Short Answer (8 Marks)</h3>
              <p>Tort is a civil wrong (other than breach of contract) which gives rise to a right of action.</p>
              <ul>
                <li>Must involve a legal duty of care</li>
                <li>Breach of that duty</li>
                <li>Actual loss or damage</li>
                <li>Proximate causation between breach and damage</li>
              </ul>
            </div>
          )}

          {activeTab === 'keyPoints' && (
            <div className="key-points">
              <ul>
                <li>✓ Definition of tort</li>
                <li>✓ Elements: Duty, Breach, Causation, Damage</li>
                <li>✓ Types of torts</li>
                <li>✓ Remedies available</li>
                <li>✓ Defenses to tort liability</li>
              </ul>
            </div>
          )}

          {activeTab === 'cases' && (
            <div className="cases-content">
              <div className="case-card">
                <h4>Donoghue v Stevenson</h4>
                <p><strong>Principle:</strong> Duty of Care</p>
                <p><strong>Holding:</strong> Manufacturers owe a duty of care to consumers of their products.</p>
              </div>
              <div className="case-card">
                <h4>Rylands v Fletcher</h4>
                <p><strong>Principle:</strong> Strict Liability</p>
                <p><strong>Holding:</strong> Liability for escape of dangerous things on land.</p>
              </div>
            </div>
          )}

          {activeTab === 'acts' && (
            <div className="acts-content">
              <div className="act-card">
                <h4>Indian Tort Law (Common Law)</h4>
                <p><strong>Sections:</strong> Chapters 1-3</p>
                <p>Establishes principles of tortious liability and remedies.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-primary">📚 Add to Study List</button>
          <button className="btn-secondary">💾 Save Notes</button>
          <button className="btn-secondary">🔖 Bookmark</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. FLASHCARDS VIEW
// ============================================================================
export const FlashcardsView = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState([
    {
      id: 1,
      front: 'What is a tort?',
      back: 'A civil wrong (other than breach of contract) which gives the injured person a right of action for damages.',
      subject: 'Law of Torts',
      difficulty: 'Easy'
    },
    {
      id: 2,
      front: 'What are the essential elements of tort?',
      back: '1. Duty of Care\n2. Breach of Duty\n3. Causation\n4. Damage/Loss',
      subject: 'Law of Torts',
      difficulty: 'Medium'
    },
    // More cards...
  ]);

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="flashcards-view">
      <div className="flashcard-header">
        <h2>🃏 Flashcards: {cards[currentCard]?.subject}</h2>
        <div className="card-counter">
          Card {currentCard + 1} of {cards.length}
        </div>
      </div>

      <div className="flashcard-container">
        <div 
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <p>{cards[currentCard]?.front}</p>
              <span className="flip-hint">Click to reveal answer</span>
            </div>
            <div className="flashcard-back">
              <p>{cards[currentCard]?.back}</p>
              <span className="flip-hint">Click to see question</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button className="btn-secondary" onClick={handlePrevious}>
          ⬅️ Previous
        </button>
        <div className="difficulty-indicator">
          Difficulty: <span className={cards[currentCard]?.difficulty.toLowerCase()}>
            {cards[currentCard]?.difficulty}
          </span>
        </div>
        <button className="btn-secondary" onClick={handleNext}>
          Next ➡️
        </button>
      </div>

      <div className="flashcard-buttons">
        <button className="btn-danger">❌ Incorrect</button>
        <button className="btn-warning">🤔 Difficult</button>
        <button className="btn-success">✅ Correct</button>
      </div>
    </div>
  );
};

// ============================================================================
// 5. MCQ QUIZ VIEW
// ============================================================================
export const MCQQuizView = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: 'Which case established the principle of duty of care?',
      options: [
        'A) Rylands v Fletcher',
        'B) Donoghue v Stevenson',
        'C) Caswell v Powell',
        'D) Tort Law Commission'
      ],
      correct: 'B',
      subject: 'Law of Torts',
      difficulty: 'Easy'
    },
    // More questions...
  ]);

  const handleAnswer = (option) => {
    if (!answered) {
      setSelectedAnswer(option);
      setAnswered(true);
      if (option === questions[currentQuestion].correct) {
        setScore(score + 1);
      }
    }
  };

  return (
    <div className="mcq-view">
      <div className="mcq-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>

      <div className="mcq-container">
        <div className="mcq-header">
          <h3>{questions[currentQuestion]?.subject}</h3>
          <span className="mcq-marks">Marks: 1</span>
        </div>

        <div className="mcq-question">
          <p>{questions[currentQuestion]?.question}</p>
        </div>

        <div className="mcq-options">
          {questions[currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              className={`option-btn ${
                selectedAnswer === option ? 'selected' : ''
              } ${
                answered && option === questions[currentQuestion].correct
                  ? 'correct'
                  : ''
              } ${
                answered && 
                selectedAnswer === option && 
                option !== questions[currentQuestion].correct
                  ? 'incorrect'
                  : ''
              }`}
              onClick={() => handleAnswer(option)}
              disabled={answered}
            >
              {option}
            </button>
          ))}
        </div>

        {answered && (
          <div className={`explanation ${selectedAnswer === questions[currentQuestion].correct ? 'correct' : 'incorrect'}`}>
            {selectedAnswer === questions[currentQuestion].correct ? (
              <p>✅ Correct! {questions[currentQuestion].correct} is the right answer.</p>
            ) : (
              <p>❌ Incorrect. The correct answer is {questions[currentQuestion].correct}.</p>
            )}
          </div>
        )}
      </div>

      <div className="mcq-navigation">
        <button className="btn-secondary" disabled={currentQuestion === 0}>
          ⬅️ Previous
        </button>
        <div className="score-display">
          Score: {score}/{questions.length}
        </div>
        <button 
          className="btn-primary" 
          disabled={!answered || currentQuestion === questions.length - 1}
          onClick={() => {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
            setAnswered(false);
          }}
        >
          Next ➡️
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 6. PROGRESS VIEW
// ============================================================================
export const ProgressView = () => {
  return (
    <div className="progress-view">
      <div className="progress-grid">
        <div className="progress-card">
          <h3>Subject-wise Progress</h3>
          <div className="chart-container">
            <div className="progress-item">
              <span className="subject-name">Law of Torts</span>
              <div className="mini-bar">
                <div className="progress-bar-fill" style={{ width: '75%' }}></div>
              </div>
              <span className="percentage">75%</span>
            </div>
            <div className="progress-item">
              <span className="subject-name">Criminal Law</span>
              <div className="mini-bar">
                <div className="progress-bar-fill" style={{ width: '60%' }}></div>
              </div>
              <span className="percentage">60%</span>
            </div>
            <div className="progress-item">
              <span className="subject-name">Law of Contract</span>
              <div className="mini-bar">
                <div className="progress-bar-fill" style={{ width: '85%' }}></div>
              </div>
              <span className="percentage">85%</span>
            </div>
          </div>
        </div>

        <div className="progress-card">
          <h3>Question Type Distribution</h3>
          <div className="pie-chart">
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
                <span>Long Answer (40%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#2196F3' }}></span>
                <span>MCQ (30%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
                <span>Case Laws (20%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#9C27B0' }}></span>
                <span>Short Answer (10%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="achievement-section">
        <h3>🏆 Achievements</h3>
        <div className="achievements">
          <div className="achievement">
            <span className="achievement-icon">🔥</span>
            <span className="achievement-name">7-Day Streak</span>
          </div>
          <div className="achievement">
            <span className="achievement-icon">⭐</span>
            <span className="achievement-name">50 Questions</span>
          </div>
          <div className="achievement">
            <span className="achievement-icon">🎯</span>
            <span className="achievement-name">80%+ Score</span>
          </div>
          <div className="achievement">
            <span className="achievement-icon">📚</span>
            <span className="achievement-name">All Torts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. NOTES VIEW
// ============================================================================
export const NotesView = () => {
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'Duty of Care Concept',
      content: 'Important to understand that duty of care varies based on the relationship...',
      subject: 'Law of Torts',
      color: 'yellow',
      createdAt: new Date()
    }
  ]);

  return (
    <div className="notes-view">
      <button className="btn-primary add-note-btn">+ New Note</button>
      
      <div className="notes-grid">
        {notes.map((note) => (
          <div key={note.id} className={`note-card color-${note.color}`}>
            <h4>{note.title}</h4>
            <p>{note.content}</p>
            <div className="note-meta">
              <span className="note-subject">{note.subject}</span>
              <div className="note-actions">
                <button>✏️</button>
                <button>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 8. STYLES (CSS)
// ============================================================================
const styles = `
.dashboard-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  text-align: center;
}

.dashboard-header h1 {
  font-size: 2.5em;
  margin: 0 0 30px 0;
}

.header-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  background: rgba(255,255,255,0.2);
  padding: 15px 25px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.stat-value {
  font-size: 1.8em;
  font-weight: bold;
  margin-top: 5px;
}

.dashboard-nav {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.nav-btn.active {
  background: #667eea;
  color: white;
}

.dashboard-content {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Questions View */
.questions-filter {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1em;
}

.questions-list {
  display: grid;
  gap: 15px;
}

.question-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.question-number {
  font-weight: bold;
  font-size: 1.1em;
}

.question-marks {
  background: #FFF3CD;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.9em;
}

.difficulty {
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.9em;
}

.difficulty.easy {
  background: #D4EDDA;
  color: #155724;
}

.difficulty.medium {
  background: #FFF3CD;
  color: #856404;
}

.difficulty.hard {
  background: #F8D7DA;
  color: #721C24;
}

.question-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.85em;
  padding: 4px 10px;
  border-radius: 15px;
}

.subject-tag {
  background: #E3F2FD;
  color: #1976D2;
}

.year-tag {
  background: #F3E5F5;
  color: #7B1FA2;
}

.type-tag {
  background: #E0F2F1;
  color: #00796B;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  padding: 30px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
}

/* Flashcards */
.flashcard-container {
  perspective: 1000px;
  margin: 50px 0;
}

.flashcard {
  position: relative;
  width: 100%;
  height: 400px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flashcard-front, .flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  border-radius: 10px;
  font-size: 1.2em;
}

.flashcard-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: rotateY(0deg);
}

.flashcard-back {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  transform: rotateY(180deg);
}

.flip-hint {
  font-size: 0.8em;
  opacity: 0.7;
  margin-top: 30px;
}

/* MCQ */
.mcq-progress {
  margin-bottom: 30px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}

.mcq-container {
  background: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.mcq-options {
  display: grid;
  gap: 15px;
  margin: 30px 0;
}

.option-btn {
  padding: 15px;
  text-align: left;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.option-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: #F5F7FF;
}

.option-btn.selected {
  border-color: #667eea;
  background: #E8EEFF;
}

.option-btn.correct {
  border-color: #4CAF50;
  background: #D4EDDA;
  color: #155724;
}

.option-btn.incorrect {
  border-color: #DC3545;
  background: #F8D7DA;
  color: #721C24;
}

.option-btn:disabled {
  cursor: not-allowed;
}

/* Buttons */
.btn-primary, .btn-secondary, .btn-danger, .btn-warning, .btn-success {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-danger {
  background: #DC3545;
  color: white;
}

.btn-warning {
  background: #FFC107;
  color: #333;
}

.btn-success {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover { background: #5568D3; }
.btn-secondary:hover { background: #e0e0e0; }
.btn-danger:hover { background: #C82333; }
.btn-warning:hover { background: #E0A800; }
.btn-success:hover { background: #45a049; }

/* Notes */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.note-card {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.color-yellow { background: #FFF3CD; }
.color-blue { background: #D1ECF1; }
.color-green { background: #D4EDDA; }
.color-red { background: #F8D7DA; }
.color-purple { background: #E2D5F3; }

@media (max-width: 768px) {
  .header-stats {
    flex-direction: column;
    align-items: center;
  }

  .dashboard-nav {
    flex-direction: column;
  }

  .nav-btn {
    width: 100%;
  }

  .questions-filter {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .question-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .progress-grid {
    grid-template-columns: 1fr;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
`;

export default QuestionBankDashboard;
