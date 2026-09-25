import { IQuestion } from '../models/Question';
import { AnswerLanguage } from '../config/languages';

export interface IAnswerWritingGuide {
  answerType: 'short' | 'long';
  marks: number;
  targetPages: string;
  targetWords: string;
  sections: string[];
  include: string[];
  statutoryProvisions: string[];
  caseExamples: string[];
  modelAnswer: string;
}

interface LegalReferenceSet {
  area: string;
  principle: string;
  provisions: string[];
  cases: string[];
}

/**
 * Builds exam guidance from the actual question instead of displaying one
 * subject-wide template for every question.
 */
export class AnswerGuidanceService {
  static buildWritingGuide(
    question: IQuestion,
    answerType: 'short' | 'long',
    _language: AnswerLanguage = 'en'
  ): IAnswerWritingGuide {
    const marks = question.marks || 5;
    const plan = this.getMarkPlan(marks);
    const references = this.getLegalReferences(question);
    const focus = this.getQuestionFocus(question.questionText);

    return {
      answerType,
      marks,
      targetPages: plan.pages,
      targetWords: plan.words,
      sections: this.getSections(answerType, focus, references.area, marks),
      include: this.getInclusions(answerType, focus, references, marks),
      statutoryProvisions: references.provisions,
      caseExamples: references.cases,
      modelAnswer: this.buildModelAnswer(question, answerType, focus, references, plan),
    };
  }

  static buildAnswerText(
    question: IQuestion,
    answerType: 'short' | 'long',
    language: AnswerLanguage = 'en'
  ): string {
    if (language === 'gu') {
      return this.buildGujaratiAnswer(question, answerType);
    }

    const references = this.getLegalReferences(question);
    return this.buildModelAnswer(
      question,
      answerType,
      this.getQuestionFocus(question.questionText),
      references,
      this.getMarkPlan(question.marks || 5)
    );
  }

  static buildStudyTips(question: IQuestion, answerType: 'short' | 'long'): string[] {
    const focus = this.getQuestionFocus(question.questionText);
    const references = this.getLegalReferences(question);
    const marks = question.marks || 5;
    const plan = this.getMarkPlan(marks);

    return [
      `Begin by defining or identifying the legal issue in “${focus}”.`,
      `Use these headings in order: ${this.getSections(answerType, focus, references.area, marks).join(' → ')}.`,
      `For ${marks} marks, aim for ${plan.pages} and ${plan.words}; do not sacrifice legal analysis for repetition.`,
      `Support the rule with ${references.provisions[0]} and explain the principle from ${references.cases[0]}.`,
      'End by applying the rule to the question and giving a direct conclusion rather than stopping after the definition.',
    ];
  }

  private static getMarkPlan(marks: number): { pages: string; words: string } {
    if (marks <= 5) return { pages: 'approximately 2 pages', words: '450–600 words' };
    if (marks <= 15) return { pages: 'approximately 4–5 pages', words: '900–1,400 words' };
    return { pages: 'approximately 8–10 pages', words: '1,800–2,600 words' };
  }

  private static getQuestionFocus(questionText: string): string {
    const cleaned = questionText.replace(/\s+/g, ' ').trim().replace(/[?。]+$/, '');
    const withoutBoilerplate = cleaned
      .replace(/^(discuss|explain|describe|define|write a note on|critically examine|critically evaluate)\s+/i, '')
      .trim();
    return (withoutBoilerplate || cleaned).slice(0, 180);
  }

  private static getLegalReferences(question: IQuestion): LegalReferenceSet {
    const text = `${question.subject} ${question.questionText}`.toLowerCase();

    if (/constitution|fundamental right|article\s+(14|19|21|32)|writ|judicial review|federal/.test(text)) {
      return {
        area: 'constitutional law',
        principle: 'constitutional rights must be read with their text, limitations, remedies, and the facts of the question',
        provisions: ['Constitution of India, Article 14 (equality)', 'Article 19 (freedoms and reasonable restrictions)', 'Article 21 (life and personal liberty)', 'Article 32 (constitutional remedies)'],
        cases: ['Maneka Gandhi v. Union of India — Article 21 procedure must be fair, just and reasonable', 'Kesavananda Bharati v. State of Kerala — basic structure limitation on constitutional amendments', 'E.P. Royappa v. State of Tamil Nadu — arbitrariness is opposed to equality under Article 14'],
      };
    }

    if (/contract|offer|acceptance|consideration|breach|indemnity|guarantee|agency|sale of goods|partnership/.test(text)) {
      return {
        area: 'contract law',
        principle: 'a legally enforceable promise depends on agreement, intention, lawful consideration/object, capacity, and the applicable remedy',
        provisions: ['Indian Contract Act, 1872, Section 2 (definitions)', 'Indian Contract Act, 1872, Section 10 (valid contracts)', 'Indian Contract Act, 1872, Sections 73–75 (breach and compensation)'],
        cases: ['Carlill v. Carbolic Smoke Ball Co. — an offer may be accepted by performance', 'Mohori Bibee v. Dharmodas Ghose — a minor’s agreement is void', 'Hadley v. Baxendale — damages are limited by remoteness and reasonable contemplation'],
      };
    }

    if (/tort|negligence|nuisance|defamation|trespass|strict liability|vicarious|duty of care|damages/.test(text)) {
      return {
        area: 'law of torts',
        principle: 'liability is determined by the protected legal interest, duty, breach, causation, recognised damage, and available defences',
        provisions: ['The general principles of duty, breach, causation and remoteness', 'Consumer Protection Act, 2019 where the question concerns a consumer/service relationship', 'Motor Vehicles Act, 1988 where the facts concern motor-vehicle compensation'],
        cases: ['Donoghue v. Stevenson — the neighbour principle and duty of care', 'Rylands v. Fletcher — the traditional rule of strict liability', 'M.C. Mehta v. Union of India — absolute liability for hazardous industries in India'],
      };
    }

    if (/murder|culpable homicide|crime|criminal|mens rea|theft|robbery|cheating|bail|evidence|punishment|offence|ipc|bharatiya nyaya/.test(text)) {
      return {
        area: 'criminal law',
        principle: 'criminal liability requires the statutory ingredients of the offence, the required mental element, causation where relevant, and proof beyond reasonable doubt',
        provisions: ['Bharatiya Nyaya Sanhita, 2023 or the statute applicable to the examination year', 'The statutory definition and ingredients of the specific offence asked in the question', 'The relevant exceptions, defences and punishment provisions'],
        cases: ['State of Andhra Pradesh v. Rayavarapu Punnayya — distinction between culpable homicide and murder', 'Virsa Singh v. State of Punjab — application of the bodily-injury test for murder', 'K.M. Nanavati v. State of Maharashtra — circumstances relevant to grave and sudden provocation'],
      };
    }

    if (/property|transfer|mortgage|lease|easement|possession|ownership|sale|gift|lien/.test(text)) {
      return {
        area: 'property law',
        principle: 'the answer must identify the nature of the property interest, the transaction, the parties’ rights, and the statutory conditions for transfer or enforcement',
        provisions: ['Transfer of Property Act, 1882, Section 5 (transfer of property)', 'Transfer of Property Act, 1882, Section 54 (sale)', 'Transfer of Property Act, 1882, Sections 58 and 105 (mortgage and lease)'],
        cases: ['Suraj Lamp & Industries v. State of Haryana — limits of informal property transfers', 'Anthony v. K.C. Ittoop & Sons — registration and lease principles', 'Nair Service Society v. K.C. Alexander — protection of settled possession'],
      };
    }

    if (/evidence|relevancy|confession|admission|burden|presumption|witness|estoppel/.test(text)) {
      return {
        area: 'law of evidence',
        principle: 'the answer should connect the fact in issue with the rule of relevance, admissibility, burden, proof, and the reliability of the evidence',
        provisions: ['Bharatiya Sakshya Adhiniyam, 2023 or the statute applicable to the examination year', 'The provision governing relevance and admissibility of the evidence asked about', 'The applicable burden of proof and statutory presumptions'],
        cases: ['Pulukuri Kottaya v. Emperor — scope of information leading to discovery', 'Sharad Birdhichand Sarda v. State of Maharashtra — principles for circumstantial evidence', 'State of U.P. v. Raj Narain — limits and treatment of official evidence'],
      };
    }

    return {
      area: `${question.subject || 'the relevant legal subject'}`,
      principle: 'the answer must define the issue, state the governing rule, explain its ingredients, and apply that rule to the question',
      provisions: [`The principal statute and section governing “${this.getQuestionFocus(question.questionText)}”`, 'Definitions, exceptions and remedies relevant to the exact legal issue', 'Any current amendment or special rule mentioned in the question'],
      cases: [`A leading authority explaining “${this.getQuestionFocus(question.questionText)}”`, 'A later authority showing how the principle is applied to facts', 'An Indian authority relevant to the subject and examination syllabus'],
    };
  }

  private static getSections(answerType: 'short' | 'long', focus: string, area: string, marks: number): string[] {
    if (answerType === 'short' || marks <= 5) {
      return [
        `Meaning and issue: ${focus}`,
        `Governing rule in ${area}`,
        'Essential ingredients or principles',
        'One relevant case and its application',
        'Direct conclusion',
      ];
    }

    return [
      `Introduction and scope: ${focus}`,
      `Statutory framework under ${area}`,
      'Definitions, ingredients and classifications',
      'Leading cases and principle-by-principle analysis',
      'Application to the question and possible counter-arguments',
      'Critical evaluation, remedies or exceptions',
      'Conclusive answer linked to the facts',
    ];
  }

  private static getInclusions(answerType: 'short' | 'long', focus: string, references: LegalReferenceSet, marks: number): string[] {
    const inclusions = [
      `A precise opening definition of “${focus}”, not a generic introduction`,
      `The statutory provisions: ${references.provisions.join('; ')}`,
      `At least one explained case example: ${references.cases[0]}`,
      `A clear application of the rule to the exact wording and facts of the question`,
    ];

    if (answerType === 'long' && marks > 15) {
      inclusions.push(`Comparative or critical discussion using: ${references.cases[1]}`);
      inclusions.push('Exceptions, limitations, remedies and a reasoned conclusion');
    }

    return inclusions;
  }

  private static buildModelAnswer(
    question: IQuestion,
    answerType: 'short' | 'long',
    focus: string,
    references: LegalReferenceSet,
    plan: { pages: string; words: string }
  ): string {
    const opening = `This answer addresses “${focus}” in ${question.subject}. The issue should be answered by identifying the legal meaning of the topic, stating the governing rule, explaining its ingredients, and then applying those principles to the question. For a ${question.marks || 5}-mark answer, the appropriate target is ${plan.pages} (${plan.words}).`;
    const framework = `\n\n1. INTRODUCTION AND LEGAL FRAMEWORK\n${focus} must be examined within ${references.area}. The governing principle is that ${references.principle}. Begin with the precise definition and identify the legal issue raised by the wording of the question. Avoid writing a general history unless it directly helps answer that issue.`;
    const provisions = `\n\n2. STATUTORY PROVISIONS\nThe relevant provisions are: ${references.provisions.join('; ')}. Explain the language and purpose of each provision that is actually connected with the question. Where an exception, defence, remedy or limitation changes the result, state it under a separate sub-heading.`;
    const caseAnalysis = `\n\n3. CASE LAW AND APPLICATION\n${references.cases[0]}. This authority illustrates the controlling principle and should be connected to the facts rather than merely listed. ${references.cases[1]}. This second authority helps compare the rule or show its limits. Apply the reasoning from these cases to the facts and wording supplied in the question. If the facts support more than one interpretation, state both positions and explain which is stronger.`;
    const conclusion = `\n\n${answerType === 'long' ? '4. ANALYSIS AND CONCLUSION' : '4. CONCLUSION'}\nTherefore, a complete answer must move from the definition of ${focus} to the applicable provisions, explain the relevant case principle, and finish with a direct legal result. The conclusion should answer the command in the question—whether to define, explain, discuss, distinguish or apply the rule—and should not introduce a new issue.`;

    if (answerType === 'short') {
      return `${opening}${framework}${provisions}${caseAnalysis}${conclusion}`;
    }

    return `${opening}${framework}${provisions}\n\n3. INGREDIENTS, CLASSIFICATIONS AND EXCEPTIONS\nSet out each ingredient of the rule in a separate paragraph. Explain how the ingredients differ from related concepts, identify any statutory exception or defence, and mention the remedy or consequence that follows. This is where a long answer earns marks through orderly analysis rather than repetition.${caseAnalysis}${conclusion}`;
  }

  private static buildGujaratiAnswer(question: IQuestion, answerType: 'short' | 'long'): string {
    const focus = this.getQuestionFocus(question.questionText);
    const length = answerType === 'short' ? 'ટૂંકા જવાબમાં' : 'લાંબા જવાબમાં';
    return `પ્રશ્ન: ${focus}\n\n${length} ${question.subject} વિષયના પ્રશ્નનો જવાબ વ્યાખ્યા, લાગુ કાયદો, જરૂરી તત્ત્વો, સંબંધિત કેસ અને પ્રશ્નના તથ્યો પર ઉપયોગના ક્રમમાં લખવો.\n\nપરિચય અને કાનૂની મુદ્દો:\nપ્રશ્નમાં પૂછાયેલા ચોક્કસ મુદ્દાની વ્યાખ્યા આપો અને કયો કાનૂની પ્રશ્ન નક્કી કરવાનો છે તે સ્પષ્ટ કરો.\n\nલાગુ કાયદો અને કેસ:\nસંબંધિત અધિનિયમની જોગવાઈઓ લખો, દરેક જરૂરી તત્ત્વ સમજાવો અને તેને લાગુ પડતા કેસના સિદ્ધાંત સાથે જોડો.\n\nનિષ્કર્ષ:\nઉપરોક્ત સિદ્ધાંતોને પ્રશ્ન પર લાગુ કરીને સીધો અને કારણસભર નિષ્કર્ષ આપો.`;
  }
}

export default AnswerGuidanceService;
