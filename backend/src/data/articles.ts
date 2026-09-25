export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ArticleLink {
  label: string;
  href: string;
}

export interface ArticleRecord {
  slug: string;
  title: string;
  excerpt: string;
  category: 'subject-guide' | 'case-law' | 'exam-skills' | 'legal-research';
  subject: string;
  semester: number;
  chapter: string;
  topic: string;
  concepts: string[];
  learningObjectives: string[];
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  sections: ArticleSection[];
  keyTakeaways: string[];
  sources: string[];
  relatedLinks: ArticleLink[];
  status: 'published';
}

export const articles: ArticleRecord[] = [
  {
    slug: 'how-to-read-a-law-topic',
    title: 'How to Read and Organize a Law Topic',
    excerpt: 'A practical method for moving from the syllabus to provisions, principles, authorities, and examination practice.',
    category: 'exam-skills',
    subject: 'Legal Methods and Examination Skills',
    semester: 1,
    chapter: 'Chapter 1: Building a Legal Study Method',
    topic: 'From a syllabus outline to an answer-ready legal topic',
    concepts: ['syllabus mapping', 'legal issue', 'authority chain', 'rule and application', 'revision cycle'],
    learningObjectives: ['Turn a broad syllabus heading into a focused legal question.', 'Connect provisions, principles, authorities, and facts.', 'Create revision material that supports exam application.'],
    readingMinutes: 6,
    publishedAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    tags: ['study method', 'legal reasoning', 'exam writing'],
    sections: [
      { heading: 'Start with the syllabus question', paragraphs: ['A syllabus topic is a boundary for study, not just a heading to memorize. Begin by asking what legal problem the topic is designed to answer and which unit it belongs to.', 'Write the topic as a question. For example, instead of studying “consideration” as an isolated word, ask when a promise becomes enforceable and why the law recognizes consideration.'] },
      { heading: 'Build the authority chain', paragraphs: ['After identifying the issue, locate the governing Act or constitutional provision. Then identify the elements of the rule, the leading judicial explanation, and one illustration that shows how the rule works.'], bullets: ['Provision: where is the rule located?', 'Ingredients: what must be proved?', 'Authority: which case explains or applies it?', 'Application: what facts change the result?'] },
      { heading: 'Convert the chain into revision material', paragraphs: ['A good revision set should contain a short definition, a provision card, a principle card, and a case card. This creates recall from multiple directions without copying a textbook paragraph.', 'Finally, connect the topic to past questions and a model answer. That last step turns information into examination preparation.'] },
    ],
    keyTakeaways: ['Treat the syllabus as a map of issues.', 'Read the provision before reading case summaries.', 'Separate the legal rule from its application to facts.', 'Link every major topic to at least one practice question.'],
    sources: ['Official university syllabus and prescribed reading list', 'Constitution of India and India Code primary texts'],
    relatedLinks: [{ label: 'Explore Law Mapping', href: '/law-mapping' }, { label: 'Open Question Bank', href: '/questions' }],
    status: 'published',
  },
  {
    slug: 'consideration-under-contract-law',
    title: 'Consideration Under the Indian Contract Act',
    excerpt: 'Understand the meaning, purpose, exceptions, and examination structure of consideration in contract law.',
    category: 'subject-guide',
    subject: 'Law of Contract',
    semester: 1,
    chapter: 'Chapter 3: Consideration and Enforceable Promises',
    topic: 'Consideration as the legal value exchanged for a promise',
    concepts: ['Section 2(d)', 'sufficiency and adequacy', 'lawful consideration', 'privity and enforcement', 'Section 25 exceptions'],
    learningObjectives: ['Define consideration using the statutory language.', 'Distinguish sufficiency from commercial adequacy.', 'Apply the general rule and Section 25 exceptions to facts.'],
    readingMinutes: 8,
    publishedAt: '2026-08-22T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    tags: ['contract', 'consideration', 'section 2(d)', 'section 25'],
    sections: [
      { heading: 'Meaning and function', paragraphs: ['Consideration is the legal value exchanged for a promise. Under Section 2(d), it may consist of an act, abstinence, or promise done at the desire of the promisor.', 'It performs an evidentiary and regulatory function: it helps identify a bargain and distinguishes an enforceable promise from a bare gift or moral commitment.'] },
      { heading: 'Important rules', paragraphs: ['Consideration must be real and lawful, but it need not be commercially adequate. The court generally asks whether there is legal value and a lawful bargain, not whether the exchange was economically equal.', 'The question of who provides consideration should be kept separate from the question of who may enforce a contract. This distinction often decides problem questions.'] },
      { heading: 'Exceptions and answer structure', paragraphs: ['Section 25 states the general rule that an agreement without consideration is void, subject to statutory exceptions. A complete answer should identify the general rule first and then test each possible exception against the facts.', 'For an examination answer, use this sequence: definition, statutory rule, essential conditions, exceptions, leading authority, and conclusion on the facts.'] },
    ],
    keyTakeaways: ['Read Sections 2(d), 10, and 25 together.', 'Distinguish adequacy from sufficiency of consideration.', 'Explain the general rule before discussing exceptions.', 'Use a leading case to show how the rule operates.'],
    sources: ['Indian Contract Act, 1872, Sections 2(d), 10, and 25', 'Chinnaya v. Ramaya', 'Kedarnath Bhattacharji v. Gorie Mohamed'],
    relatedLinks: [{ label: 'Open the consideration law map', href: '/law-mapping/contract-consideration' }, { label: 'Browse case laws', href: '/case-laws' }],
    status: 'published',
  },
  {
    slug: 'negligence-in-tort-law',
    title: 'Negligence: Duty, Breach, and Causation',
    excerpt: 'A structured guide to the elements of negligence and the order in which they should be analyzed in an answer.',
    category: 'subject-guide',
    subject: 'Law of Tort',
    semester: 1,
    chapter: 'Chapter 4: Negligence and Civil Liability',
    topic: 'Negligence: proving duty, breach, causation, and damage',
    concepts: ['duty of care', 'reasonable person', 'breach', 'factual causation', 'remoteness and defences'],
    learningObjectives: ['Break negligence into its separate legal elements.', 'Apply the reasonable-person standard to facts.', 'Distinguish causation, remoteness, defences, and remedies.'],
    readingMinutes: 7,
    publishedAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    tags: ['tort', 'negligence', 'duty of care', 'damages'],
    sections: [
      { heading: 'The working test', paragraphs: ['Negligence is not simply carelessness. The claimant must connect a legally recognized duty with a breach, damage, and a sufficiently close causal relationship.', 'The facts should be separated into stages. First identify the relationship between the parties, then ask what a reasonable person would have done, and finally test whether the breach caused the loss.'] },
      { heading: 'Causation and remoteness', paragraphs: ['Factual causation asks whether the harm would have occurred without the defendant’s breach. Legal causation asks whether the harm is sufficiently connected to justify liability.', 'Foreseeability is especially important when deciding whether damage is too remote. A clear answer states the type of harm that was foreseeable rather than relying on a bare conclusion.'] },
      { heading: 'Defences and remedies', paragraphs: ['Contributory negligence, consent, statutory authority, and other defences must be tested only when the facts support them. They should not replace analysis of the claimant’s primary case.', 'The conclusion should identify the remedy sought and explain whether the facts support compensation, an injunction, or another appropriate remedy.'] },
    ],
    keyTakeaways: ['Use duty, breach, causation, remoteness, and damage as separate headings.', 'Apply the reasonable-person standard to the facts.', 'Do not confuse factual causation with legal remoteness.', 'Discuss defences after establishing the primary claim.'],
    sources: ['Donoghue v. Stevenson, [1932] AC 562', 'Law of Torts syllabus and prescribed primary materials'],
    relatedLinks: [{ label: 'Open the negligence law map', href: '/law-mapping/tort-negligence' }, { label: 'Browse syllabus topics', href: '/syllabi' }],
    status: 'published',
  },
  {
    slug: 'understanding-article-21',
    title: 'Understanding Article 21 Through Its Judicial Development',
    excerpt: 'Study the text of Article 21 alongside the constitutional values of fairness, dignity, privacy, and liberty.',
    category: 'case-law',
    subject: 'Constitutional Law I',
    semester: 2,
    chapter: 'Chapter 2: Fundamental Rights and Personal Liberty',
    topic: 'Article 21: life, personal liberty, dignity, and fair procedure',
    concepts: ['Article 21 text', 'procedure established by law', 'fairness', 'dignity', 'privacy', 'Articles 14 and 19'],
    learningObjectives: ['State the constitutional text and its relationship with Articles 14 and 19.', 'Explain the shift from formal to fair procedure.', 'Use leading cases to trace the development of liberty and dignity.'],
    readingMinutes: 9,
    publishedAt: '2026-08-28T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
    tags: ['constitution', 'article 21', 'privacy', 'dignity'],
    sections: [
      { heading: 'Begin with the constitutional text', paragraphs: ['Article 21 protects life and personal liberty and permits deprivation only according to procedure established by law. An answer should begin with this text before moving to judicial interpretation.', 'The provision applies to every person and is studied with Articles 14, 19, 32, and 226 because constitutional review of liberty often involves more than one right and remedy.'] },
      { heading: 'From formal procedure to fair procedure', paragraphs: ['Constitutional interpretation expanded the inquiry from the existence of a procedure to the quality and fairness of the procedure affecting liberty. This development is central to the modern understanding of Article 21.', 'The principles of dignity, privacy, and meaningful participation help explain why the right has been applied to fields beyond physical restraint.'] },
      { heading: 'How to write the answer', paragraphs: ['A strong answer separates the original text, the major interpretive shift, later rights recognized within liberty and dignity, and the limits imposed by constitutional procedure.', 'Use authorities for distinct propositions. Do not list cases without explaining the constitutional principle each case contributes.'] },
    ],
    keyTakeaways: ['Quote or accurately state the constitutional text first.', 'Explain the relationship between Articles 14, 19, and 21.', 'Connect privacy and dignity to personal liberty.', 'Use cases to show stages of constitutional development.'],
    sources: ['Constitution of India, Articles 14, 19, 21, 32, and 226', 'Maneka Gandhi v. Union of India, (1978) 1 SCC 248', 'Justice K.S. Puttaswamy v. Union of India, (2017) 10 SCC 1'],
    relatedLinks: [{ label: 'Open the Article 21 law map', href: '/law-mapping/constitution-article-21' }, { label: 'Browse case laws', href: '/case-laws' }],
    status: 'published',
  },
  {
    slug: 'how-to-analyse-a-judgment',
    title: 'How to Analyse a Judgment for Study and Exams',
    excerpt: 'Use a repeatable case-reading method: facts, issue, rule, reasoning, decision, and significance.',
    category: 'case-law',
    subject: 'Legal Methods and Legal Research',
    semester: 1,
    chapter: 'Chapter 1: Reading and Analysing Judicial Decisions',
    topic: 'A repeatable method for understanding a judgment',
    concepts: ['material facts', 'issues', 'ratio decidendi', 'reasoning', 'holding and significance'],
    learningObjectives: ['Separate legally material facts from background narrative.', 'Identify the issue, rule, reasoning, and holding.', 'Record a case note that can be applied to a new problem.'],
    readingMinutes: 6,
    publishedAt: '2026-08-30T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    tags: ['case analysis', 'ratio decidendi', 'legal research'],
    sections: [
      { heading: 'Separate facts from legal issues', paragraphs: ['Read the facts once for the story and again for legally material details. Then frame the issue as a question the court had to answer, not as a broad subject label.', 'A precise issue makes the later rule easier to identify. If there are multiple issues, number them and connect each to the part of the decision that resolves it.'] },
      { heading: 'Find the rule and reasoning', paragraphs: ['The ratio is the legal reasoning necessary for the decision. It is different from every observation in the judgment and different from a later summary that omits the reasoning.', 'Note the competing submissions, the test adopted by the court, and the facts that made the test applicable. This is the material most useful for applying the case to a new problem.'] },
      { heading: 'Record significance responsibly', paragraphs: ['A case note should state the decision, the principle, and why the authority matters for the topic. It should not claim that a judgment decided a question that was not before the court.', 'Always retain the citation and court information so another reader can locate the primary judgment.'] },
    ],
    keyTakeaways: ['Frame issues as questions.', 'Distinguish holding from background observations.', 'Record the reasoning that connects facts to the result.', 'Keep citation and court information with every case note.'],
    sources: ['Official Supreme Court of India judgments portal', 'Official High Court judgment portals and e-Courts services'],
    relatedLinks: [{ label: 'Explore case-law mappings', href: '/law-mapping' }, { label: 'Browse case laws', href: '/case-laws' }],
    status: 'published',
  },
  {
    slug: 'using-primary-sources-in-legal-research',
    title: 'Using Primary Sources in Legal Research',
    excerpt: 'A source-first workflow for locating statutory text, judgments, constitutional provisions, and current official material.',
    category: 'legal-research',
    subject: 'Legal Research and Legal Software',
    semester: 1,
    chapter: 'Chapter 2: Sources and Methods of Legal Research',
    topic: 'Finding, checking, and recording primary legal authorities',
    concepts: ['legal proposition', 'source hierarchy', 'statutory text', 'judgment verification', 'research trail'],
    learningObjectives: ['Search for a precise legal proposition instead of a vague topic.', 'Verify statutes, judgments, citations, and current status.', 'Maintain a research trail that supports future updates.'],
    readingMinutes: 7,
    publishedAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
    tags: ['legal research', 'primary sources', 'citations'],
    sections: [
      { heading: 'Start with the legal proposition', paragraphs: ['Before searching, write the exact proposition you need to verify. For example, identify whether you need the text of a section, the interpretation of a phrase, or the current status of a rule.', 'This prevents a search result or commentary from silently replacing the primary source.'] },
      { heading: 'Use the source hierarchy', paragraphs: ['For statutory questions, begin with the official text and record the Act, section, amendment position, and effective date. For case-law questions, locate the judgment and verify the court, date, citation, issues, and holding.', 'Secondary explanations are useful for orientation, but the final note should make clear which proposition comes from the primary authority.'] },
      { heading: 'Keep a research trail', paragraphs: ['Record the source title, URL or citation, access date when relevant, and the proposition supported. A short research trail makes later updating easier when legislation or case law changes.', 'The same habit improves exam preparation because it separates reliable authorities from unsupported summaries.'] },
    ],
    keyTakeaways: ['Search for a proposition, not just a topic word.', 'Verify the official text and current version.', 'Record the exact authority supporting each important statement.', 'Use secondary material to understand, not replace, primary sources.'],
    sources: ['India Code and official Gazette publications', 'Supreme Court of India and official High Court websites', 'Official e-Courts Services portal'],
    relatedLinks: [{ label: 'Browse syllabus topics', href: '/syllabi' }, { label: 'Explore law mappings', href: '/law-mapping' }],
    status: 'published',
  },
];
