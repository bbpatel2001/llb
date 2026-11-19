import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface Question {
  questionNumber: string;
  questionText: string;
  marks: number;
  type: string;
  difficulty: string;
  tags: string[];
  options?: any[];
  correctAnswer?: string;
}

interface GeneratedAnswer {
  type: 'short' | 'long' | 'standard' | 'mcq' | 'case_study';
  text: string;
  wordCount: number;
  keyPoints: string[];
  casesReferred: any[];
  actsReferred: any[];
  studyTips: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  qualityScore: number;
  mcqOptions?: any[];
  mcqExplanation?: string;
  sources: Array<{
    type: 'textbook' | 'case_law' | 'statute' | 'article';
    title: string;
    author?: string;
    year?: number;
  }>;
}

class AnswerGenerationAIService {
  private apiKey: string;
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Generate comprehensive answer for a question using Claude/GPT
   */
  async generateAnswer(question: Question): Promise<GeneratedAnswer> {
    const answerType = this.mapQuestionType(question.type);
    const prompt = this.buildPrompt(question, answerType);

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse, question, answerType);
    } catch (error) {
      console.error('Error generating answer via AI:', error);
      // Fallback to rule-based generation
      return this.generateAnswerRuleBased(question);
    }
  }

  /**
   * Generate answers in bulk using local AI service or API
   */
  async generateAnswersInBulk(questions: Question[]): Promise<GeneratedAnswer[]> {
    const answers: GeneratedAnswer[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      try {
        console.log(`Generating answer ${i + 1}/${questions.length}...`);
        const answer = await this.generateAnswer(questions[i]);
        answers.push(answer);
        
        // Rate limiting - wait between API calls
        if (i < questions.length - 1) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`Failed to generate answer for question ${i}:`, error);
        answers.push(this.generateAnswerRuleBased(questions[i]));
      }
    }

    return answers;
  }

  private getSystemPrompt(): string {
    return `You are an expert law professor and educator specializing in legal subjects. Your task is to generate comprehensive, well-structured answers to law exam questions. 

    Guidelines:
    1. Provide accurate, detailed answers based on legal principles and precedents
    2. For 20-25 mark answers, write approximately 1,600-2,200 words (about 4-5 A4 pages), with headings, statutory provisions, and relevant case examples
    3. For 15 mark answers, write approximately 900-1,200 words (about 3 A4 pages); for short notes, write approximately 350-500 words (about 1 A4 page)
    4. Cite relevant case laws and statutory provisions
    5. Structure answers with clear headings and bullet points where appropriate
    6. Include practical examples and real-world applications
    7. Highlight key legal principles and definitions
    8. For MCQ questions, provide clear explanations for why each option is correct or incorrect
    
    Response Format (JSON):
    {
      "answer_text": "Complete answer text",
      "key_points": ["point1", "point2", ...],
      "relevant_cases": [{"name": "case name", "citation": "citation", "principle": "relevant principle"}],
      "relevant_acts": [{"act_name": "act name", "sections": ["section1", "section2"]}],
      "study_tips": ["tip1", "tip2", ...],
      "word_count": number,
      "quality_notes": "Notes on answer quality"
    }`;
  }

  private buildPrompt(question: Question, answerType: string): string {
    let prompt = `Generate a comprehensive answer to the following law exam question:\n\n`;
    prompt += `Question: ${question.questionText}\n`;
    prompt += `Marks: ${question.marks}\n`;
    prompt += `Type: ${answerType}\n`;
    prompt += `Difficulty: ${question.difficulty}\n`;
    prompt += `Subject: ${question.tags.join(', ')}\n\n`;
    
    if (question.type === 'MCQ' && question.options) {
      prompt += `Options:\n`;
      question.options.forEach((option: any, index: number) => {
        prompt += `${String.fromCharCode(65 + index)}. ${option}\n`;
      });
    }
    
    prompt += `\nProvide a detailed, well-structured answer with key points, relevant cases, and applicable legal provisions.`;
    
    return prompt;
  }

  private parseAIResponse(aiResponse: string, question: Question, answerType: string): GeneratedAnswer {
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        type: answerType as any,
        text: parsed.answer_text || '',
        wordCount: parsed.word_count || 0,
        keyPoints: parsed.key_points || [],
        casesReferred: this.formatCaseReferences(parsed.relevant_cases || []),
        actsReferred: this.formatActReferences(parsed.relevant_acts || []),
        studyTips: parsed.study_tips || [],
        difficulty: (question.difficulty.toLowerCase()) as 'easy' | 'medium' | 'hard',
        qualityScore: this.calculateQualityScore(parsed),
        sources: this.generateSourceReferences(question.tags),
        mcqExplanation: parsed.mcq_explanation,
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.generateAnswerRuleBased(question);
    }
  }

  private generateAnswerRuleBased(question: Question): GeneratedAnswer {
    const answerType = this.mapQuestionType(question.type);
    const wordCount = this.estimateWordCount(question.marks);

    return {
      type: answerType,
      text: this.generateBasicAnswer(question),
      wordCount,
      keyPoints: this.extractKeyPoints(question.questionText),
      casesReferred: [],
      actsReferred: this.extractActReferences(question.tags),
      studyTips: this.generateStudyTips(question),
      difficulty: (question.difficulty.toLowerCase()) as 'easy' | 'medium' | 'hard',
      qualityScore: 5,
      sources: this.generateSourceReferences(question.tags),
    };
  }

  private generateBasicAnswer(question: Question): string {
    let answer = '';

    // Introduction
    answer += `Answer to Question ${question.questionNumber}:\n\n`;

    // Parse the question to understand what's being asked
    const questionLower = question.questionText.toLowerCase();

    // Generate answer based on question type and content
    if (questionLower.includes('explain in detail')) {
      answer += `Detailed Explanation:\n`;
      answer += this.generateDetailedExplanation(question);
    } else if (questionLower.includes('define')) {
      answer += `Definition and Analysis:\n`;
      answer += this.generateDefinition(question);
    } else if (questionLower.includes('discuss')) {
      answer += `Discussion:\n`;
      answer += this.generateDiscussion(question);
    } else if (question.type === 'MCQ') {
      answer += this.generateMCQAnswer(question);
    } else {
      answer += this.generateGenericAnswer(question);
    }

    return answer;
  }

  private generateDetailedExplanation(question: Question): string {
    const topic = this.extractTopic(question.questionText);
    
    const explanations: { [key: string]: string } = {
      'cripps mission': `The Cripps Mission (1942) was a critical diplomatic mission sent to India by the British Government during World War II. 

Key Objectives:
- Secure India's participation in World War II
- Offer a framework for post-war Indian independence
- Maintain British strategic interests in India

Main Proposals:
1. Dominion Status for India after the war
2. Indian participation in an Executive Council
3. Constitution-making body to be elected
4. Right of provinces to opt out of the federation

Impact:
- Rejected by Congress due to insufficient autonomy provisions
- Strengthened independence movement
- Demonstrated British limitations in India`,

      'government of india act, 1935': `The Government of India Act, 1935 was a landmark legislation that introduced significant constitutional changes in India.

Main Provisions:
1. Federal Structure:
   - Created a federation of British India and princely states
   - Established a bicameral federal legislature

2. Provincial Autonomy:
   - Introduction of provincial self-government
   - Expansion of provincial legislatures
   - Limited ministerial responsibility

3. Constitutional Framework:
   - Separation of powers between executive and legislature
   - Reserved subjects under British control
   - Defense and foreign affairs remained with British

4. Limitations:
   - Governor-General retained significant powers
   - Communal electorates maintained
   - Federal structure never fully implemented

Significance:
- First major step towards constitutional government in India
- Formed basis for later constitutional developments`,

      'indian independence act': `The Indian Independence Act, 1947 was the legislation that formally granted independence to India and Pakistan.

Key Provisions:
1. Creation of Two Dominions:
   - India and Pakistan as separate dominions
   - Equal status within the Commonwealth

2. End of Paramountcy:
   - Lapsed relationships with princely states
   - States became free to accede to India or Pakistan

3. Constitutional Authority:
   - Constituent Assemblies became legislatures
   - Power to amend constitutions

4. Jurisdiction:
   - British Crown ceased to be sovereign in India
   - Transfer of power effective August 15, 1947

Historical Impact:
- Marked formal end of British rule
- Led to formation of modern India
- Partition resulted in massive displacement and communal violence`,

      'cabinet mission': `The Cabinet Mission (1946) was an attempt by Britain to facilitate independence negotiations in India.

Objectives:
- Find a workable constitutional framework for independence
- Maintain Indian unity if possible
- Ensure post-independence cooperation with Britain

Proposals:
1. Three-tier structure:
   - Union at center (defense, foreign affairs, communications)
   - Groups of provinces (other subjects)
   - Autonomous provinces

2. Immediate measures:
   - Interim government with executive responsibility
   - Constituent Assembly to frame constitution

3. Protection of minorities:
   - Communal representation maintained
   - Grouping system to protect provincial interests

Outcome:
- Initially accepted by all parties
- Later rejected by Muslim League
- Led to formation of interim government`,

      'federal court': `The Federal Court was established under the Government of India Act, 1935 as the highest court in British India.

Structure and Jurisdiction:
1. Composition:
   - Chief Justice and judges
   - Appellate body for provincial courts

2. Original Jurisdiction:
   - Disputes between units of federation
   - Constitutional matters

3. Appellate Jurisdiction:
   - Cases from provincial courts
   - Constitutional questions

Significance:
- First unified supreme court structure in India
- Evolved into the Supreme Court of independent India
- Protected constitutional rights and federal authority`,

      'mountbatten plan': `The Mountbatten Plan (June 1947) outlined the partition of India and modalities for independence.

Key Features:
1. Partition Proposal:
   - Two independent nations: India and Pakistan
   - Immediate independence (August 1947)
   - Transfer of power to two governments

2. Implementation:
   - Boundary commission to demarcate borders
   - Accession of princely states facilitated
   - Exchange of populations where needed

3. Transfer of Power:
   - British withdrawal from India
   - National governments assume sovereignty
   - Commonwealth membership optional

Consequences:
- Immediate but chaotic independence
- Mass displacement and communal riots
- Foundation for modern India and Pakistan`,

      'constitution of india': `The Constitution of India is the supreme law of the Indian Republic, adopted on January 26, 1950.

Drafting Process:
1. Constituent Assembly:
   - Formed in 1946
   - Dr. B.R. Ambedkar as Chairperson of Drafting Committee
   - Took 2 years 11 months for deliberations

2. Draft and Adoption:
   - 395 articles and 8 schedules
   - Multiple amendments during drafting
   - Adopted: November 26, 1949
   - Implemented: January 26, 1950

3. Key Features:
   - Democratic, secular, socialist republic
   - Parliamentary system of government
   - Fundamental rights and duties
   - Directive Principles of State Policy

4. Constitutional Structure:
   - Executive: President, Prime Minister, Cabinet
   - Legislature: Parliament (Lok Sabha, Rajya Sabha)
   - Judiciary: Supreme Court and High Courts
   - Federalism: Union and State governments

Significance:
- World's longest written constitution
- Guarantees fundamental rights
- Provides framework for democratic governance`,
    };

    return explanations[topic] || `This is a comprehensive examination of the topic: ${topic}. This topic covers important historical events and constitutional developments in India's journey to independence.`;
  }

  private generateDefinition(_question: Question): string {
    return `A comprehensive definition and analysis would include:\n\n1. Definition: The precise meaning of the term\n2. Essential Elements: Key components that must be present\n3. Legal Framework: Relevant laws and regulations\n4. Examples: Practical illustrations\n5. Distinctions: How it differs from related concepts\n6. Application: How it operates in practice`;
  }

  private generateDiscussion(_question: Question): string {
    return `A detailed discussion should cover:\n\n1. Overview: General context and importance\n2. Key Features: Main characteristics and components\n3. Advantages: Benefits and positive aspects\n4. Limitations: Restrictions and challenges\n5. Case Studies: Real-world examples\n6. Legal Position: Current law and regulations\n7. Conclusion: Summary and implications`;
  }

  private generateMCQAnswer(_question: Question): string {
    return `MCQ Analysis:\n\nCorrect Answer: [Option to be identified]\n\nExplanation:\n- The correct option is the one that most accurately addresses the question\n- Other options contain partially correct information but do not fully satisfy the requirements\n- Legal reasoning and precedents support the correct answer`;
  }

  private generateGenericAnswer(question: Question): string {
    const marks = question.marks;
    if (marks >= 20) {
      return `This is a long-form answer requiring comprehensive coverage of the topic with relevant legal principles, case laws, and statutory provisions.`;
    } else if (marks >= 10) {
      return `This is a medium-form answer requiring detailed explanation with key points and relevant legal references.`;
    } else {
      return `This is a short-form answer requiring concise but complete explanation of the concept.`;
    }
  }

  private extractTopic(questionText: string): string {
    const keywords = [
      'cripps mission',
      'government of india act, 1935',
      'indian independence act',
      'cabinet mission',
      'mountbatten plan',
      'federal court',
      'constitution of india',
      'rajgopalachari',
    ];

    const text = questionText.toLowerCase();
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }

    return 'general legal topic';
  }

  private extractKeyPoints(questionText: string): string[] {
    // Extract key terms from question
    const words = questionText.split(/[\s,()]+/);
    const importantWords = words.filter(
      w => w.length > 4 && !['explain', 'detail', 'discuss', 'define'].includes(w.toLowerCase())
    );

    return importantWords.slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1));
  }

  private extractActReferences(tags: string[]): any[] {
    const actMap: { [key: string]: string[] } = {
      'contract': ['Section 10', 'Section 23', 'Section 29'],
      'constitutional': [],
      'criminal': ['Section 5', 'Section 34'],
      'torts': ['Tort Law Principles'],
      'government': ['Government of India Act, 1935'],
    };

    const references: any[] = [];
    for (const tag of tags) {
      if (actMap[tag]) {
        references.push({
          actName: `${tag.charAt(0).toUpperCase()}${tag.slice(1)} Law`,
          sections: actMap[tag].map(section => ({
            number: section,
            title: 'Reference',
            summary: 'Applicable provision',
          })),
        });
      }
    }

    return references;
  }

  private generateStudyTips(question: Question): string[] {
    return [
      `Focus on the key concepts in ${question.tags.join(' and ')}`,
      'Create a timeline of important events and decisions',
      'Compare and contrast related legal principles',
      'Refer to case law for practical applications',
      'Practice writing timed answers',
      'Review recent amendments and judicial interpretations',
    ];
  }

  private estimateWordCount(marks: number): number {
    // Rough estimate: 50-100 words per mark
    return marks * 75;
  }

  private mapQuestionType(type: string): 'short' | 'long' | 'standard' | 'mcq' | 'case_study' {
    const typeMap: { [key: string]: 'short' | 'long' | 'standard' | 'mcq' | 'case_study' } = {
      'MCQ': 'mcq',
      'LONG': 'long',
      'SHORT': 'short',
      'DESCRIPTIVE': 'standard',
      'CASE_STUDY': 'case_study',
    };

    return typeMap[type.toUpperCase()] || 'standard';
  }

  private formatCaseReferences(cases: any[]): any[] {
    return cases.map(c => ({
      caseName: c.name || 'Case name',
      citation: c.citation || 'Citation',
      year: c.year || new Date().getFullYear(),
      court: c.court || 'Court',
      relevantPrinciple: c.principle || 'Legal principle',
      relevantSections: c.sections || [],
    }));
  }

  private formatActReferences(acts: any[]): any[] {
    return acts.map(a => ({
      actName: a.act_name || 'Act name',
      sections: (a.sections || []).map((s: string) => ({
        number: s,
        title: 'Reference',
        summary: 'Applicable provision',
      })),
    }));
  }

  private calculateQualityScore(parsed: any): number {
    let score = 5;
    if (parsed.answer_text && parsed.answer_text.length > 500) score += 1;
    if (parsed.key_points && parsed.key_points.length > 3) score += 1;
    if (parsed.relevant_cases && parsed.relevant_cases.length > 0) score += 1;
    if (parsed.relevant_acts && parsed.relevant_acts.length > 0) score += 1;
    if (parsed.study_tips && parsed.study_tips.length > 2) score += 1;
    return Math.min(score, 10);
  }

  private generateSourceReferences(tags: string[]): Array<{
    type: 'textbook' | 'case_law' | 'statute' | 'article';
    title: string;
    author?: string;
    year?: number;
  }> {
    const sources: Array<{
      type: 'textbook' | 'case_law' | 'statute' | 'article';
      title: string;
      author?: string;
      year?: number;
    }> = [
      {
        type: 'textbook',
        title: 'Constitutional Law of India',
        author: 'M.P. Jain',
        year: 2021,
      },
      {
        type: 'statute',
        title: 'The Constitution of India',
        year: 1950,
      },
    ];

    if (tags.includes('contract')) {
      sources.push({
        type: 'statute',
        title: 'Indian Contract Act, 1872',
        year: 1872,
      });
    }

    if (tags.includes('criminal')) {
      sources.push({
        type: 'statute',
        title: 'Indian Penal Code',
        year: 1860,
      });
    }

    return sources;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new AnswerGenerationAIService();
