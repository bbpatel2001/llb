export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogPostRecord {
  slug: string;
  title: string;
  excerpt: string;
  category: 'study-advice' | 'platform-journal' | 'legal-learning';
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  tags: string[];
  sections: BlogSection[];
  sources: string[];
  status: 'published';
}

export const blogPosts: BlogPostRecord[] = [
  {
    slug: 'why-law-mapping-matters-for-llb-students',
    title: 'Why Law Mapping Matters for LL.B. Students',
    excerpt: 'Legal study becomes easier to revise when provisions, principles, cases, syllabus topics, and questions are connected instead of stored as isolated notes.',
    category: 'study-advice',
    author: 'LLB Platform Editorial Team',
    publishedAt: '2026-09-06T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z',
    readingMinutes: 5,
    tags: ['law mapping', 'study method', 'exam preparation'],
    sections: [
      { heading: 'Law is learned through relationships', paragraphs: ['A provision is easier to remember when a student knows the problem it addresses, the principle courts use to interpret it, and the type of question in which it appears.', 'A map makes those relationships visible. It does not replace reading the Act or judgment; it gives the student a reliable route through the material.'] },
      { heading: 'A map supports different study moments', paragraphs: ['During first study, the map helps identify the scope of a topic. During revision, it becomes a quick route from a section to a case or from a case back to the syllabus. Before an exam, it helps build an answer outline.'], bullets: ['Understand the statutory starting point.', 'Recall the legal principle.', 'Review the authority and its significance.', 'Practice applying the rule to facts.'] },
      { heading: 'Start small and verify each connection', paragraphs: ['A useful map does not need hundreds of links on the first day. It is better to begin with a small set of verified relationships and expand them as the subject is studied.', 'Every link should answer a clear question: why is this case, provision, or question connected to this topic?'] },
    ],
    sources: ['Official syllabus and prescribed primary sources', 'India Code and official court sources for authority verification'],
    status: 'published',
  },
  {
    slug: 'from-article-to-exam-answer',
    title: 'From an Article to an Examination Answer',
    excerpt: 'How to turn a broad explanation into the precise structure needed for a short answer, long answer, or problem question.',
    category: 'study-advice',
    author: 'LLB Platform Editorial Team',
    publishedAt: '2026-09-07T00:00:00.000Z',
    updatedAt: '2026-09-07T00:00:00.000Z',
    readingMinutes: 6,
    tags: ['articles', 'answer writing', 'exam skills'],
    sections: [
      { heading: 'An article and an answer have different jobs', paragraphs: ['An article gives a learner a connected explanation of a topic. An examination answer must respond to the exact wording of the question within a mark and time limit.', 'The first step is therefore to remove material that does not answer the question and retain the rule, authority, application, and conclusion that do.'] },
      { heading: 'Use a four-part conversion', paragraphs: ['A practical conversion method is: identify the issue, state the governing law, explain the leading authority, and apply the rule. For a purely theoretical question, the application can become a comparison or evaluation section.'], bullets: ['Issue: what must the answer decide?', 'Rule: which provision or principle governs?', 'Authority: which case supports the rule?', 'Conclusion: what is the result and why?'] },
      { heading: 'Keep the answer proportionate', paragraphs: ['A five-mark answer should not reproduce a full chapter. A long answer can develop competing views and authorities, but it still needs headings and a direct conclusion.', 'Use articles for understanding and model answers for structure. The two resources are connected, but they are not interchangeable.'] },
    ],
    sources: ['University examination pattern and syllabus objectives', 'Relevant statutory text and reported judgments'],
    status: 'published',
  },
  {
    slug: 'building-a-reliable-case-note',
    title: 'Building a Reliable Case Note',
    excerpt: 'A case note is most useful when it records the decision accurately and explains the legal proposition it supports.',
    category: 'legal-learning',
    author: 'LLB Platform Editorial Team',
    publishedAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
    readingMinutes: 5,
    tags: ['case law', 'legal research', 'ratio decidendi'],
    sections: [
      { heading: 'Record the identity of the case', paragraphs: ['Begin with the case name, citation, court, and year. These details make it possible to verify the source and prevent two decisions with similar names from being confused.', 'A note should also identify the subject and syllabus topics to which the authority is relevant.'] },
      { heading: 'Explain only what the decision establishes', paragraphs: ['Separate the material facts, issue, held, and ratio. The held is the result in the case; the ratio is the legal reasoning necessary for that result.', 'Avoid treating every observation in a judgment as a binding rule. Record significance as a careful explanation of how the case is used in the topic.'] },
      { heading: 'Connect the note to study practice', paragraphs: ['A case note becomes more valuable when it is linked to a provision, a principle, and a question. A student should be able to move from the note to an answer outline without searching again for the basic identity of the case.'] },
    ],
    sources: ['Official Supreme Court and High Court judgment portals', 'Official e-Courts Services portal'],
    status: 'published',
  },
  {
    slug: 'a-realistic-semester-one-study-routine',
    title: 'A Realistic Semester One Study Routine',
    excerpt: 'Use syllabus topics, previous questions, articles, and spaced revision to create a sustainable first-semester routine.',
    category: 'study-advice',
    author: 'LLB Platform Editorial Team',
    publishedAt: '2026-09-09T00:00:00.000Z',
    updatedAt: '2026-09-09T00:00:00.000Z',
    readingMinutes: 6,
    tags: ['semester one', 'study plan', 'revision'],
    sections: [
      { heading: 'Plan by topics, not pages', paragraphs: ['A useful weekly plan starts with the syllabus units and topics. Set a small number of topics for first reading, then reserve time for questions and recall.', 'This keeps study aligned with the examination structure and makes progress visible even when textbooks vary in length.'] },
      { heading: 'Use a three-pass routine', paragraphs: ['The first pass is understanding: read the provision and basic explanation. The second is application: read cases and attempt questions. The third is recall: use flashcards, a short outline, and a timed answer.'], bullets: ['First pass: understand the rule.', 'Second pass: connect authority and facts.', 'Third pass: recall and write.'] },
      { heading: 'Review before material disappears', paragraphs: ['Short, repeated reviews are more useful than one large revision session at the end. Mark topics that need another reading and use completed questions to identify where the explanation is still unclear.', 'The goal is consistent retrieval and writing practice, not a perfect schedule that cannot be maintained.'] },
    ],
    sources: ['Gujarat University LL.B. syllabus catalogue', 'Existing question, answer, flashcard, and quiz study workflows'],
    status: 'published',
  },
  {
    slug: 'keeping-legal-learning-content-current',
    title: 'Keeping Legal-Learning Content Current',
    excerpt: 'Legal education content needs a clear distinction between stable principles, changeable statutory text, and dated editorial updates.',
    category: 'platform-journal',
    author: 'LLB Platform Editorial Team',
    publishedAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
    readingMinutes: 5,
    tags: ['content quality', 'legal updates', 'sources'],
    sections: [
      { heading: 'Not all content changes at the same speed', paragraphs: ['A legal principle may remain a useful foundation while the statutory wording, effective date, or leading authority changes. Articles, law maps, and blogs should make that difference visible.', 'An evergreen explanation should state its source boundary. A dated update should display when it was published and what event it addresses.'] },
      { heading: 'Use publication and review metadata', paragraphs: ['Every serious learning resource should carry publication and update information. Statutory or constitutional content should also identify the relevant source and, where useful, the effective date.', 'This metadata helps students decide whether a resource is suitable for a current exam or needs verification against the latest official text.'] },
      { heading: 'Prefer verification over volume', paragraphs: ['A smaller library of well-sourced resources is more useful than a large collection of unverified summaries. Editorial review should check the proposition, authority, citation, and relationship to the syllabus before publication.'] },
    ],
    sources: ['Official statutory and constitutional sources', 'Official court websites and university syllabus materials'],
    status: 'published',
  },
];
