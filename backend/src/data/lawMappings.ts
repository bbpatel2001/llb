export interface LawMappingProvision {
  number: string;
  title: string;
  summary: string;
}

export interface LawMappingCase {
  name: string;
  citation: string;
  principle: string;
}

export interface LawMappingRecord {
  slug: string;
  title: string;
  summary: string;
  subject: string;
  semester: number;
  actName: string;
  provisions: LawMappingProvision[];
  principles: string[];
  caseLaws: LawMappingCase[];
  syllabusTopics: string[];
  relatedQuestionTypes: string[];
  tags: string[];
  status: 'published';
}

export const lawMappings: LawMappingRecord[] = [
  {
    slug: 'contract-consideration',
    title: 'Consideration in Contract Law',
    summary: 'Map the basic idea of consideration from the Indian Contract Act to its exam principles, leading authorities, and related study topics.',
    subject: 'Law of Contract',
    semester: 1,
    actName: 'Indian Contract Act, 1872',
    provisions: [
      { number: 'Section 2(d)', title: 'Consideration', summary: 'Explains the act, abstinence, or promise that forms consideration for a promise.' },
      { number: 'Section 10', title: 'What agreements are contracts', summary: 'Connects lawful consideration with the other requirements of an enforceable contract.' },
      { number: 'Section 25', title: 'Agreement without consideration', summary: 'States the general rule and recognized exceptions for agreements made without consideration.' },
    ],
    principles: [
      'Consideration must move at the desire of the promisor.',
      'Consideration may be past, present, or future when recognized by the governing law.',
      'The law generally examines legal sufficiency rather than equal economic value.',
      'An agreement without consideration is generally void unless an exception applies.',
    ],
    caseLaws: [
      { name: 'Chinnaya v. Ramaya', citation: '1882 Madras decision', principle: 'Illustrates the rule that consideration may move from a person other than the promisee.' },
      { name: 'Kedarnath Bhattacharji v. Gorie Mohamed', citation: '1886 Calcutta decision', principle: 'Shows how liability may arise when a promise induces action and the promise is acted upon.' },
    ],
    syllabusTopics: ['Agreement, contract, elements and kinds', 'Consideration and capacity to contract', 'Legality of object and void agreements'],
    relatedQuestionTypes: ['Short answer', 'Long answer', 'Problem question', 'Case-based question'],
    tags: ['contract', 'consideration', 'section 2(d)', 'section 25'],
    status: 'published',
  },
  {
    slug: 'contract-free-consent',
    title: 'Free Consent and Vitiating Factors',
    summary: 'Connect consent under contract law with coercion, undue influence, fraud, misrepresentation, mistake, and the effect on enforceability.',
    subject: 'Law of Contract',
    semester: 1,
    actName: 'Indian Contract Act, 1872',
    provisions: [
      { number: 'Section 13', title: 'Consent', summary: 'Requires parties to agree upon the same thing in the same sense.' },
      { number: 'Section 14', title: 'Free consent', summary: 'Defines consent that is not caused by coercion, undue influence, fraud, misrepresentation, or mistake.' },
      { number: 'Sections 15–19', title: 'Vitiating factors', summary: 'Organizes the principal circumstances that may make a contract voidable or otherwise affect validity.' },
    ],
    principles: [
      'Consent and free consent are different legal inquiries.',
      'The legal consequence depends on the vitiating factor and the statutory rule that applies.',
      'The party alleging undue influence or fraud must establish the facts that support the allegation.',
      'Mistake of essential fact can affect agreement, while mistake of law is treated differently.',
    ],
    caseLaws: [
      { name: 'Raghunath Prasad v. Sarju Prasad', citation: '1924 Privy Council decision', principle: 'Explains the relationship between a dominant position and the burden of proving undue influence.' },
      { name: 'Derry v. Peek', citation: '(1889) 14 App Cas 337', principle: 'Provides a classic distinction between fraudulent and innocent misrepresentation.' },
    ],
    syllabusTopics: ['Free consent: coercion, undue influence, fraud and misrepresentation', 'Mistake of law and fact', 'Void agreements'],
    relatedQuestionTypes: ['Short answer', 'Difference question', 'Long answer', 'Problem question'],
    tags: ['contract', 'free consent', 'fraud', 'mistake'],
    status: 'published',
  },
  {
    slug: 'tort-negligence',
    title: 'Negligence in the Law of Torts',
    summary: 'Map the elements of negligence to duty, breach, causation, remoteness, defences, and the examination questions where the doctrine is applied.',
    subject: 'Law of Tort including Motor Vehicle Accident and Consumer Protection Laws',
    semester: 1,
    actName: 'Law of Torts and related statutory remedies',
    provisions: [
      { number: 'Core principle', title: 'Duty of care', summary: 'A claimant must show a legally recognized duty owed in the circumstances.' },
      { number: 'Core principle', title: 'Breach and reasonable care', summary: 'The court compares conduct with the standard expected from a reasonable person in the circumstances.' },
      { number: 'Core principle', title: 'Causation and remoteness', summary: 'The breach must cause the loss and the loss must not be too remote.' },
    ],
    principles: [
      'Negligence is concerned with unreasonable conduct causing legally recognizable damage.',
      'The standard of care is objective but the circumstances of the defendant and claimant matter.',
      'Foreseeability helps determine both duty and remoteness.',
      'Contributory negligence and other defences may reduce or defeat recovery depending on the facts.',
    ],
    caseLaws: [
      { name: 'Donoghue v. Stevenson', citation: '[1932] AC 562', principle: 'Established the modern neighbour principle for a duty of care.' },
      { name: 'Municipal Corporation of Greater Bombay v. Laxman Iyer', citation: 'Indian negligence decision', principle: 'Demonstrates the importance of factual proof of duty, breach, and causation in Indian claims.' },
    ],
    syllabusTopics: ['Negligence, nuisance and fraud', 'Remoteness of damage, foreseeability and directness', 'Extra-legal remedies and damages'],
    relatedQuestionTypes: ['Definition', 'Long answer', 'Case analysis', 'Problem question'],
    tags: ['tort', 'negligence', 'duty of care', 'damages'],
    status: 'published',
  },
  {
    slug: 'tort-strict-absolute-liability',
    title: 'Strict Liability and Absolute Liability',
    summary: 'Compare the rule in Rylands v Fletcher with the Indian principle of absolute liability for hazardous or inherently dangerous activities.',
    subject: 'Law of Tort including Motor Vehicle Accident and Consumer Protection Laws',
    semester: 1,
    actName: 'Law of Torts and environmental/public-hazard principles',
    provisions: [
      { number: 'Rylands rule', title: 'Strict liability', summary: 'Provides a framework for liability arising from the escape of a dangerous thing brought onto land for a non-natural use, subject to recognized exceptions.' },
      { number: 'Indian public-hazard principle', title: 'Absolute liability', summary: 'Indian constitutional and tort reasoning may impose a higher, no-exception responsibility for hazardous enterprise activity.' },
      { number: 'Remedies', title: 'Compensation and public law relief', summary: 'Injury from hazardous activity may raise private-law, statutory, and public-law remedies.' },
    ],
    principles: [
      'Strict liability and absolute liability are related but not interchangeable doctrines.',
      'The traditional strict-liability rule recognizes exceptions.',
      'The Indian absolute-liability approach is connected to the special risk created by hazardous enterprise activity.',
      'A good answer should compare the rule, exceptions, rationale, and Indian development separately.',
    ],
    caseLaws: [
      { name: 'Rylands v. Fletcher', citation: '(1868) LR 3 HL 330', principle: 'Foundational authority for the common-law strict-liability rule.' },
      { name: 'M.C. Mehta v. Union of India', citation: 'Oleum Gas Leak case, (1987) 1 SCC 395', principle: 'Developed the Indian absolute-liability rule for hazardous industries.' },
    ],
    syllabusTopics: ['Strict liability and the rule in Rylands v Fletcher', 'Absolute liability and public-hazard liability', 'Injunction, restitution and damages'],
    relatedQuestionTypes: ['Difference question', 'Case analysis', 'Long answer', 'Problem question'],
    tags: ['tort', 'strict liability', 'absolute liability', 'hazardous activity'],
    status: 'published',
  },
  {
    slug: 'constitution-article-21',
    title: 'Article 21: Life, Liberty, and Dignity',
    summary: 'Map Article 21 from its text to judicially developed protections involving procedure, dignity, privacy, and related constitutional remedies.',
    subject: 'Constitutional Law I',
    semester: 2,
    actName: 'Constitution of India',
    provisions: [
      { number: 'Article 21', title: 'Protection of life and personal liberty', summary: 'No person may be deprived of life or personal liberty except according to procedure established by law.' },
      { number: 'Article 14', title: 'Equality and non-arbitrariness', summary: 'Provides an important constitutional context for reviewing arbitrary State action affecting life and liberty.' },
      { number: 'Articles 32 and 226', title: 'Constitutional remedies', summary: 'Provide routes for judicial protection of fundamental rights through the Supreme Court and High Courts.' },
    ],
    principles: [
      'Article 21 is interpreted as a protection of meaningful life and liberty, not merely physical existence.',
      'Fairness, reasonableness, and non-arbitrariness inform the review of procedure.',
      'Privacy and dignity are linked to the constitutional protection of personal liberty.',
      'A strong answer should distinguish the text of Article 21 from later judicial development.',
    ],
    caseLaws: [
      { name: 'Maneka Gandhi v. Union of India', citation: '(1978) 1 SCC 248', principle: 'Connected Articles 14, 19, and 21 and required procedure affecting liberty to meet constitutional fairness.' },
      { name: 'Justice K.S. Puttaswamy v. Union of India', citation: '(2017) 10 SCC 1', principle: 'Recognized privacy as a constitutionally protected value grounded in dignity and liberty.' },
    ],
    syllabusTopics: ['Article 21: life, liberty, privacy, environment and dignity', 'Constitutional remedies under Articles 32 and 226', 'Judicial approach to Fundamental Rights'],
    relatedQuestionTypes: ['Constitutional essay', 'Case-law question', 'Short note', 'Long answer'],
    tags: ['constitution', 'article 21', 'privacy', 'dignity'],
    status: 'published',
  },
  {
    slug: 'criminal-general-exceptions',
    title: 'General Exceptions in Criminal Law',
    summary: 'Organize mistake, accident, incapacity, consent, private defence, abetment, conspiracy, and attempt as a revision map for criminal-law analysis.',
    subject: 'Criminal Law Paper I: Bharatiya Nyaya Sanhita, 2023',
    semester: 1,
    actName: 'Bharatiya Nyaya Sanhita, 2023',
    provisions: [
      { number: 'General exceptions', title: 'Absence of criminal intent and excusing circumstances', summary: 'A criminal-law analysis must test whether a general exception removes criminal responsibility on the facts.' },
      { number: 'Private defence', title: 'Defence of person and property', summary: 'The right is controlled by necessity, imminence, proportionality, and statutory limits.' },
      { number: 'Abetment and attempt', title: 'Inchoate liability', summary: 'Participation and conduct falling short of completed offences require separate analysis of intention and acts.' },
    ],
    principles: [
      'A general exception is applied to facts after the prosecution case and relevant mental element are identified.',
      'Private defence is protective, not retaliatory, and must remain within legal limits.',
      'Abetment, conspiracy, and attempt are distinct forms of inchoate or participatory liability.',
      'Always identify the statutory provision and explain how each fact satisfies or fails its ingredients.',
    ],
    caseLaws: [
      { name: 'Dahyabhai Chhaganbhai Thakkar v. State of Gujarat', citation: 'AIR 1964 SC 1563', principle: 'Explains the evidentiary approach to a plea of insanity under criminal law.' },
      { name: 'Darshan Singh v. State of Punjab', citation: '(2010) 2 SCC 333', principle: 'Summarizes important principles governing the right of private defence.' },
    ],
    syllabusTopics: ['Mistake, accident, mental incapacity and intoxication', 'Private defence of person and property', 'Abetment, criminal conspiracy and attempt'],
    relatedQuestionTypes: ['Problem question', 'Short note', 'Case analysis', 'Long answer'],
    tags: ['criminal law', 'general exceptions', 'private defence', 'abetment'],
    status: 'published',
  },
];
