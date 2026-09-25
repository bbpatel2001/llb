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

interface Answer {
  questionNumber: string;
  type: 'short' | 'long' | 'standard' | 'mcq';
  text: string;
  keyPoints: string[];
  studyTips: string[];
  difficulty: string;
  wordCount: number;
}

class LocalAnswerGenerator {
  private answerRepository: { [key: string]: string } = {
    'cripps mission': `The Cripps Mission (1942) was a critical diplomatic mission sent by the British Government to facilitate India's independence and secure support during World War II.

Key Objectives:
1. Secure India's participation in WWII
2. Offer a framework for post-war independence
3. Maintain British strategic interests

Main Provisions:
- Dominion Status after the war
- Indian representation in an Executive Council
- Constitution-making body elected by Indians
- Right of provinces to opt out

Why It Failed:
- Congress rejected it due to insufficient autonomy
- Timing was poor (mid-war)
- Did not address communal concerns
- Strengthened independence movement

Historical Significance:
- Demonstrated Britain's willingness to grant independence
- Accelerated independence timeline
- Led to more concrete proposals later`,

    'government of india act, 1935': `The Government of India Act, 1935 was a transformative constitutional legislation that introduced significant reforms to India's governance structure.

Major Provisions:

1. Federal Structure:
   - Created a federation of British India and princely states
   - Bicameral federal legislature
   - Increased Indian representation

2. Provincial Autonomy:
   - Introduction of provincial self-government
   - Expanded provincial legislatures
   - Ministers responsible to provincial legislatures
   - Transferred powers like education, health to provinces

3. Limitations on Power:
   - Governor-General retained veto powers
   - Defense and foreign affairs reserved for British
   - Emergency powers for Governor-General
   - Communal electorates maintained

4. Constitutional Safeguards:
   - Reserved subjects under British control
   - Federal Court established
   - Constitutional amendments required special procedures

Impact:
- First major constitutional reform with Indian participation
- Formed basis for future independence movements
- Federal structure principles influenced post-independence constitution
- Never fully implemented due to WWII and independence`,

    'indian independence act, 1947': `The Indian Independence Act, 1947 was the pivotal legislation that formally granted independence to India and Pakistan from British rule.

Key Features:

1. Establishment of Two Dominions:
   - Creation of India and Pakistan as separate dominions
   - Both given equal status in the Commonwealth
   - Transfer of power effective August 15, 1947

2. End of British Sovereignty:
   - Crown ceased to be sovereign in India
   - Indian governance fully transferred to Indians
   - British responsibilities ended

3. Princely States:
   - Paramountcy of British Crown lapsed
   - States became free to accede to either dominion
   - Sardar Vallabhbhai Patel unified princely states

4. Partition Provisions:
   - Boundary Commission to demarcate borders
   - Population exchange facilitated
   - Property and debt division procedures

Constitutional Authority:
- Constituent Assemblies became legislatures
- Full power to frame and amend constitutions
- Sovereign in internal affairs

Consequences:
- Immediate independence but chaotic
- Communal riots and mass displacement
- Created template for other independence movements`,

    'cabinet mission': `The Cabinet Mission (1946) was a last attempt by Britain to facilitate a united independent India with an agreed constitutional framework.

Objectives:
1. Find workable constitutional structure
2. Maintain Indian unity if possible
3. Facilitate power transfer arrangements
4. Ensure post-independence cooperation with Britain

Key Proposals:

1. Three-Tier Structure:
   - Union at center: Defense, foreign affairs, communications
   - Groups of provinces: Other powers
   - Autonomous provinces: Residual matters

2. Interim Government:
   - Immediate formation of interim government
   - Executive responsibility to central legislature
   - Preparation for independence

3. Constitutional Framework:
   - Constituent Assembly to draft constitution
   - Protections for minorities
   - Federal safeguards

Outcomes:
- Initially accepted by Congress and League
- Muslim League later rejected grouping system
- Led to formation of interim government
- Contributed to eventual partition
- Constitutional principles influenced 1950 Constitution`,

    'federal court': `The Federal Court established under the Government of India Act, 1935 was the highest court in British India before independence.

Structure:
- Chief Justice and judges appointed by Governor-General
- Appellate and original jurisdiction
- First unified Supreme Court structure in India

Jurisdiction:

Original Jurisdiction:
- Disputes between federal units
- Constitutional matters
- Federal-provincial disputes

Appellate Jurisdiction:
- Cases from provincial courts
- Constitutional questions
- Interpretation of federal laws

Functions:
- Judicial review of legislation
- Protection of federal structure
- Constitutional interpretation
- Guardian of constitutional rights

Significance:
- Established tradition of judicial review
- Protected federal structure from encroachment
- Evolved into Supreme Court of India
- Set precedents still followed today`,

    'mountbatten plan': `The Mountbatten Plan (June 3, 1947) was the definitive proposal that set the timeline and terms for Indian independence and partition.

Key Features:

1. Immediate Independence:
   - Transfer of power by August 15, 1947
   - Faster than originally planned
   - Reduced time for preparation

2. Partition Proposal:
   - Two independent nations: India and Pakistan
   - Boundary Commission to demarcate borders
   - Principle: Hindu-majority and Muslim-majority areas

3. Accession Process:
   - Princely states to accede voluntarily
   - Power of states to choose accession
   - Political negotiations facilitated

4. Implementation:
   - Direct approach to major parties
   - Acceptance by Congress and League
   - Fast-tracked independence process

Consequences:
- Immediate independence achieved
- Partition resulted in communal violence
- Mass displacement of populations
- Formation of India and Pakistan as planned
- Kashmir dispute emerged`,

    'constitution of india': `The Constitution of India is the supreme law and the world's longest written constitution, adopted on January 26, 1950.

Drafting Process:

1. Constituent Assembly:
   - Formed in 1946
   - Dr. B.R. Ambedkar as Chairman of Drafting Committee
   - 389 members represented diverse interests
   - Took 2 years, 11 months for deliberations

2. Key Provisions:
   - 395 articles (now 470+)
   - 8 schedules (now 12)
   - Multiple drafts and debates

Main Features:

1. Democratic Structure:
   - Parliamentary democracy
   - Universal adult suffrage
   - Separation of powers

2. Fundamental Rights:
   - Freedom of expression, association, equality
   - Right to constitutional remedies
   - Protection of minorities

3. Directive Principles:
   - Socio-economic rights guidelines
   - Education, health, welfare
   - Social justice goals

4. Federal System:
   - Union and State governments
   - Concurrent and exclusive powers
   - Cooperative federalism

Significance:
- Longest constitution reflecting diverse society
- Guarantees fundamental rights and freedoms
- Unique blend of rigidity and flexibility
- Framework for world's largest democracy
- Continues to evolve through amendments`,

    'rajgopalachari formula': `The Rajgopalachari Formula was a proposal for solving India's communal problem and constitutional issues during the independence movement.

Key Points:
- Proposed by C. Rajagopalachari in 1944
- Aimed at resolving Hindu-Muslim tensions
- Suggested Pakistan acceptance but with safeguards
- Sought to maintain Indian unity in federation

Proposals:
- Acceptance of Pakistan in principle
- Conditions: boundaries, minorities protection
- Federal union for defense and foreign affairs
- Provincial autonomy preserved

Impact:
- Rejected by mainstream parties at the time
- Later influenced partition discussions
- Contributed to constitutional thinking`,
  };

  async generateAnswer(question: Question): Promise<Answer> {
    const topic = this.extractTopic(question.questionText);
    const answerText = this.getAnswerForTopic(topic, question);
    
    return {
      questionNumber: question.questionNumber,
      type: this.mapQuestionType(question.type),
      text: answerText,
      keyPoints: this.extractKeyPoints(answerText, question.tags),
      studyTips: this.generateStudyTips(question.tags),
      difficulty: question.difficulty.toLowerCase(),
      wordCount: this.estimateWordCount(answerText),
    };
  }

  private extractTopic(questionText: string): string {
    const text = questionText.toLowerCase();
    for (const topic of Object.keys(this.answerRepository)) {
      if (text.includes(topic)) {
        return topic;
      }
    }
    return 'general';
  }

  private getAnswerForTopic(topic: string, question: Question): string {
    const baseAnswer = this.answerRepository[topic] || this.generateGenericAnswer(question);
    return this.adjustAnswerToQuestionType(baseAnswer, question);
  }

  private adjustAnswerToQuestionType(baseAnswer: string, question: Question): string {
    if (question.marks > 20) {
      return baseAnswer;
    } else if (question.marks > 10) {
      return baseAnswer.split('\n\n')[0] + '\n\n' + baseAnswer.split('\n\n')[1];
    } else {
      return baseAnswer.split('\n\n')[0];
    }
  }

  private generateGenericAnswer(question: Question): string {
    const topic = question.tags[0] || 'topic';
    return `This question pertains to the topic of ${topic} in law. 

To answer this question effectively:
1. Define key concepts and terms
2. Explain relevant legal principles
3. Cite applicable laws and precedents
4. Provide practical examples
5. Discuss significance and implications

Key Areas to Cover:
- Historical background and context
- Legal framework and provisions
- Important case law
- Current state of law
- Practical applications

Important Considerations:
- Distinguish from related concepts
- Address common misconceptions
- Highlight recent amendments or changes
- Connect to broader legal principles`;
  }

  private mapQuestionType(type: string): 'short' | 'long' | 'standard' | 'mcq' {
    switch (type.toUpperCase()) {
      case 'MCQ':
        return 'mcq';
      case 'LONG':
        return 'long';
      case 'SHORT':
        return 'short';
      default:
        return 'standard';
    }
  }

  private extractKeyPoints(text: string, tags: string[]): string[] {
    const points: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes(':') && !line.toLowerCase().includes('key') && points.length < 5) {
        const point = line.split(':')[0].trim();
        if (point && point.length > 5) {
          points.push(point);
        }
      }
    }
    
    return points.length > 0 ? points : tags;
  }

  private generateStudyTips(tags: string[]): string[] {
    return [
      `Create a timeline of events related to ${tags[0]}`,
      'Compare and contrast different approaches and reforms',
      'Study relevant case laws and their implications',
      'Prepare diagrams showing constitutional structure',
      'Review recent amendments and judicial interpretations',
      'Practice answering past exam questions',
    ];
  }

  private estimateWordCount(text: string): number {
    return text.split(/\s+/).length;
  }
}

export default new LocalAnswerGenerator();
