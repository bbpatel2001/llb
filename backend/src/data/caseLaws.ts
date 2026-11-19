export interface CaseLawSeed {
  name: string;
  citation: string;
  court: string;
  year: number;
  facts: string;
  issue: string;
  held: string;
  ratio: string;
  significance: string;
  applicableActs: string[];
  relatedTopics: string[];
  caseNumber?: string;
  judgmentDate?: string;
  bench?: string;
  sourceUrl?: string;
  downloadUrl?: string;
}

/**
 * Foundational cases referenced by the platform's study content.
 * Citations and summaries are kept here so a fresh local database can be
 * populated consistently without requiring manual admin entry.
 */
export const caseLaws: CaseLawSeed[] = [
  {
    name: 'J. Rajesh (Minor) through his Mother and Natural Guardian J. Gomathi v. M. Kumaran (Dead) through LRs & Others',
    citation: '2026 INSC 1208',
    court: 'Supreme Court of India',
    year: 2026,
    caseNumber: 'Civil Appeal No. 7020 of 2012',
    judgmentDate: '6 November 2026',
    bench: 'Justice Augustine George Masih and Justice Sunita Agarwal',
    sourceUrl: 'https://www.sci.gov.in/view-pdf/?diary_no=44032011&from=latest_judgements_order&order_date=2026-11-06&type=j',
    downloadUrl: '/judgments/2026-insc-1208-j-rajesh-v-m-kumaran.pdf',
    facts: 'The minor appellant claimed a half share in property that had devolved on his living father after the grandfather’s intestate death and subsequent partition among the Class I heirs under Section 8 of the Hindu Succession Act, 1956.',
    issue: 'Whether a grandson can claim a birthright or partition share in property inherited by his living father under Section 8 of the Hindu Succession Act, 1956.',
    held: 'The appeal was dismissed. The property inherited by the father under Section 8 and allotted to him on partition was his individual property, and the grandson could not claim a birthright in it while his father was alive.',
    ratio: 'Section 8 is a self-contained scheme of intestate succession. A son’s son is not a Class I heir when his father is alive; the father takes his share in his individual capacity and may deal with or alienate it.',
    significance: 'A current Supreme Court authority distinguishing statutory succession under Section 8 from coparcenary survivorship and birthright claims.',
    applicableActs: ['Hindu Succession Act, 1956 — Section 8', 'Hindu Succession Act, 1956 — Section 6'],
    relatedTopics: ['Hindu succession', 'Class I heirs', 'Coparcenary', 'Ancestral property', 'Birthright'],
  },
  {
    name: 'Carlill v Carbolic Smoke Ball Co.',
    citation: '[1893] 1 QB 256',
    court: "Queen's Bench",
    year: 1893,
    facts: 'The company advertised that it would pay £100 to anyone who used its smoke ball as directed and still contracted influenza. Mrs Carlill used the product, contracted influenza, and claimed the reward.',
    issue: 'Whether the advertisement was a serious offer capable of acceptance and whether Mrs Carlill had provided consideration.',
    held: 'The advertisement was a unilateral offer to the world, accepted by performing its conditions. Mrs Carlill was entitled to the reward.',
    ratio: 'A clear unilateral promise may be accepted by performance, and performance of the specified condition can provide consideration without separate notification of acceptance.',
    significance: 'A leading authority on offer, acceptance, unilateral contracts, and consideration.',
    applicableActs: ['Indian Contract Act, 1872'],
    relatedTopics: ['Offer and acceptance', 'Unilateral contract', 'Consideration'],
  },
  {
    name: 'Donoghue v Stevenson',
    citation: '[1932] AC 562',
    court: 'House of Lords',
    year: 1932,
    facts: 'Mrs Donoghue became ill after drinking ginger beer from an opaque bottle that allegedly contained a decomposed snail. She had purchased the drink for her by a friend and had no contract with the manufacturer.',
    issue: 'Whether a manufacturer owed a duty of care to a consumer with whom the manufacturer had no contract.',
    held: 'A manufacturer owes a duty to take reasonable care to avoid foreseeable injury to persons closely and directly affected by its acts.',
    ratio: 'The neighbour principle establishes that reasonable care is owed to persons who are so closely and directly affected that they ought reasonably to be contemplated.',
    significance: 'The foundational modern authority for the negligence duty of care.',
    applicableActs: ['Law of Torts'],
    relatedTopics: ['Negligence', 'Duty of care', 'Neighbour principle'],
  },
  {
    name: 'Hadley v Baxendale',
    citation: '(1854) 9 Exch 341',
    court: "Court of Exchequer",
    year: 1854,
    facts: 'A carrier delayed delivery of a broken mill shaft, keeping the mill closed for longer than expected. The mill owner claimed lost profits from the delay.',
    issue: 'Which losses caused by breach of contract are recoverable as damages.',
    held: 'Loss is recoverable when it arises naturally from the breach or was within the reasonable contemplation of the parties when they contracted.',
    ratio: 'Contract damages are limited by the rule of reasonable contemplation and are not awarded for unusually remote consequences unknown to the defendant.',
    significance: 'The leading remoteness rule for damages for breach of contract.',
    applicableActs: ['Indian Contract Act, 1872'],
    relatedTopics: ['Contract damages', 'Remoteness', 'Breach of contract'],
  },
  {
    name: 'Rylands v Fletcher',
    citation: '(1868) LR 3 HL 330',
    court: 'House of Lords',
    year: 1868,
    facts: 'Water from a reservoir constructed on the defendant\'s land escaped through undiscovered shafts and flooded the claimant\'s working mine.',
    issue: 'Whether a person who brings and keeps a dangerous thing on land is liable for damage caused by its escape.',
    held: 'A person who makes a non-natural use of land and keeps a dangerous thing there is liable for damage caused by its escape, subject to recognised exceptions.',
    ratio: 'Strict liability may arise for the escape of a dangerous thing accumulated through a non-natural use of land.',
    significance: 'A classic authority on strict liability in tort.',
    applicableActs: ['Law of Torts'],
    relatedTopics: ['Strict liability', 'Nuisance', 'Escape of dangerous things'],
  },
  {
    name: 'Kesavananda Bharati v State of Kerala',
    citation: '(1973) 4 SCC 225',
    court: 'Supreme Court of India',
    year: 1973,
    facts: 'The petitioner challenged constitutional amendments affecting property rights and the extent of Parliament\'s power to amend the Constitution.',
    issue: 'Whether Parliament\'s amending power under Article 368 is unlimited.',
    held: 'Parliament may amend the Constitution but cannot alter its basic structure.',
    ratio: 'The basic structure doctrine limits the constituent power of amendment and protects the Constitution\'s essential features.',
    significance: 'The leading Indian constitutional authority on the basic structure doctrine.',
    applicableActs: ['Constitution of India', 'Article 368'],
    relatedTopics: ['Constitutional law', 'Basic structure', 'Judicial review'],
  },
  {
    name: 'Maneka Gandhi v Union of India',
    citation: '(1978) 1 SCC 248',
    court: 'Supreme Court of India',
    year: 1978,
    facts: 'The petitioner\'s passport was impounded without furnishing reasons, and the validity of the procedure affecting her personal liberty was challenged.',
    issue: 'Whether a procedure depriving personal liberty must be fair, just, and reasonable and comply with the guarantees of Articles 14, 19, and 21.',
    held: 'The procedure established by law must be fair, non-arbitrary, and reasonable; Articles 14, 19, and 21 are not isolated guarantees.',
    ratio: 'State action affecting life or personal liberty must satisfy substantive and procedural fairness and non-arbitrariness.',
    significance: 'A landmark decision expanding the protection of life and personal liberty under Article 21.',
    applicableActs: ['Constitution of India', 'Articles 14, 19, and 21'],
    relatedTopics: ['Fundamental rights', 'Personal liberty', 'Natural justice'],
  },
  {
    name: 'Vishaka v State of Rajasthan',
    citation: '(1997) 6 SCC 241',
    court: 'Supreme Court of India',
    year: 1997,
    facts: 'A public interest petition sought protection for women from sexual harassment at the workplace where no specific domestic legislation was then in force.',
    issue: 'Whether the Court could prescribe enforceable workplace safeguards against sexual harassment in the absence of legislation.',
    held: 'The Court laid down binding guidelines for prevention and redressal of workplace sexual harassment until Parliament enacted legislation.',
    ratio: 'Constitutional guarantees of equality, dignity, and the freedom to work require effective safeguards against workplace sexual harassment.',
    significance: 'The foundational Indian authority that led to statutory workplace sexual-harassment protections.',
    applicableActs: ['Constitution of India', 'Articles 14, 15, 19, and 21'],
    relatedTopics: ['Fundamental rights', 'Gender justice', 'Workplace safety'],
  },
  {
    name: 'State of Maharashtra v Mayer Hans George',
    citation: 'AIR 1965 SC 722',
    court: 'Supreme Court of India',
    year: 1965,
    facts: 'A foreign national was prosecuted for bringing gold into India contrary to a later notification regulating the import of gold.',
    issue: 'Whether a person could be convicted for violating a notification made under delegated legislative authority without proof of personal knowledge of the notification.',
    held: 'The regulatory notification was valid and the offence could be established under the applicable statutory scheme.',
    ratio: 'Delegated legislation made within statutory authority may create enforceable regulatory obligations where the parent law so provides.',
    significance: 'An important criminal-law and delegated-legislation case referenced in the platform syllabus.',
    applicableActs: ['Foreign Exchange Regulation Act, 1947'],
    relatedTopics: ['Criminal law', 'Delegated legislation', 'Regulatory offences'],
  },
];
