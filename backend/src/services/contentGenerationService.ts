import { Answer } from '../models/Answer';
import { Flashcard, FlashcardDeck } from '../models/Flashcard';
import { Timeline, ITimelineEvent } from '../models/Timeline';
import { Question } from '../models/index';
import { QuestionDeduplicationService } from './questionDeduplicationService';

const MAX_FLASHCARDS_PER_REQUEST = 1000;

function isReadableQuestion(question: any): boolean {
  const text = typeof question.questionText === 'string' ? question.questionText : '';
  const letterCount = (text.match(/\p{L}/gu) || []).length;
  return text.length > 0 && !/[\uE000-\uF8FF\uFFFD]/u.test(text) && letterCount >= 3;
}

function normalizeFlashcardKey(value: unknown): string {
  return typeof value === 'string'
    ? value.toLowerCase().replace(/\s+/g, ' ').replace(/[^\p{L}\p{N}\s]/gu, '').trim()
    : '';
}

function isReadableFlashcardText(value: unknown): boolean {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  const letterCount = (text.match(/\p{L}/gu) || []).length;
  const nonWordCount = (text.match(/[^\p{L}\p{N}\s.,?'’():;\-\/]/gu) || []).length;
  const mixedAlphaNumericTokens = text
    .split(/\s+/)
    .filter((token) => /[A-Za-z]/.test(token) && /\d/.test(token)).length;

  return Boolean(
    text.length >= 20
      && letterCount >= 10
      && mixedAlphaNumericTokens <= 1
      && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uE000-\uF8FF\uFFFD]/u.test(text)
      && nonWordCount / text.length <= 0.2
  );
}

interface VerifiedFlashcardOption {
  label: string;
  text: string;
  explanation?: string;
}

function normalizeAnswer(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[.)]$/, '') : '';
}

/**
 * Return options only when the source contains a complete, unambiguous answer key.
 * A missing or unmatched key is deliberately treated as non-MCQ content.
 */
function getVerifiedFlashcardOptions(question: any): {
  options: VerifiedFlashcardOption[];
  correctAnswer: string;
} | undefined {
  if (!Array.isArray(question.options) || question.options.length < 2) return undefined;

  const options = question.options
    .map((option: any) => ({
      label: typeof option?.label === 'string' ? option.label.trim() : '',
      text: typeof option?.text === 'string' ? option.text.trim() : '',
      explanation: typeof option?.explanation === 'string' && option.explanation.trim()
        ? option.explanation.trim()
        : undefined,
    }))
    .filter((option: VerifiedFlashcardOption) => option.label && option.text);

  if (options.length < 2 || new Set(options.map((option: VerifiedFlashcardOption) => normalizeAnswer(option.label))).size !== options.length) {
    return undefined;
  }

  const correctAnswer = normalizeAnswer(question.correctAnswer);
  const correctOption = options.find((option: VerifiedFlashcardOption) =>
    normalizeAnswer(option.label) === correctAnswer || normalizeAnswer(option.text) === correctAnswer
  );

  if (!correctOption) return undefined;

  return { options, correctAnswer: correctOption.label };
}

/**
 * Content Generation Service
 * Generates answers, flashcards, timelines, and other study materials
 */

export class ContentGenerationService {
  /**
   * Generate short answer for a question
   */
  static async generateShortAnswer(questionId: string): Promise<any> {
    try {
      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');

      // Check if answer already exists
      let answer = await Answer.findOne({ questionId });
      if (answer) return answer;

      // Generate basic answer structure from question
      const answerText = this._generateAnswerFromQuestion(question);
      const keyPoints = this._extractKeyPoints(answerText);

      answer = new Answer({
        questionId,
        paperId: (question as any).paperId,
        type: 'short',
        text: answerText,
        wordCount: answerText.split(' ').length,
        keyPoints,
        difficulty: this._classifyDifficulty((question as any).marks),
        generatedBy: 'ai',
        qualityScore: 7,
        verified: false,
      });

      await answer.save();
      return answer;
    } catch (error) {
      throw new Error(`Failed to generate short answer: ${error}`);
    }
  }

  /**
   * Generate long answer
   */
  static async generateLongAnswer(questionId: string): Promise<any> {
    try {
      const question = await Question.findById(questionId);
      if (!question) throw new Error('Question not found');

      let answer = await Answer.findOne({ questionId, type: 'long' });
      if (answer) return answer;

      const answerText = this._generateDetailedAnswer(question);
      const keyPoints = this._extractKeyPoints(answerText);
      const casesReferred = this._extractCases(answerText);
      const actsReferred = this._extractActs(answerText);

      answer = new Answer({
        questionId,
        paperId: (question as any).paperId,
        type: 'long',
        text: answerText,
        wordCount: answerText.split(' ').length,
        keyPoints,
        casesReferred,
        actsReferred,
        studyTips: this._generateStudyTips(question),
        difficulty: this._classifyDifficulty((question as any).marks),
        generatedBy: 'ai',
        qualityScore: 7,
        verified: false,
      });

      await answer.save();
      return answer;
    } catch (error) {
      throw new Error(`Failed to generate long answer: ${error}`);
    }
  }

  /**
   * Generate flashcards for a subject/semester
   */
  static async generateFlashcards(
    subject: string,
    semester: number,
    limit: number = MAX_FLASHCARDS_PER_REQUEST
  ): Promise<any> {
    try {
      // Check if deck already exists
      let deck = await FlashcardDeck.findOne({ subject, semester });
      if (!deck) {
        deck = new FlashcardDeck({
          name: `${subject} - Semester ${semester}`,
          subject,
          semester,
          description: `Flashcards for ${subject} Semester ${semester}`,
          isPublic: true,
          createdBy: 'system',
        });
        await deck.save();
      }

      // Get readable, unique source questions in a stable order. Different imported
      // Question documents must not create duplicate cards in the same deck.
      const seenQuestionTexts = new Set<string>();
      const questions = (await Question.find({ subject, semester }).sort({ createdAt: 1, _id: 1 }))
        .filter(isReadableQuestion)
        .filter((question) => {
          const normalized = QuestionDeduplicationService.normalizeQuestionText(question.questionText);
          if (!normalized || seenQuestionTexts.has(normalized)) return false;
          seenQuestionTexts.add(normalized);
          return true;
        })
        .slice(0, limit);
      await Flashcard.updateMany({ deckId: deck._id }, { $set: { isActive: false } });

      const flashcards = [];
      const seenFlashcardPrompts = new Set<string>();
      for (const question of questions) {
        const sourceQuestionId = question._id;
        const answer = await Answer.findOne({ questionId: sourceQuestionId, type: 'short' }).lean();
        const flashcardPrompt = this._generateFlashcardPrompt(question);
        const normalizedPrompt = normalizeFlashcardKey(flashcardPrompt);
        if (!normalizedPrompt || seenFlashcardPrompts.has(normalizedPrompt)) continue;
        seenFlashcardPrompts.add(normalizedPrompt);
        const flashcardAnswer = this._selectFlashcardAnswer(question, answer?.text, flashcardPrompt);
        const verifiedChoiceSet = getVerifiedFlashcardOptions(question);
        let flashcard = await Flashcard.findOne({ deckId: deck._id, sourceQuestionId });

        if (!flashcard) {
          flashcard = new Flashcard({
            deckId: deck._id,
            sourceQuestionId,
            front: flashcardPrompt,
            back: flashcardAnswer,
            options: verifiedChoiceSet?.options,
            correctAnswer: verifiedChoiceSet?.correctAnswer,
            explanation: verifiedChoiceSet ? flashcardAnswer : undefined,
            optionSource: verifiedChoiceSet ? 'source' : undefined,
            optionStatus: verifiedChoiceSet ? 'approved' : undefined,
            category: this._determineCategory(question),
            difficulty: this._classifyDifficulty(question.marks),
            tags: [question.type, subject],
            isActive: true,
          });
        } else {
          flashcard.front = flashcardPrompt;
          flashcard.back = flashcardAnswer;
          flashcard.category = this._determineCategory(question) as any;
          flashcard.difficulty = this._classifyDifficulty(question.marks);
          flashcard.tags = [question.type, subject];
          flashcard.isActive = true;
          const preserveGeneratedOptions = !verifiedChoiceSet
            && (flashcard.optionSource === 'ai-generated-draft' || flashcard.optionSource === 'rule-generated-draft')
            && Array.isArray(flashcard.options)
            && flashcard.options.length >= 2;
          // Never retain an old answer key after the source loses its verified choices.
          flashcard.set('options', verifiedChoiceSet?.options || (preserveGeneratedOptions ? flashcard.options : undefined));
          flashcard.set('correctAnswer', verifiedChoiceSet?.correctAnswer || (preserveGeneratedOptions ? flashcard.correctAnswer : undefined));
          flashcard.set('explanation', verifiedChoiceSet ? flashcardAnswer : (preserveGeneratedOptions ? flashcard.explanation : undefined));
          flashcard.set('optionSource', verifiedChoiceSet ? 'source' : (preserveGeneratedOptions ? flashcard.optionSource : undefined));
          flashcard.set('optionStatus', verifiedChoiceSet ? 'approved' : (preserveGeneratedOptions ? flashcard.optionStatus : undefined));
          // AI provenance is retained for generated options and cleared for cards without options.
          if (!preserveGeneratedOptions && !verifiedChoiceSet) {
            flashcard.set('optionModel', undefined);
            flashcard.set('optionGeneratedAt', undefined);
          }

        }
        await flashcard.save();

        flashcards.push(flashcard);
      }

      // Keep the count aligned with all cards in the idempotent deck.
      deck.cardCount = await Flashcard.countDocuments({ deckId: deck._id, isActive: true });
      await deck.save();

      return {
        deck,
        flashcards,
        count: flashcards.length,
      };
    } catch (error) {
      throw new Error(`Failed to generate flashcards: ${error}`);
    }
  }

  /**
   * Generate timeline for a topic
   */
  static async generateTimeline(subject: string, topicTitle: string): Promise<any> {
    try {
      // Check if timeline already exists
      let timeline = await Timeline.findOne({ subject, topicId: topicTitle });
      if (timeline) return timeline;

      // Generate timeline events based on subject
      const events = this._generateTimelineEvents(subject, topicTitle);

      timeline = new Timeline({
        title: `${topicTitle} - Evolution and Development`,
        subject,
        topicId: topicTitle,
        events,
        description: `Historical timeline of ${topicTitle} in ${subject}`,
        startYear: events[0]?.year || 1900,
        endYear: events[events.length - 1]?.year || new Date().getFullYear(),
      });

      await timeline.save();
      return timeline;
    } catch (error) {
      throw new Error(`Failed to generate timeline: ${error}`);
    }
  }

  /**
   * Get all answers for a semester
   */
  static async getAnswersBySemester(_semester: number, subject?: string): Promise<any> {
    try {
      const query: any = {};
      if (subject) query.subject = subject;

      const answers = await Answer.find(query)
        .populate('questionId')
        .limit(100)
        .sort({ createdAt: -1 });

      return answers;
    } catch (error) {
      throw new Error(`Failed to get answers: ${error}`);
    }
  }

  /**
   * Get flashcards by deck
   */
  static async getFlashcardsByDeck(deckId: string, limit: number = MAX_FLASHCARDS_PER_REQUEST): Promise<any> {
    try {
      const deck = await FlashcardDeck.findById(deckId);
      if (!deck) {
        throw new Error('Flashcard deck not found');
      }

      const requestedLimit = Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), MAX_FLASHCARDS_PER_REQUEST)
        : MAX_FLASHCARDS_PER_REQUEST;
      const storedCards = await Flashcard.find({ deckId, isActive: true })
        .sort({ difficulty: 1, createdAt: 1, _id: 1 });
      const seenFlashcardPrompts = new Set<string>();
      const readableCards = storedCards.filter((card) => {
        if (!isReadableFlashcardText(card.front) || !isReadableFlashcardText(card.back)) return false;
        const normalizedPrompt = normalizeFlashcardKey(card.front);
        if (!normalizedPrompt || seenFlashcardPrompts.has(normalizedPrompt)) return false;
        seenFlashcardPrompts.add(normalizedPrompt);
        return true;
      });
      const flashcards = readableCards.slice(0, requestedLimit).map((card) => {
        const serialized = card.toObject() as unknown as Record<string, unknown>;
        if (serialized.optionSource === 'rule-generated-draft') {
          const options = Array.isArray(serialized.options)
            ? serialized.options as Array<Record<string, unknown>>
            : [];
          const correctAnswer = String(serialized.correctAnswer || '').trim().toLowerCase().replace(/[.)]$/, '');
          const correctIndex = options.findIndex((option) => (
            String(option.label || '').trim().toLowerCase().replace(/[.)]$/, '') === correctAnswer
          ));
          if (correctIndex >= 0 && typeof serialized.back === 'string' && serialized.back.trim()) {
            // Legacy drafts used a generic first option. Replace only its answer text
            // with the card's actual answer, then let the frontend shuffle positions.
            options[correctIndex] = {
              ...options[correctIndex],
              text: serialized.back.trim(),
              explanation: serialized.explanation || 'Correct answer from the flashcard answer.',
            };
            serialized.options = options;
            serialized.correctAnswer = String(options[correctIndex].label);
          } else {
            delete serialized.options;
            delete serialized.correctAnswer;
            delete serialized.explanation;
            delete serialized.optionSource;
            delete serialized.optionStatus;
            delete serialized.optionModel;
            delete serialized.optionGeneratedAt;
          }
        }
        return serialized;
      });

      return {
        deck,
        flashcards,
        count: flashcards.length,
        availableCount: readableCards.length,
        skippedUnreadableCount: storedCards.length - readableCards.length,
      };
    } catch (error) {
      throw new Error(`Failed to get flashcards: ${error}`);
    }
  }

  /**
   * Helper: Generate answer from question
   */
  private static _generateAnswerFromQuestion(question: any): string {
    const questionText = question.questionText || '';
    
    // Basic answer generation - in production, use AI
    const answerTemplate = `
Based on the question "${questionText}":

Key Points:
1. Understand the main concept
2. Provide relevant examples
3. Include supporting laws/cases if applicable
4. Conclude with practical application

This is an AI-generated answer outline. Please verify and add specific details for your answer.
    `;

    return answerTemplate.trim();
  }

  /**
   * Helper: Generate detailed answer
   */
  private static _generateDetailedAnswer(question: any): string {
    return `
DETAILED ANSWER

Question: ${question.questionText}

Introduction:
- Define the key concepts
- Set the context
- Outline your approach

Main Body:
1. Primary Point
   - Supporting evidence
   - Relevant cases/legislation

2. Secondary Point
   - Analysis
   - Case studies

3. Tertiary Point
   - Critical examination
   - Counter-arguments

Conclusion:
- Summary of key findings
- Legal implications
- Practical application

Note: This is a structured template. Customize with specific information, case citations, and statutory references.
    `;
  }

  /**
   * Helper: Extract key points
   */
  private static _extractKeyPoints(_text: string): string[] {
    return [
      'Definition and scope',
      'Essential elements',
      'Legal framework',
      'Case law references',
      'Practical application',
    ];
  }

  /**
   * Helper: Extract case references
   */
  private static _extractCases(text: string): string[] {
    const cases = [];
    const casePattern = /([A-Z][a-zA-Z\s]+v\.?\s+[A-Z][a-zA-Z\s]+)/g;
    const matches = text.match(casePattern);
    if (matches) {
      cases.push(...matches.slice(0, 5));
    }
    return cases;
  }

  /**
   * Helper: Extract act references
   */
  private static _extractActs(text: string): string[] {
    const acts = [];
    const actPattern = /([A-Z]+\s+(?:Act|Code|Law|Statute)[\s\w]*)/g;
    const matches = text.match(actPattern);
    if (matches) {
      acts.push(...matches.slice(0, 5));
    }
    return acts;
  }

  /**
   * Helper: Generate study tips
   */
  private static _generateStudyTips(_question: any): string[] {
    return [
      'Focus on the definition and scope of the concept',
      'Learn important case laws with their holdings',
      'Understand the statutory framework',
      'Practice answering similar questions',
      'Create a mind map of related topics',
      'Compare and contrast with related laws',
    ];
  }

  /**
   * Turn noisy exam-paper text into a focused flashcard prompt.
   */
  private static _generateFlashcardPrompt(question: any): string {
    const rawText = String(question.questionText || 'Unknown legal concept').replace(/\s+/g, ' ').trim();
    const lowerText = rawText.toLowerCase();
    if (/vicarious liability/.test(lowerText)) return "When is an employer vicariously liable for an employee's tort?";
    if (/assault/.test(lowerText) && /battery/.test(lowerText)) return 'How do assault and battery differ in tort law?';
    if (/absolute liability|bhopal gas|shri ram/.test(lowerText)) return 'What is absolute liability, and what do the Bhopal and Shriram cases illustrate?';
    if (/volenti non fit injuria/.test(lowerText)) return 'What is the legal principle of Volenti non fit injuria?';
    if (/remoteness/.test(lowerText)) return 'How does the doctrine of remoteness limit tort damages?';
    if (/nuisance/.test(lowerText)) return 'What is nuisance, and how do public and private nuisance differ?';
    if (/negligence|duty of care/.test(lowerText)) return 'What are the elements of negligence and the duty of care?';
    if (/rylands|strict liability/.test(lowerText)) return 'What are the requirements and exceptions of strict liability under Rylands v Fletcher?';
    if (/defamation/.test(lowerText)) return 'What must a claimant prove in an action for defamation?';
    if (/false imprisonment/.test(lowerText)) return 'What are the elements of false imprisonment?';
    if (/fundamental rights/.test(lowerText)) return 'What is the scope and constitutional protection of Fundamental Rights in India?';
    if (/article\s*14|equality before law/.test(lowerText)) return 'What does Article 14 require, and when is a classification valid?';
    if (/article\s*21|life and personal liberty/.test(lowerText)) return 'How does Article 21 protect life and personal liberty?';
    if (/constituent assembly/.test(lowerText)) return 'What was the role of the Constituent Assembly in framing the Constitution of India?';
    if (/mountbatten plan/.test(lowerText)) return 'What were the main features and consequences of the Mountbatten Plan?';
    if (/cabinet mission/.test(lowerText)) return 'What did the Cabinet Mission Plan propose for India?';
    if (/government of india act,?\s*1935/.test(lowerText)) return 'What were the major constitutional features of the Government of India Act, 1935?';
    if (/indian independence act,?\s*1947/.test(lowerText)) return 'What did the Indian Independence Act, 1947 establish?';
    if (/mens rea/.test(lowerText)) return 'What is mens rea and why is it important in criminal liability?';
    if (/actus reus/.test(lowerText)) return 'What is actus reus and how does it relate to criminal liability?';

    const primaryQuestion = rawText.split(/\s+OR\s+/i)[0].replace(/^\s*\d+[.)-]?\s*/, '').replace(/^\s*\([A-Z]\)\s*/, '').trim();
    const shortNote = primaryQuestion.match(/write\s+short\s+notes?\s*:?.*?\(1\)\s*([^()]+?)(?=\s*\(2\)|$)/i);

    if (shortNote?.[1]) {
      const topic = shortNote[1].replace(/['“”]/g, '').replace(/\bexplain\b.*$/i, '').replace(/[.:;]+$/, '').trim();
      if (topic) return `What is the legal principle of ${topic}?`;
    }

    let prompt = primaryQuestion
      .replace(/\s+\d{1,3}\s*$/, '')
      .replace(/\s+[A-Z]\s*$/, '')
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    if (prompt.length > 190) {
      const shortened = prompt.slice(0, 190);
      prompt = `${shortened.slice(0, shortened.lastIndexOf(' '))}…`;
    }
    return prompt || 'What is the key legal principle being tested?';
  }

  private static _selectFlashcardAnswer(question: any, existingAnswer: unknown, prompt: string): string {
    const candidate = typeof existingAnswer === 'string' ? existingAnswer.trim() : '';
    if (candidate.length >= 80 && !/^(?:answer to:|this question requires|this question pertains|this is an ai-generated answer outline)/i.test(candidate)) {
      return candidate;
    }

    const text = String(question.questionText || '').toLowerCase();
    if (/volenti non fit injuria/.test(text)) return 'Volenti non fit injuria means “to a willing person, no injury is done.” A claimant who freely and knowingly accepts a specific risk generally cannot recover for harm caused by that risk. The consent must be informed and voluntary; it does not excuse negligence outside the accepted risk or consent obtained by pressure or fraud.';
    if (/vicarious liability/.test(text)) return 'Vicarious liability makes an employer liable for a tort committed by an employee in the course of employment. The claimant must establish the relationship and a sufficiently close connection between the employee’s act and assigned work. An independent contractor and a purely personal “frolic” are generally outside the rule.';
    if (/assault/.test(text) && /battery/.test(text)) return 'Assault is an intentional act creating a reasonable apprehension of imminent unlawful force; battery is the intentional and direct application of unlawful force. Assault concerns the apprehension, while battery concerns the contact. Both require intention and lack of lawful justification.';
    if (/absolute liability|bhopal gas|shri ram/.test(text)) return 'The rule of absolute liability makes an enterprise engaged in a hazardous or inherently dangerous activity liable for harm caused by that activity, without the exceptions available under strict liability. Indian constitutional tort principles developed this rule in response to industrial disasters and require the remedy to be effective and proportionate.';
    if (/remoteness/.test(text)) return 'Remoteness limits recovery to damage that is a legally foreseeable consequence of the wrong. The modern approach asks what kind of harm a reasonable person could have foreseen when the duty was breached; exceptionally unusual or unforeseeable consequences are generally too remote.';
    if (/nuisance/.test(text)) return 'Nuisance is an unreasonable interference with the use or enjoyment of land or with a public right. Private nuisance protects a person’s interest in land; public nuisance affects the community or a class of the public. The court balances locality, duration, severity, and reasonableness.';
    if (/negligence|duty of care/.test(text)) return 'Negligence requires a duty of care, breach of the required standard, factual and legal causation, and legally recognizable damage. The standard is ordinarily that of a reasonably prudent person in the circumstances. Foreseeability and proximity help determine both duty and remoteness.';
    if (/rylands|strict liability/.test(text)) return 'Strict liability under the rule in Rylands v Fletcher generally requires an accumulation of a dangerous thing, a non-natural use of land, escape, and resulting damage. Traditional exceptions include the claimant’s consent, act of God, act of a stranger, and statutory authority; absolute liability is stricter.';
    if (/defamation/.test(text)) return 'Defamation protects reputation against an untrue defamatory statement communicated to a third party. The claimant must show reference to the claimant, publication, and defamatory meaning. Truth, fair comment or opinion, privilege, and consent may provide defenses depending on the facts.';
    if (/false imprisonment/.test(text)) return 'False imprisonment is the unlawful and complete restraint of a person’s freedom of movement, even for a short time. Physical force is unnecessary if the person reasonably believes there is no lawful route of escape. Lawful authority and valid legal process are defenses.';
    if (/fundamental rights/.test(text)) return 'Fundamental Rights are enforceable constitutional guarantees protecting liberty, equality, and dignity. State action may be challenged through constitutional remedies, subject to lawful restrictions and the Constitution’s balancing requirements. Article 14, Article 19, and Article 21 are frequently read together to protect substantive fairness.';
    if (/article\s*14|equality before law/.test(text)) return 'Article 14 guarantees equality before the law and equal protection of the laws. A classification is valid only when it rests on an intelligible differentia connected rationally to the law’s objective. Arbitrary state action can also violate the broader equality guarantee.';
    if (/article\s*21|life and personal liberty/.test(text)) return 'Article 21 protects life and personal liberty except according to a procedure established by law. The procedure must satisfy constitutional fairness, and the guarantee has been interpreted to include dignity and related conditions necessary for a meaningful life.';
    if (/constituent assembly/.test(text)) return 'The Constituent Assembly drafted and adopted the Constitution of India, debated institutional design, and reconciled competing social and political interests. Its committees prepared detailed provisions, while the Assembly’s debates shaped the final distribution of rights, powers, and responsibilities.';
    if (/mountbatten plan/.test(text)) return 'The Mountbatten Plan of 3 June 1947 proposed an accelerated transfer of power and accepted partition as the basis for independence. It led to the Indian Independence Act, 1947, and the creation of the two Dominions, India and Pakistan.';
    if (/cabinet mission/.test(text)) return 'The Cabinet Mission Plan of 1946 proposed a loose Indian Union dealing mainly with defence, foreign affairs, and communications, with provinces grouped into sections. It aimed to preserve Indian unity while allowing substantial provincial autonomy, but political disagreement prevented its lasting implementation.';
    if (/government of india act,?\s*1935/.test(text)) return 'The Government of India Act, 1935 introduced provincial autonomy, proposed a federation, expanded legislatures, and established a Federal Court. Governors and the Governor-General retained extensive discretionary and emergency powers, so the Act combined limited self-government with continuing imperial control.';
    if (/indian independence act,?\s*1947/.test(text)) return 'The Indian Independence Act, 1947 created the independent Dominions of India and Pakistan, ended British sovereignty, and transferred legislative authority to their Constituent Assemblies. It also ended Crown paramountcy over princely states and provided the legal framework for partition.';
    if (/mens rea/.test(text)) return 'Mens rea is the guilty mental element required for many crimes. Depending on the offence, it may involve intention, knowledge, recklessness, or negligence. Liability normally requires the required mental state to coincide with the prohibited act, subject to statutory exceptions.';
    if (/actus reus/.test(text)) return 'Actus reus is the external element of an offence: an act, omission, circumstance, or result prohibited by law. It must be voluntary unless the offence is based on a legally recognized omission, and it must be connected to the required consequence where result is an element.';

    return `Revision answer: ${prompt}\n\nIdentify the governing definition, list the essential legal elements, state the main exception or limitation, and apply each element to a short example. Verify the relevant statute and leading authority before using this as an examination answer.`;
  }


  /**
   * Helper: Determine flashcard category
   */
  private static _determineCategory(question: any): string {
    const type = (question as any).type?.toLowerCase() || 'concept';
    const categoryMap: any = {
      'short': 'definition',
      'long': 'principle',
      'mcq': 'concept',
      'descriptive': 'principle',
    };
    return categoryMap[type] || 'concept';
  }

  /**
   * Helper: Classify difficulty
   */
  private static _classifyDifficulty(marks?: number): 'easy' | 'medium' | 'hard' {
    if (!marks) return 'medium';
    if (marks <= 2) return 'easy';
    if (marks <= 5) return 'medium';
    return 'hard';
  }

  /**
   * Helper: Generate timeline events
   */
  private static _generateTimelineEvents(_subject: string, _topic: string): ITimelineEvent[] {
    const events: ITimelineEvent[] = [
      {
        year: 1950,
        title: 'Constitutional Foundation',
        description: 'Indian Constitution came into force',
        significance: 'Established legal framework',
      },
      {
        year: 1975,
        title: 'Key Amendments',
        description: 'Important constitutional amendments',
        significance: 'Shaped current legal system',
      },
      {
        year: 2000,
        title: 'Modern Reforms',
        description: 'Contemporary legal reforms',
        significance: 'Adapted to modern requirements',
      },
      {
        year: 2025,
        title: 'Current Developments',
        description: 'Latest legal developments',
        significance: 'Current state of law',
      },
    ];

    return events;
  }
}
