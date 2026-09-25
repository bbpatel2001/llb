/**
 * Structured catalogue for Gujarat University, Three Years LL.B. Programme
 * with Credit Based System, effective academic year 2026-27.
 *
 * This file stores syllabus metadata and an outline of units/topics only. It
 * deliberately does not reproduce textbook pages, case reports, PDF pages, or
 * other protected study material. Later learning content must be generated as
 * original explanations or linked to official/public-domain primary sources.
 */

export type StructuredCourseCategory = 'core' | 'foundation' | 'elective' | 'soft-skill';

interface UnitDefinition {
  name: string;
  topics: string[];
}

interface CourseDefinition {
  semester: number;
  code: string;
  title: string;
  category: StructuredCourseCategory;
  lectureHoursPerWeek: number;
  otherHoursPerWeek: number;
  credits: number;
  maxMarks: number;
  endSemesterMarks?: number;
  internalAssessmentMarks?: number;
  units: UnitDefinition[];
  objectives?: string[];
  references: string[];
}

const commonObjectives = (focus: string): string[] => [
  `Build a working understanding of ${focus} through the prescribed Indian legal framework.`,
  'Connect statutory principles, constitutional values, legal reasoning, and relevant judicial approaches.',
  'Develop the ability to read primary legal sources and apply the principles to practical problems.',
];

const commonReferences = (laws: string[]): string[] => [
  ...laws,
  'Constitution of India (official text).',
  'India Code and official Gazette publications for current statutory text.',
];

const course = (
  semester: number,
  code: string,
  title: string,
  category: StructuredCourseCategory,
  units: UnitDefinition[],
  references: string[],
  options: Partial<Pick<CourseDefinition, 'lectureHoursPerWeek' | 'otherHoursPerWeek' | 'credits' | 'maxMarks' | 'endSemesterMarks' | 'internalAssessmentMarks' | 'objectives'>> = {},
): CourseDefinition => ({
  semester,
  code,
  title,
  category,
  lectureHoursPerWeek: options.lectureHoursPerWeek ?? (category === 'core' || category === 'elective' ? 4 : 1),
  otherHoursPerWeek: options.otherHoursPerWeek ?? 1,
  credits: options.credits ?? (category === 'core' || category === 'elective' ? 5 : 2),
  maxMarks: options.maxMarks ?? 100,
  endSemesterMarks: options.endSemesterMarks,
  internalAssessmentMarks: options.internalAssessmentMarks,
  units,
  objectives: options.objectives ?? commonObjectives(title),
  references,
});

export const structuredCourseDefinitions: CourseDefinition[] = [
  // Semester I
  course(1, '101', 'Law of Tort including Motor Vehicle Accident and Consumer Protection Laws', 'core', [
    { name: 'General principles of tort', topics: ['Meaning and scope of tort; distinction from crime and breach of contract', 'Damnum sine injuria and injuria sine damnum', 'Volenti non fit injuria and other maxims', 'Vicarious liability: basis, scope, justification and different types', 'Extinction of liability and defences'] },
    { name: 'Torts against person, property, freedom and reputation', topics: ['Trespass to person: assault, battery and false imprisonment', 'Trespass to property and related forms of nuisance', 'Defamation and torts affecting reputation and personal relations', 'Negligence, nuisance and fraud', 'Third-party liability under motor vehicle law'] },
    { name: 'Liability and remedies', topics: ['Strict liability and the rule in Rylands v Fletcher', 'Absolute liability and public-hazard liability', 'Remoteness of damage, foreseeability and directness', 'Injunction, restitution, self-help, re-entry and recaption', 'Extra-legal remedies and damages'] },
    { name: 'Consumer protection', topics: ['Consumer and goods/services definitions', 'Deficiency and commercial or professional services', 'Medical services and denial of services', 'Consumer Protection Councils', 'District, State and National redressal agencies and judicial review'] },
  ], commonReferences(['Consumer Protection Act, 2019', 'Motor Vehicles Act, 1988', 'Official consumer-protection rules and regulations'])),
  course(1, '102', 'Criminal Law Paper I: Bharatiya Nyaya Sanhita, 2023 (Chapters I to VI)', 'core', [
    { name: 'General principles and punishments', topics: ['Objects, reasons and structure of the Bharatiya Nyaya Sanhita, 2023', 'Concept of crime, stages of crime, mens rea and jurisdiction', 'Terrorism, extra-territorial jurisdiction and general explanations', 'Kinds of punishment and theories of punishment', 'Death sentence, imprisonment, fine, forfeiture, community service and enhanced punishment'] },
    { name: 'General exceptions and abetment', topics: ['Mistake, judicial acts, accident and absence of criminal intent', 'Mental incapacity, intoxication, consent and involuntary acts', 'Private defence of person and property', 'Abetment inside and outside India and criminal conspiracy', 'Attempt and punishment for attempt'] },
    { name: 'Offences against women and children', topics: ['Sexual offences and punishment', 'Gang rape and related provisions', 'Sexual harassment and assault/use of criminal force', 'Voyeurism, stalking and electronic forms of offending', 'Dowry death, cruelty and offences against children'] },
    { name: 'Offences affecting the human body', topics: ['Culpable homicide, murder and negligent death', 'Attempt to murder and attempt to culpable homicide', 'Abetment of suicide', 'Organised crime, petty organised crime and terrorist acts', 'Hurt, grievous hurt, wrongful restraint, assault, kidnapping, abduction and trafficking'] },
  ], commonReferences(['Bharatiya Nyaya Sanhita, 2023', 'Official constitutional and criminal-law materials']), { objectives: commonObjectives('the general principles and selected offences under the Bharatiya Nyaya Sanhita, 2023') }),
  course(1, '103', 'Criminal Law Paper II: Bharatiya Nyaya Sanhita, 2023 (Chapters VII to XX)', 'core', [
    { name: 'Offences against the State, armed forces and elections', topics: ['Waging war and acts endangering sovereignty, unity and integrity', 'Public servant allowing escape and harbouring', 'Offences relating to the Army, Navy and Air Force', 'Offences relating to coin, currency notes, bank notes and government stamps'] },
    { name: 'Public tranquillity and public servants', topics: ['Unlawful assembly, common object, common intention and rioting', 'Promoting enmity and assertions prejudicial to national integration', 'Disobedience of public-servant directions and non-treatment of victims', 'Contempts of lawful authority, obstruction and threats to public servants'] },
    { name: 'False evidence, public justice, health and religion', topics: ['Giving or fabricating false evidence and false certificates', 'Harbouring offenders and disobedience intended to save a person', 'Public nuisance, adulteration and negligent conduct with dangerous substances', 'Obscene material and conduct', 'Offences relating to religion'] },
    { name: 'Property, documents, property marks and miscellaneous offences', topics: ['Theft, extortion, robbery, dacoity and stolen property', 'Criminal misappropriation, breach of trust and cheating', 'Criminal trespass, house-breaking and house-trespass', 'Forgery, false documents, electronic records and property marks', 'Criminal intimidation, insult, defamation, repeal and savings'] },
  ], commonReferences(['Bharatiya Nyaya Sanhita, 2023', 'Official criminal-law and constitutional materials'])),
  course(1, '104', 'Law of Contract', 'core', [
    { name: 'General principles of contract', topics: ['Agreement, contract, elements and kinds', 'Proposal, communication, revocation and invitation to offer', 'Acceptance and its essential elements', 'Consideration and capacity to contract'] },
    { name: 'Capacity and free consent', topics: ['Minor agreements and effects of minority', 'Free consent: coercion, undue influence, fraud and misrepresentation', 'Mistake of law and fact', 'Legality of object, void agreements, wagering and uncertain agreements'] },
    { name: 'Discharge and quasi-contracts', topics: ['Modes of discharge and their effects', 'Anticipatory breach', 'Impossibility and frustration of performance', 'Rescission, alteration, remission, waiver, extension and accord', 'Quasi-contractual relations and quantum meruit'] },
    { name: 'Specific Relief Act', topics: ['Persons against whom specific enforcement may be ordered', 'Rescission and cancellation', 'Temporary and perpetual injunctions', 'Declaratory orders and judicial discretion'] },
  ], commonReferences(['Indian Contract Act, 1872', 'Specific Relief Act, 1963', 'Limitation Act, 1963'])),
  course(1, '105', 'Special Contract', 'core', [
    { name: 'Indemnity and guarantee', topics: ['Indemnity, need, definition and creation of obligations', 'Commencement, nature and extent of indemnifier liability', 'Indemnity documents and clauses', 'Guarantee, essentials and rights and liabilities of surety'] },
    { name: 'Bailment, pledge and agency', topics: ['Bailment and rights/duties of bailor and bailee', 'Pledge, pawnee, pawnor and permissible pledges', 'Agency: creation, principal-agent relations and third parties', 'Termination of agency and continuing liabilities'] },
    { name: 'Sale of goods', topics: ['Contract of sale, essentials and implied terms', 'Caveat emptor and its exceptions', 'Conditions, warranties, title and risk', 'Delivery, unpaid seller and buyer rights'] },
    { name: 'Partnership', topics: ['Nature, scope, definition and kinds of partnership', 'Rights, duties and liabilities of partners', 'Registration and effects of non-registration', 'Dissolution and limited-liability partnership principles'] },
  ], commonReferences(['Indian Contract Act, 1872', 'Sale of Goods Act, 1930', 'Partnership Act, 1932', 'Limited Liability Partnership Act, 2008'])),
  course(1, '106', 'Constitutional History of India', 'foundation', [
    { name: 'Constitutional history before independence', topics: ['Fourth Law Commission recommendations and Simon Commission', 'Nehru Report, Muslim League demand and Poona Pact', 'Government of India Act, 1935: federal, provincial and legislative features'] },
    { name: 'Developments before constitution making', topics: ['Round Table Conferences', 'Cripps Mission and Cabinet Mission', 'Rajagopalachari Formula and Wavell Plan', 'Attlee Statement and Mountbatten Plan'] },
    { name: 'Constitution-making bodies', topics: ['Framing of the Constitution', 'Constituent Assembly and members contribution', 'Drafting Committee and its contribution', 'Final draft, adoption and Indian Independence Act, 1947'] },
  ], commonReferences(['Government of India Act, 1935', 'Indian Independence Act, 1947', 'Constitution of India (official text)'])),
  course(1, '107', 'Use of Law Journals and Legal Software', 'soft-skill', [
    { name: 'Legal journalism and reasoning', topics: ['Legal-journal ethics and legal reasoning', 'Importance of law journals and legal articles', 'Criticism and analysis of judgments', 'Finding new Bills and legislation in journals'] },
    { name: 'Using law journals', topics: ['Formats and types of law journals', 'Finding relevant judgments', 'Minority and majority views in judgments', 'International and foreign law journals'] },
    { name: 'Legal software and case work', topics: ['Types, features, installation and operating systems of legal software', 'Searching judgments and locating overruled decisions', 'Commenting and reporting judgments', 'Paperless court work and responsible use of AI in court management'] },
  ], commonReferences(['Official Supreme Court of India judgments portal', 'Official e-Courts services portal', 'Library and legal-research ethics guidance']), { objectives: commonObjectives('legal research, journals, judgments and responsible legal-technology use') }),

  // Semester II
  course(2, '108', 'Constitutional Law I', 'core', [
    { name: 'Preamble and citizenship', topics: ['Purpose, objectives and importance of the Preamble', 'Preamble, basic structure and constitutional interpretation', 'Salient features and citizenship'] },
    { name: 'Fundamental Rights I', topics: ['Article 12 State and Article 13 judicial approach', 'Equality and protective discrimination', 'Article 19 freedoms and reasonable restrictions', 'Exploitation, untouchability and double jeopardy', 'Constitutional remedies under Articles 32 and 226'] },
    { name: 'Fundamental Rights II', topics: ['Article 21 life, liberty, privacy, environment and dignity', 'Arrest and detention safeguards', 'Freedom of religion and secularism', 'Traffic, forced labour, child employment and education', 'Cultural and educational rights and Article 31-B'] },
    { name: 'Directive principles and duties', topics: ['Nature and relationship of Directive Principles with Fundamental Rights', 'Non-enforceability and classification', 'Uniform Civil Code and constitutional challenges', 'Fundamental Duties and their significance'] },
  ], commonReferences(['Constitution of India (official text)', 'Official Supreme Court of India constitutional decisions'])),
  course(2, '109', 'Constitutional Law II', 'core', [
    { name: 'Executive, legislature and judiciary', topics: ['Union and State executives', 'Parliament, State legislatures, membership, disqualification and procedure', 'Supreme Court and High Courts: appointment, jurisdiction and writs', 'Original, appellate, advisory and review powers'] },
    { name: 'Constitutional amendment', topics: ['Article 368 procedure', 'Limits on Parliament amendment power', 'Judicial pronouncements on amendment', 'Basic structure doctrine'] },
    { name: 'Emergency provisions', topics: ['National emergency and effects on rights', 'Failure of constitutional machinery in States', 'Sarkaria Commission and federal emergency principles', 'Financial emergency'] },
    { name: 'Miscellaneous constitutional fields', topics: ['Property, constitutional offices and elections', 'Official language, freedom of trade and GST Council', 'Union-State legislative, administrative and financial relations', 'Consolidated/contingency funds, CAG, commissions and tribal areas'] },
  ], commonReferences(['Constitution of India (official text)', 'Official constitutional amendment materials and Supreme Court decisions'])),
  course(2, '110', 'Company Law', 'core', [
    { name: 'Introduction, memorandum and articles', topics: ['Company, corporate personality and kinds of companies', 'Registration and incorporation', 'Memorandum of Association, clauses, alteration and ultra vires', 'Articles of Association, binding force and indoor management'] },
    { name: 'Prospectus, promoters, shares and members', topics: ['Prospectus, misrepresentation, remedies and red-herring prospectus', 'Promoters, allotment and transfer of shares', 'Dematerialised shares and members', 'Share capital, alteration, reduction and buy-back'] },
    { name: 'Directors, dividends, audit and oppression', topics: ['Appointment, qualifications, vacation, removal, powers and duties of directors', 'Dividends, accounts, audit and debentures', 'Fixed and floating charges', 'Oppression and mismanagement and minority protection'] },
    { name: 'Reconstruction and winding up', topics: ['Reconstruction and amalgamation', 'Winding up under insolvency law', 'Corporate social responsibility and civil/criminal liability', 'National Company Law Tribunal and Appellate Tribunal'] },
  ], commonReferences(['Companies Act, 2013', 'Insolvency and Bankruptcy Code, 2016', 'Official Ministry of Corporate Affairs materials'])),
  course(2, '111', 'Environmental Law', 'core', [
    { name: 'Environment and pollution', topics: ['Natural and human-made environment', 'Ecosystem and ecological balance', 'Meaning, causes and effects of environmental pollution', 'Air, water and noise pollution'] },
    { name: 'International and constitutional protection', topics: ['Stockholm and Rio conferences and sustainable development', 'Right to a clean environment under Article 21 and related provisions', 'Judicial contribution through PILs', 'Public trust doctrine and polluter-pays principle'] },
    { name: 'Environmental protection legislation', topics: ['Water pollution prevention law', 'Air pollution prevention law', 'Environment Protection Act, central government powers and environmental provisions', 'National Green Tribunal: objects and features'] },
    { name: 'Wildlife, forests, insurance and animal welfare', topics: ['Public Liability Insurance Act', 'Wild Life (Protection) Act', 'Forest Act and protected areas', 'Prevention of Cruelty to Animals Act'] },
  ], commonReferences(['Environment (Protection) Act, 1986', 'Water (Prevention and Control of Pollution) Act, 1974', 'Air (Prevention and Control of Pollution) Act, 1981', 'National Green Tribunal Act, 2010', 'Wild Life (Protection) Act, 1972'])),
  course(2, '112', 'Property Law', 'core', [
    { name: 'General principles of transfer I', topics: ['Movable, immovable, tangible, non-tangible and intellectual property', 'Competency and properties that may be transferred', 'Transfer for benefit of an unborn child', 'Rule against perpetuity and vested/contingent interests'] },
    { name: 'General principles of transfer II', topics: ['Doctrine of election', 'Lis pendens: principle, application and exceptions', 'Fraudulent transfer', 'Part performance and its essentials'] },
    { name: 'Specific transfers', topics: ['Sale and buyer/seller rights and liabilities', 'Mortgage, charge, redemption and foreclosure', 'Lease, lessor/lessee rights and liabilities', 'Gift and actionable claims'] },
    { name: 'Easements and licences', topics: ['Meaning and characteristics of easements', 'Kinds, incidents and creation of easements', 'Rights of way, air, support and water', 'Extinction, suspension, revival and licences'] },
  ], commonReferences(['Transfer of Property Act, 1882', 'Indian Easements Act, 1882', 'Registration Act, 1908'])),
  course(2, '113', 'Principles of Political Science and Theory', 'foundation', [
    { name: 'Citizenship, federalism and judicial review', topics: ['Citizenship and State-citizen relations', 'Unitary, federal and quasi-federal systems', 'Coalition government and anti-defection', 'Basic structure and judicial review'] },
    { name: 'State under Article 12 and constitutional principles', topics: ['Article 12 definition and judicial expansion', 'Public authorities and liberalisation', 'Sovereignty and supremacy of the Constitution', 'Austin and competing theories of sovereignty'] },
    { name: 'Democratic systems and doctrines', topics: ['Parliamentary and presidential systems', 'Separation of powers', 'Doctrine of eclipse and waiver of fundamental rights', 'Rule of law and procedure established by law'] },
  ], commonReferences(['Constitution of India (official text)', 'Official parliamentary and election materials'])),
  course(2, '114', 'Use of Internet in Legal Education', 'soft-skill', [
    { name: 'Internet research for legal education', topics: ['Law-related websites and their kinds', 'Finding international conventions, treaties and foreign laws', 'Searching judgments and submitting articles or abstracts', 'Speed and reliability of online legal research'] },
    { name: 'ICT and AI in the legal field', topics: ['Search engines and legal websites', 'PDF, presentation and head-note research', 'Legal news, Bills and legislative status', 'Online court services, e-filing and responsible AI use'] },
    { name: 'Case status and office management', topics: ['Finding High Court and Supreme Court case status', 'Cause lists, next-day lists and business allocation', 'Online judgment and case-file verification', 'Legal research and online seminar submission'] },
  ], commonReferences(['Official Supreme Court and High Court websites', 'e-Courts Services portal', 'Government digital-justice and e-filing guidance']), { objectives: commonObjectives('safe, efficient and verifiable Internet and ICT use in legal education') }),

  // Semester III
  course(3, '201', 'Family Law I', 'core', [
    { name: 'Family, sources and marriage', topics: ['Family systems and sources of family law', 'Schools of family law and Uniform Civil Code debates', 'Marriage essentials under Hindu, Muslim, Parsi, Christian and special laws', 'Live-in relationships, void/irregular marriage and custom'] },
    { name: 'Matrimonial disputes and remedies', topics: ['Non-judicial resolution of matrimonial conflict', 'Restitution, judicial separation and dissolution', 'Customary, unilateral, mutual-consent and other divorce grounds', 'Muslim divorce, triple talaq and judicial approaches'] },
    { name: 'Guardianship and adoption', topics: ['Guardianship under different personal laws', 'Adoption under family laws and CARA guidelines', 'Child welfare and legal status of adopted children'] },
    { name: 'Maintenance and social protection', topics: ['Maintenance of neglected wives and divorced wives', 'Maintenance of children and parents', 'Maintenance under Bharatiya Nagarik Suraksha Sanhita, 2023', 'Muslim Women (Protection of Rights on Divorce) Act and contemporary issues'] },
  ], commonReferences(['Hindu Marriage Act, 1955', 'Hindu Succession Act, 1956', 'Hindu Minority and Guardianship Act, 1956', 'Special Marriage Act, 1954', 'Juvenile Justice (Care and Protection of Children) Act, 2015', 'Bharatiya Nagarik Suraksha Sanhita, 2023'])),
  course(3, '202', 'Labour and Industrial Law I', 'core', [
    { name: 'Labour jurisprudence and new labour codes', topics: ['History, development, welfare and globalisation', 'ILO and National Commission on Labour perspectives', 'Changing labour relations in liberalisation and privatisation', 'Code on Wages and Industrial Relations Code objectives'] },
    { name: 'Code on Wages, 2019', topics: ['Worker, employer and wage definitions', 'Minimum wages, fixation, revision and working hours', 'Payment, deductions, bonus and claims', 'Inspectors, facilitation, offences and penalties'] },
    { name: 'Industrial Relations Code, 2020', topics: ['Industry, employee, employer, fixed-term employment and worker', 'Works committees and grievance redressal', 'Trade-union registration, recognition, rights and collective bargaining', 'Standing orders, discipline and subsistence allowance'] },
    { name: 'Industrial disputes and miscellaneous provisions', topics: ['Strikes, lockouts, lay-off, retrenchment and closure', 'Dispute settlement through conciliation, tribunals and adjudication', 'Unfair labour practices, re-skilling fund and penalties', 'Conditions of service and government powers'] },
  ], commonReferences(['Code on Wages, 2019', 'Industrial Relations Code, 2020', 'Official Ministry of Labour and Employment materials'])),
  course(3, '203', 'Principles of Taxation Law', 'core', [
    { name: 'Income Tax Act, 2025', topics: ['Structure and principal concepts of the current Income Tax Act, 2025', 'Direct-tax concepts and constitutional allocation of taxing power'] },
    { name: 'Gujarat Goods and Services Tax Act, 2017', topics: ['Concept, objects and reasons for GST', 'Definitions, taxable person, supply and authorities', 'Registration, cancellation, payment, interest and penalties', 'Returns, refunds, assessment, audit, inspection, seizure and appeal'] },
    { name: 'Central GST and constitutional perspective', topics: ['Central Goods and Services Tax and service tax framework', 'Levy and collection of Central GST', 'Article 279-A and GST Council', 'Constitution, functions and powers of the GST Council'] },
    { name: 'Integrated GST', topics: ['Objects and application of IGST', 'Place of supply for imported and exported goods/services', 'Refund and apportionment of tax', 'Input-tax credit and settlement of funds'] },
  ], commonReferences(['Income Tax Act, 2025 (official text)', 'Central Goods and Services Tax Act, 2017', 'Integrated Goods and Services Tax Act, 2017', 'Gujarat Goods and Services Tax Act, 2017', 'Constitution of India, Article 279-A'])),
  course(3, '204', 'Administrative Law', 'core', [
    { name: 'Introduction and constitutional principles', topics: ['Nature, scope and growth of administrative law', 'Relationship between administrative and constitutional law', 'Rule of law, separation of powers and natural justice', 'Administrative, judicial and quasi-judicial functions'] },
    { name: 'Delegated legislation and quasi-judicial functions', topics: ['Reasons for growth and comparative perspective', 'Delegation in the United States and India', 'Sub-delegation and limits on delegation', 'Legislative, judicial and other controls'] },
    { name: 'Judicial review and remedies', topics: ['Administrative discretion and judicial review', 'Failure, excess and abuse of discretion', 'Writs, statutory remedies, appeals and PIL', 'Ombudsman, Lokpal, Lokayukt and self-help'] },
    { name: 'Tribunals and miscellaneous principles', topics: ['Administrative tribunals and distinction from courts', 'Government liability in contract and tort', 'Public corporations and control over them', 'Vigilance, legitimate expectation and unjust enrichment'] },
  ], commonReferences(['Administrative Tribunals Act, 1985', 'Lokpal and Lokayuktas Act, 2013', 'Constitution of India, Articles 32 and 226', 'Official administrative-law and tribunal materials'])),
  course(3, '205', 'Public International Law', 'core', [
    { name: 'Definition and concept', topics: ['Definition, nature and functions', 'Public and private international law', 'International law as a developing normative system', 'Development of international law in India'] },
    { name: 'Theoretical foundations and persons', topics: ['Sovereign equality, non-intervention and non-use of force', 'International cooperation and peaceful dispute settlement', 'Individuals as subjects and treatment of aliens', 'International organisations including ILO, UNESCO and UNICEF'] },
    { name: 'Sources, jurisdiction and responsibility', topics: ['Custom, treaties, general principles, decisions and juristic writings', 'Subjects and jurisdiction of international law', 'State responsibility', 'Recognition, territory and state jurisdiction'] },
    { name: 'Treaties, security and human rights', topics: ['Extradition, asylum and treaties', 'Security Council and international terrorism', 'Aircraft hijacking, piracy and cyber-terrorism', 'Disarmament and threat to human rights'] },
  ], commonReferences(['Charter of the United Nations', 'Universal Declaration of Human Rights', 'Vienna Convention on the Law of Treaties, 1969', 'Official International Court of Justice materials'])),
  course(3, '206', 'Principles of Equity', 'foundation', [
    { name: 'Origin, development and importance', topics: ['Historical background, definition, nature and scope', 'Equity as a branch of law and as conscience', 'Development and practice of equity in India', 'Equitable rights, interests and estates'] },
    { name: 'Maxims of Equity I', topics: ['Equity will not suffer a wrong without a remedy', 'Equity follows the law', 'He who seeks equity must do equity', 'Clean hands, delay defeats equity and equality'] },
    { name: 'Maxims of Equity II', topics: ['Intent rather than form', 'Equity regards as done what ought to be done', 'Equity imputes an intention to fulfil an obligation', 'Equity acts in personam and priority principles'] },
  ], commonReferences(['Specific Relief Act, 1963', 'Trusts Act, 1882', 'Constitution of India and official judicial materials'])),
  course(3, '207', 'Legal Terms, Phrases and Maxims', 'soft-skill', [
    { name: 'Legal terms and phrases', topics: ['Meaning, use and importance of legal terms', 'Equivalent terms and drafting in sentences', 'Abandon, accord, acquiescence, caveat emptor, damages and domicile', 'Estoppel, injunction, jurisdiction, negligence, sub judice and tenancy'] },
    { name: 'Legal maxims I', topics: ['Actio personalis moritur cum persona', 'Actus non facit reum nisi mens sit rea', 'Delegatus non potest delegare', 'Damnum sine injuria and ex nudo pacto non oritur actio'] },
    { name: 'Legal maxims II', topics: ['Res ipsa loquitur and respondeat superior', 'Salus populi suprema lex and sic utere tuo', 'Ubi jus ibi remedium and volenti non fit injuria', 'Applying maxims through decided cases and examples'] },
  ], commonReferences(['Official legal dictionaries and court terminology guides', 'Constitution of India and primary statutory texts']), { objectives: commonObjectives('legal vocabulary, phrases and maxims used in Indian legal practice') }),

  // Semester IV
  course(4, '208', 'Legal Methods and Legal Theories (Jurisprudence)', 'core', [
    { name: 'Introduction and sources of law', topics: ['Meaning, nature and importance of jurisprudence', 'Law, morality and justice', 'Legislation, custom, precedent and stare decisis', 'Juristic writings and legal method'] },
    { name: 'Schools of jurisprudence', topics: ['Analytical positivism and Austin', 'Natural law and historical school', 'Sociological school and social engineering', 'Kelsen, Hart and legal realism'] },
    { name: 'Legal rights, duties and persons', topics: ['Rights, duties and correlative relationships', 'Natural and artificial persons', 'Corporate personality and aggregate entities', 'Unborn, minor, lunatic, drunk and dead persons'] },
    { name: 'Liability, ownership and possession', topics: ['Conditions for imposing liability', 'Mens rea, intention, negligence, vicarious and strict liability', 'Possession, corpus possessionis and animus possidendi', 'Ownership and distinction between ownership and possession'] },
  ], commonReferences(['Constitution of India (official text)', 'Official Indian judicial decisions on precedent and legal theory'])),
  course(4, '209', 'Family Law II', 'core', [
    { name: 'Joint family', topics: ['Mitakshara joint family and coparcenary', 'Mitakshara and Dayabhaga formation and incidents', 'Karta, alienation, partition, reunion and joint-family property', 'Joint family as social security and impact of tax laws'] },
    { name: 'Inheritance', topics: ['Hindu succession and intestate succession', 'Hindu Succession Act, 1956 and devolution', 'Mitakshara coparcenary and female intestate succession', 'Muslim heirs, schools and distribution', 'Christian, Parsi and Jewish succession under Indian law'] },
    { name: 'Gifts', topics: ['Essentials and subject matter of gifts under family laws', 'Competency of donor and donee', 'Hiba, sadaqah, marz-ul-maut and revocation'] },
    { name: 'Family Courts and miscellaneous provisions', topics: ['Family Courts: concept, need, constitution and jurisdiction', 'Appearance of advocates and exemptions', 'Appeals under Family Courts Act', 'Protection of Women from Domestic Violence Act, 2005'] },
  ], commonReferences(['Hindu Succession Act, 1956', 'Indian Succession Act, 1925', 'Family Courts Act, 1984', 'Protection of Women from Domestic Violence Act, 2005'])),
  course(4, '210', 'Interpretation of Statutes and Principles of Legislation', 'core', [
    { name: 'General rules of statutory interpretation', topics: ['Meaning, commencement, operation and repeal of statutes', 'Interpretation, construction, purpose and importance', 'Literal, golden, mischief and harmonious construction', 'Noscitur a sociis, ejusdem generis and reddendo singula singulis'] },
    { name: 'Aids to interpretation', topics: ['Internal aids: title, preamble, headings, notes and punctuation', 'Sections, sub-sections, illustrations, exceptions and provisos', 'Schedules, non-obstante clauses and saving clauses', 'External aids: dictionaries, translations, travaux préparatoires and reports'] },
    { name: 'Presumptions', topics: ['Presumption of validity and territorial operation', 'Jurisdiction and avoidance of absurdity', 'Presumption against injustice or impairment of obligations', 'Prospective operation'] },
    { name: 'Constitutional and subject-specific interpretation', topics: ['Restrictive and beneficial construction', 'Taxing, penal and welfare statutes', 'Harmonious construction, pith and substance and colourable legislation', 'Repugnancy, prospective overruling and eclipse'] },
  ], commonReferences(['General Clauses Act, 1897', 'Constitution of India (official text)', 'Official statutory interpretation decisions'])),
  course(4, '211', 'Labour and Industrial Law II', 'core', [
    { name: 'Code on Social Security, 2020 I', topics: ['Objects, definitions and social-security organisations', 'Employees Provident Fund and insurance corporation', 'National Social Security Board and State boards', 'ESI fund, contributions, benefits and dependants'] },
    { name: 'Code on Social Security, 2020 II', topics: ['Gratuity and continuous service', 'Maternity benefit and nursing or crèche facilities', 'Employees compensation and occupational injury', 'Building and other construction workers and unorganised workers'] },
    { name: 'Occupational Safety, Health and Working Conditions Code', topics: ['Objectives, establishments, factories, mines and manufacturing', 'Employer and employee duties and registration', 'Occupational safety, health advisory boards and welfare provisions', 'Hours, annual leave, inspectors and special provisions'] },
    { name: 'Special provisions and enforcement', topics: ['Women, contract labour and inter-State migrant workers', 'Audio-visual, bidi, cigar and construction workers', 'Factories, offences, penalties and social-security fund', 'Exemptions, age, common licence and public emergency'] },
  ], commonReferences(['Code on Social Security, 2020', 'Occupational Safety, Health and Working Conditions Code, 2020', 'Official Ministry of Labour and Employment materials'])),
  course(4, '212', 'Human Right Law and Practice', 'elective', [
    { name: 'Human rights: general', topics: ['Meaning, sources and basic concepts', 'Different definitions and classification', 'Historical development in Indian and Western traditions', 'Natural law, natural rights and international/national law'] },
    { name: 'United Nations and human rights', topics: ['Universal Declaration of Human Rights', 'International Covenant on Civil and Political Rights', 'International Covenant on Economic, Social and Cultural Rights', 'ILO conventions and implementation in India'] },
    { name: 'Human rights under the Constitution and legislation', topics: ['Rights of women, children and vulnerable communities', 'Scheduled Castes, Scheduled Tribes and socially/economically backward communities', 'Prisoners, arrestees and compensatory jurisprudence', 'Directive principles and administrative implementation'] },
    { name: 'Enforcement machinery', topics: ['International and national commissions', 'Role of Supreme Court, High Courts and other courts', 'National Commissions for Women, Minorities, SCs and STs', 'Protection of Human Rights Act, 1993 and NGOs'] },
  ], commonReferences(['Universal Declaration of Human Rights', 'International Covenant on Civil and Political Rights', 'International Covenant on Economic, Social and Cultural Rights', 'Protection of Human Rights Act, 1993', 'Constitution of India (official text)'])),
  course(4, '213', 'Principles of Banking Laws', 'foundation', [
    { name: 'Origin and development of banking', topics: ['Evolution and meaning of bank', 'British banking development and Indian banking system', 'Public, nationalised, cooperative and multi-functional banks', 'Reserve Bank of India and central-bank functions'] },
    { name: 'Constitutional perspectives and regulation', topics: ['Constitutional entries relating to banking', 'Bankers Books Evidence Act', 'Banking Ombudsman and customer complaints', 'Banking Regulation Act: regulation, suspension and winding up'] },
    { name: 'Recovery of debt', topics: ['Recovery of Debts due to Banks and Financial Institutions Act', 'Amount of debt and initiation of proceedings', 'Debt Recovery Tribunal, jurisdiction and procedure', 'Recovery officers and appeals'] },
    { name: 'Securitisation and financial assets', topics: ['SARFAESI Act: objects and reasons', 'Enforcement of security interest', 'Secured creditors and borrower remedies', 'Issues arising under SARFAESI'] },
  ], commonReferences(['Reserve Bank of India Act, 1934', 'Banking Regulation Act, 1949', 'Bankers Books Evidence Act, 1891', 'Recovery of Debts and Bankruptcy Act, 1993', 'SARFAESI Act, 2002'])),
  course(4, '214', 'Legal Principles through Case Study', 'soft-skill', [
    { name: 'Constitutional and public-law principles', topics: ['Pro bono publico and public interest', 'Basic structure and constitutional review', 'Maintenance rights and Uniform Civil Code', 'Sexual-harassment guidelines and workplace protection'] },
    { name: 'Tort, environmental and medical principles', topics: ['Absolute and vicarious liability', 'Polluter pays, public trust and sustainable development', 'Medical negligence and standard of care', 'Remoteness of damage and contributory negligence'] },
    { name: 'Commercial and company principles', topics: ['Ultra vires and indoor management', 'Lifting the corporate veil', 'Majority rule and minority protection', 'Contract with minors and legal capacity'] },
    { name: 'Rights, procedure and public remedies', topics: ['Privacy as part of life and liberty', 'Collective bargaining and compulsory retirement', 'High Court power to quash criminal proceedings', 'Case-reading, issue extraction, ratio and application'] },
    { name: 'Prescribed case-study principles', topics: ['Pro bono publico: Bandhua Mukti Morcha v Union of India', 'Rule of prospective overruling: Golak Nath v State of Punjab', 'Basic structure: Kesavananda Bharati v State of Kerala', 'Maintenance and triple talaq: Shah Bano and related decisions', 'Uniform Civil Code: Sarla Mudgal v Union of India and related decisions', 'Workplace sexual harassment: Vishaka v State of Rajasthan', 'Absolute liability: M.C. Mehta oleum-gas principles', 'Medical negligence: Bolam and Jacob Mathew principles', 'Vicarious liability: State of Rajasthan v Vidhyawati', 'Polluter pays and public trust: M.C. Mehta and related decisions', 'Sustainable development and precautionary principle: Vellore Citizens Welfare Forum', 'Ultra vires: Ashbury Railway Carriage v Riche', 'Indoor management: Royal British Bank v Turquand', 'Majority rule: Foss v Harbottle', 'Contributory negligence: Donoghue v Stevenson', 'Res ipsa loquitur: Byrne v Boadle', 'Remoteness of damage: Scott v Shepherd and Re Polemis', 'Death sentence and rarest of rare cases: Bachan Singh', 'Contract with minors: Mohori Bibee v Dharmodas Ghose', 'Due process and personal liberty: Maneka Gandhi v Union of India', 'Privacy as a fundamental right: Justice K.S. Puttaswamy v Union of India', 'Collective bargaining: Dharam Dutta v Union of India', 'Compulsory retirement: State of Gujarat v Umedbhai M. Patel', 'High Court power to quash proceedings: Rupam Deol Bajaj and Bhajan Lal principles'] },
  ], commonReferences(['Official Supreme Court of India judgments', 'Official High Court judgments', 'Constitution of India and primary statutory sources']), { objectives: commonObjectives('ratio, legal principles and practical case analysis using public primary decisions') }),

  // Semester V
  course(5, '301', 'Civil Procedure Code and Limitation Act', 'core', [
    { name: 'Introduction, principles and jurisdiction', topics: ['Plaint, written statement, affidavit, order, judgment and decree', 'Restitution, execution, decree-holder, judgment-debtor and mesne profits', 'Judgment and decree distinction', 'Civil courts, hierarchy, suits, parties, res judicata and foreign judgments', 'Summons and alternative dispute resolution'] },
    { name: 'Trial procedure and suits', topics: ['Appearance, ex parte procedure, death, marriage and insolvency', 'Witnesses, adjournments, set-off, counterclaim and discovery', 'Interim orders, commissions, arrest and attachment', 'Special suits, execution, arrest, detention, attachment, sale and delivery'] },
    { name: 'Appeals, review, revision and miscellaneous', topics: ['Appeals from original decrees, appellate decrees and orders', 'Reference, review and revision', 'Transfer, restitution, caveat and inherent powers', 'Law Commission and civil-procedure amendments'] },
    { name: 'Limitation Act', topics: ['Object, limitation and vigilant rights', 'Acknowledgement, prescription, extension and exclusion', 'Government liability and continuing breaches', 'Disability, mistake, minority, foreign limitation and adverse possession'] },
  ], commonReferences(['Code of Civil Procedure, 1908', 'Limitation Act, 1963', 'Constitution of India, Articles 136, 226 and 227'])),
  course(5, '302', 'Bharatiya Nagarik Suraksha Sanhita, 2023', 'core', [
    { name: 'Object, courts, police and maintenance', topics: ['Objects, definitions and classification of offences', 'Constitution and powers of criminal courts and police', 'Arrest, search, seizure, forfeiture and electronic processes', 'Maintenance of wives, children and parents'] },
    { name: 'Public order, investigation and charge', topics: ['Public nuisance and maintenance of public order', 'Preventive action and investigation', 'Jurisdiction, inquiry, trial and complaints', 'Framing, alteration, joinder and plea bargaining'] },
    { name: 'Trial procedure', topics: ['Sessions, warrant, summons and summary trials', 'Discharge, acquittal, conviction and plea bargaining', 'Persons convicted or accused, bail and compounding', 'Evidence, victim compensation and witness protection'] },
    { name: 'Appeals, revision and bail', topics: ['Appeal kinds, permissions and appellate powers', 'Revision and reference', 'Execution, suspension, remission and commutation', 'Bail, bonds, High Court powers, electronic trials and repeal/savings'] },
  ], commonReferences(['Bharatiya Nagarik Suraksha Sanhita, 2023', 'Constitution of India (official text)', 'Official criminal-procedure rules and court materials'])),
  course(5, '303', 'Bharatiya Sakshya Adhiniyam, 2023', 'core', [
    { name: 'Facts, relevance and admissions', topics: ['Objects, applicability and comparison with the Evidence Act', 'Electronic and digital records', 'Proved, disproved, not proved, may presume and shall presume', 'Relevancy of facts, admissions and confessions'] },
    { name: 'Types of evidence', topics: ['Judicial notice and oral evidence', 'Documentary evidence and primary/secondary evidence', 'Electronic records, digital signatures and verification', 'Public/private documents and presumptions'] },
    { name: 'Dying declaration and witness examination', topics: ['Dying declaration and evidential value', 'Examination-in-chief, cross-examination and re-examination', 'Lawful questions, leading questions and hostile witnesses', 'Impeaching standing or credit of a witness'] },
    { name: 'Burden of proof and estoppel', topics: ['General and special burden of proof', 'Presumptions relating to offences and judicial notice', 'Estoppel, res judicata, waiver and kinds of estoppel', 'Corroboration and statutory presumptions'] },
  ], commonReferences(['Bharatiya Sakshya Adhiniyam, 2023', 'Official electronic-record and digital-signature guidance', 'Constitution of India (official text)'])),
  course(5, '304', 'Public Interest Lawyering', 'elective', [
    { name: 'Public interest lawyering', topics: ['Historical background, concept and meaning of PIL', 'Origin and development in India', 'Scope and matters where PIL cannot be filed', 'PIL as a social and constitutional tool and relaxation of locus standi'] },
    { name: 'Court powers in PIL', topics: ['High Court writ jurisdiction and constitutional provisions', 'Supreme Court powers under Articles 32 and 142', 'Gujarat High Court PIL procedure', 'Compensation and pre-filing precautions'] },
    { name: 'Advantages, disadvantages and limitations', topics: ['Access to justice for poor and illiterate persons', 'Prisoner rights, environmental protection and public accountability', 'Judicial overreach and executive implementation difficulty', 'Limits, misuse, delay and administrative constraints'] },
    { name: 'Judicial pronouncements and hypothetical problems', topics: ['Human rights, environment, fundamental rights and compensation', 'Polluter pays, public trust, precautionary and absolute-liability principles', 'Sustainable development', 'Issue spotting and hypothetical PIL problem preparation'] },
  ], commonReferences(['Constitution of India, Articles 32, 136, 226 and 142', 'Official Supreme Court of India PIL decisions', 'Gujarat High Court PIL Rules, 2010'])),
  course(5, '305', 'Intellectual Property Law', 'elective', [
    { name: 'Introduction to intellectual property', topics: ['Meaning and rationale of intellectual property', 'Copyright, trademarks, trade names, patents, designs and traditional knowledge', 'Plant varieties, geographical indications and international instruments', 'TRIPS, WIPO, UNESCO and Indian statutory framework'] },
    { name: 'Copyright law in India', topics: ['Evolution and meaning of copyright', 'Literary, artistic, dramatic, musical, sound-recording and cinematographic works', 'Computer programmes, databases, registration and ownership', 'Assignment, licensing, infringement, fair use and remedies'] },
    { name: 'Trademarks and industrial designs', topics: ['Rationale, definition and consumer/commercial function', 'Registration, distinctiveness, honest concurrent use and well-known marks', 'Passing off, infringement, proof, remedies and penalties', 'Industrial Designs Act and registration, powers, assignment and piracy'] },
    { name: 'Patent law', topics: ['Patent concept, essentials and Indian history', 'Patentable inventions, biotechnology and software', 'Application, examination, opposition, novelty and inventive step', 'Rights, duration, compulsory licences, revocation, infringement and remedies'] },
  ], commonReferences(['Copyright Act, 1957', 'Patents Act, 1970', 'Trade Marks Act, 1999', 'Designs Act, 2000', 'Geographical Indications of Goods (Registration and Protection) Act, 1999', 'Official Intellectual Property India materials'])),
  course(5, '306', 'Principles of Negotiable Instruments', 'foundation', [
    { name: 'Introduction', topics: ['Negotiable Instruments Act: objects and reasons', 'Types and characteristics of negotiable instruments', 'Promissory notes, bills of exchange, cheques and electronic cheques', 'Presumptions, drawer, payee, holder and holder in due course'] },
    { name: 'Terms and phenomena', topics: ['Ambiguous, inchoate and accommodation instruments', 'Acceptance and payment for honour', 'Notice of dishonour, maturity and days of grace', 'Endorsement, crossing, negotiation, noting and protest'] },
    { name: 'Dishonour and remedies', topics: ['Criminal remedy for dishonour of cheque', 'Drawer liability, absence of mens rea and statutory requirements', 'Stop payment, insufficient funds, account closure and post-dated cheques', 'Complaint, jurisdiction, limitation, compounding and defences'] },
    { name: 'Corporate and procedural liability', topics: ['Company and firm liability and responsible persons', 'Offences by companies and filing formalities', 'Delay and consequences under Section 138', 'Supreme Court approaches and case-based application'] },
  ], commonReferences(['Negotiable Instruments Act, 1881', 'Reserve Bank of India official cheque and payment-system guidance', 'Official Supreme Court decisions on cheque dishonour'])),
  course(5, '307', 'Rehabilitation of Criminals and Juveniles in Society and Law', 'soft-skill', [
    { name: 'Crime, punishment and rehabilitation', topics: ['Crime causation and socio-economic factors', 'Classical, positivist, differential-association and other theories', 'Retributive, deterrent, preventive, expiatory and reformative punishment', 'Community service and rehabilitation'] },
    { name: 'Constitutional and statutory rehabilitation', topics: ['Presidential, gubernatorial and judicial pardon', 'BNSS provisions on good behaviour, pardon and probation', 'Bharatiya Nyaya Sanhita provisions', 'Parole, furlough and Probation of Offenders Act'] },
    { name: 'Juvenile justice and care', topics: ['Juvenile Justice Act objects and definitions', 'Child in need of care and child in conflict with law', 'Juvenile Justice Board and Child Welfare Committee', 'Protection, employment, rehabilitation and social integration'] },
    { name: 'Society, institutions and reintegration', topics: ['Role of parents, society, government and NGOs', 'Probation officer powers and duties', 'Restorative and community-based support', 'Prevention of recidivism and reintegration planning'] },
  ], commonReferences(['Juvenile Justice (Care and Protection of Children) Act, 2015', 'Probation of Offenders Act, 1958', 'Bharatiya Nyaya Sanhita, 2023', 'Bharatiya Nagarik Suraksha Sanhita, 2023'])),

  // Semester VI
  course(6, '308', 'Drafting, Pleading and Conveyance', 'core', [
    { name: 'Drafting and pleadings', topics: ['General drafting principles and substantive rules', 'Notice, plaint, written statement and memorandum of appeal', 'Civil revision, interlocutory and execution applications', 'Writs, criminal complaint, bail, anticipatory bail, revisions and appeals'] },
    { name: 'Conveyancing principles', topics: ['Meaning, importance, deed roles and general principles', 'Agreement to sell, sale, mortgage, lease and rent deeds', 'Power of attorney, promissory note and gift deed', 'Will, codicil, indemnity bond, trust and partnership deed'] },
  ], commonReferences(['Code of Civil Procedure, 1908', 'Bharatiya Nagarik Suraksha Sanhita, 2023', 'Bharatiya Sakshya Adhiniyam, 2023', 'Transfer of Property Act, 1882', 'Registration Act, 1908', 'Negotiable Instruments Act, 1881']), { objectives: commonObjectives('practical drafting of pleadings, notices and conveyancing instruments'), maxMarks: 100 }),
  course(6, '309', 'Professional Ethics and Professional Accounting System', 'core', [
    { name: 'Legal profession and ethics', topics: ['Business and profession distinction', 'History, importance and role of the legal profession', 'Ethics, professional conduct and Seven Lamps of Advocacy', 'Hoffman resolutions, lawyer duties and Bench-Bar relations'] },
    { name: 'Advocates Act and Bar Councils', topics: ['Admission, enrolment, rights and privileges of advocates', 'Duties towards client, court, judge and colleagues', 'State Bar Councils, committees and functions', 'Bar Council of India and dress code'] },
    { name: 'Professional misconduct and contempt', topics: ['Professional misconduct and disciplinary procedure', 'Accountancy for lawyers', 'Contempt of Courts Act: civil and criminal contempt', 'Defences, remedies, jurisdiction and penalties'] },
    { name: 'Cases and disciplinary opinions', topics: ['Important Supreme Court cases on professional misconduct', 'Selected disciplinary committee opinions', 'Contempt decisions and professional accountability', 'Digital legal research and authenticated law reports'] },
  ], commonReferences(['Advocates Act, 1961', 'Contempt of Courts Act, 1971', 'Bar Council of India Rules and Code of Ethics', 'Official Bar Council and Supreme Court materials']), { objectives: commonObjectives('ethical legal practice, professional duties, discipline and lawyer accounting'), maxMarks: 100 }),
  course(6, '310', 'Alternative Dispute Resolution', 'core', [
    { name: 'Alternative dispute resolution', topics: ['Meaning, objectives and importance', 'Arbitration, conciliation, mediation and distinctions', 'Arbitration agreement, essentials, kinds, capacity and validity', 'Tribunal appointment, challenge, procedure, jurisdiction and powers'] },
    { name: 'Arbitration award', topics: ['Rules of guidance and form/content of awards', 'Settlement through ADR and interim awards', 'Interest, correction and interpretation', 'Setting aside: incapacity, invalid agreement, notice, procedure, bias, limitation and consent'] },
    { name: 'Foreign awards and conciliation', topics: ['Foreign and international commercial arbitration', 'New York and Geneva Convention awards', 'Conciliation appointment, procedure, settlement and termination', 'Appeals, revision and High Court/Central Government rule-making'] },
    { name: 'Mediation Act, 2023 and practical exercises', topics: ['Mediation agreement and pre-litigation mediation', 'Mediators, mediated settlement and enforcement', 'Mediation Council and service providers', 'Community mediation, negotiation and conciliation exercises'] },
  ], commonReferences(['Arbitration and Conciliation Act, 1996', 'Mediation Act, 2023', 'Code of Civil Procedure, 1908, Section 89', 'Official Supreme Court mediation and arbitration materials']), { objectives: commonObjectives('arbitration, conciliation, mediation and practical dispute-resolution skills'), maxMarks: 100 }),
  course(6, '311', 'Moot Court Exercise and Internship', 'core', [
    { name: 'Moot court', topics: ['Three exercises and arguments', 'Problem analysis, research and authorities', 'Written submissions and memorial structure', 'Oral advocacy, presentation and evaluation'] },
    { name: 'Observation of civil and criminal trials', topics: ['Attendance at one civil and one criminal trial', 'Courtroom record, procedure and diary maintenance', 'Evidence, submissions and trial stages', 'Certification and reflective observation'] },
    { name: 'Client interviewing and pre-trial preparation', topics: ['Interviewing techniques and professional confidentiality', 'Fact gathering and issue identification', 'Pre-trial preparation and document/case papers', 'Filing preparation and practical diary'] },
    { name: 'Viva voce and internship record', topics: ['Practical work evaluation', 'Internship learning outcomes', 'Professional conduct during placement', 'Viva voce examination'] },
  ], commonReferences(['Bar Council of India Rules of Legal Education, 2008', 'Code of Civil Procedure, 1908', 'Bharatiya Nagarik Suraksha Sanhita, 2023', 'Official court procedure materials']), { objectives: commonObjectives('oral advocacy, trial observation, client interviewing and supervised clinical practice'), maxMarks: 100 }),
  course(6, '312', 'Legal Language and Legal Writing including General English', 'core', [
    { name: 'Essay on topics relating to law', topics: ['Essay structure and argument', 'Selecting and explaining a law-related topic', 'Using primary legal sources without copying protected text'] },
    { name: 'Legal phrases', topics: ['Meaning and use of legal phrases', 'Legal terminology in sentences', 'Clear professional legal expression'] },
    { name: 'Comprehension or précis writing', topics: ['Reading legal prose', 'Identifying issues, rules and conclusions', 'Writing a concise and accurate précis'] },
    { name: 'Translation', topics: ['Translation of legal ideas between languages', 'Preserving meaning and legal terminology', 'Accuracy, clarity and responsible use of source material'] },
    { name: 'Practical legal problems', topics: ['Problems relating to criminal law', 'Problems relating to tort law', 'Problems relating to contract law', 'Problems relating to family law'] },
  ], commonReferences(['Official Constitution and statutory texts', 'Official court judgments for legal-language practice']), { objectives: commonObjectives('clear legal English, comprehension, translation and applied legal writing'), maxMarks: 100 }),
  course(6, '313', 'Forensic Science, Law and Crime Detection Methods', 'foundation', [
    { name: 'Forensic science in crime detection', topics: ['History, scope, need and application', 'Modus operandi and investigation', 'Evidence collection, expert reports and evidential value', 'Alcohol, toxicology, ballistics, blood, handwriting, narcotics and fingerprints'] },
    { name: 'Forensic psychology and law', topics: ['Techniques and significance', 'Lie detection, polygraph, brain mapping, narco-analysis and hypnosis', 'Constitutional validity, self-incrimination and Article 20(3)', 'Drawbacks, hazards and evidential acceptance'] },
    { name: 'Modern forensic techniques', topics: ['Cybercrime and recovery of computer/mobile data', 'Email, website, electronic-fund transfer and digital piracy investigation', 'Facial reconstruction, skull superimposition and voice identification', 'DNA profiling, paternity and evidentiary standards'] },
    { name: 'Future challenges', topics: ['Forensic science and global terrorism', 'Cyber and other technological offences', 'Chain of custody and expert reliability', 'Rights-respecting and scientifically valid investigation'] },
  ], commonReferences(['Bharatiya Sakshya Adhiniyam, 2023', 'Bharatiya Nagarik Suraksha Sanhita, 2023', 'Information Technology Act, 2000', 'Official forensic and digital-evidence guidance']), { objectives: commonObjectives('forensic technologies, lawful crime detection, evidence and constitutional safeguards') }),
  course(6, '314', 'Legal Aid, Para-Legal Services and Clinical Training', 'soft-skill', [
    { name: 'Constitutional and procedural legal aid', topics: ['Free legal aid, equality and access to justice', 'Articles 14, 21 and 39-A', 'BNSS legal aid at State expense', 'Civil-procedure assistance for indigent persons'] },
    { name: 'Legal Services Authorities Act, 1987', topics: ['Objects, authorities, terms and functions', 'National, State and District Legal Services Authorities', 'Committees, eligibility and entitlement', 'Funds, Lok Adalats, Permanent Lok Adalats and awards'] },
    { name: 'Pre-litigation and alternative services', topics: ['Pre-litigation conciliation and settlement', 'Powers and procedure of Permanent Lok Adalats', 'Rule-making powers and regulation', 'Community-level dispute resolution'] },
    { name: 'Para-legal services and clinical training', topics: ['Legal literacy camps and public awareness', 'Legal aid camps for weaker sections, women and children', 'Legal aid clinics, counselling and pre-litigation support', 'NGOs, law students and para-legal training'] },
  ], commonReferences(['Legal Services Authorities Act, 1987', 'Constitution of India, Articles 14, 21 and 39-A', 'Bharatiya Nagarik Suraksha Sanhita, 2023', 'Official NALSA and Gujarat State Legal Services Authority materials']), { objectives: commonObjectives('access to justice, legal-aid institutions, para-legal work and clinical legal training') }),
];

export interface StructuredSyllabusRecord {
  syllabusKey: string;
  university: string;
  programme: string;
  academicYear: string;
  semester: number;
  subject: string;
  subjectCode: string;
  courseCategory: StructuredCourseCategory;
  lectureHoursPerWeek: number;
  otherHoursPerWeek: number;
  weeklyHours: number;
  credits: number;
  maxMarks: number;
  description: string;
  objectives: string[];
  outcomes: string[];
  topics: Array<{
    topicKey: string;
    sourceId: string;
    parentTopicKey?: string;
    name: string;
    order: number;
    kind: 'unit' | 'topic';
    description: string;
    estimatedHours: number;
    keyTerms: string[];
    relatedSections: string[];
  }>;
  references: string[];
  contentPolicy: string;
  assessmentPattern: { endSemesterExam: number; internalAssessment: number; totalMarks: number; components: Array<{ name: string; marks: number }> };
}

const assessmentComponentsByCode: Record<string, Array<{ name: string; marks: number }>> = {
  '203': [{ name: 'Income Tax Act, 2025', marks: 50 }, { name: 'Intra-State GST', marks: 40 }, { name: 'Integrated GST', marks: 10 }],
  '301': [{ name: 'Civil Procedure Code', marks: 80 }, { name: 'Limitation Act', marks: 20 }],
  '308': [{ name: 'Theoretical examination', marks: 90 }, { name: 'Viva voce', marks: 10 }],
  '309': [{ name: 'Theoretical examination', marks: 80 }, { name: 'Viva voce', marks: 20 }],
  '310': [{ name: 'Theoretical examination', marks: 80 }, { name: 'Practical exercises', marks: 20 }],
  '311': [{ name: 'Moot court: three exercises and arguments', marks: 30 }, { name: 'Observation of one civil and one criminal trial', marks: 30 }, { name: 'Client interviewing and pre-trial preparation', marks: 30 }, { name: 'Viva voce', marks: 10 }],
};

export const structuredSyllabi: StructuredSyllabusRecord[] = structuredCourseDefinitions.map((definition) => {
  const codeKey = definition.code.toLowerCase();
  const topics = definition.units.flatMap((unit, unitIndex) => {
    const unitKey = `${codeKey}.u${unitIndex + 1}`;
    const unitTopic = {
      topicKey: unitKey,
      sourceId: `unit-${unitIndex + 1}`,
      name: unit.name,
      order: unitIndex + 1,
      kind: 'unit' as const,
      description: `Unit ${unitIndex + 1} of ${definition.title}.`,
      estimatedHours: definition.lectureHoursPerWeek * 4,
      keyTerms: [],
      relatedSections: [],
    };
    const childTopics = unit.topics.map((name, topicIndex) => ({
      topicKey: `${unitKey}.t${topicIndex + 1}`,
      sourceId: `${unitIndex + 1}.${topicIndex + 1}`,
      parentTopicKey: unitKey,
      name,
      order: topicIndex + 1,
      kind: 'topic' as const,
      description: `Subtopic of ${unit.name}.`,
      estimatedHours: Math.max(1, Math.ceil((definition.lectureHoursPerWeek * 4) / Math.max(unit.topics.length, 1))),
      keyTerms: [],
      relatedSections: [],
    }));
    return [unitTopic, ...childTopics];
  });

  return {
    syllabusKey: `gujarat-university:three-years-llb:2026-27:${definition.semester}:${codeKey}`,
    university: 'Gujarat University',
    programme: 'Three Years LL.B. Programme with Credit Based System',
    academicYear: '2026-27',
    semester: definition.semester,
    subject: definition.title,
    subjectCode: `${definition.code}${definition.category === 'foundation' ? ' F' : definition.category === 'elective' ? ' E' : definition.category === 'soft-skill' ? ' K' : ''}`,
    courseCategory: definition.category,
    lectureHoursPerWeek: definition.lectureHoursPerWeek,
    otherHoursPerWeek: definition.otherHoursPerWeek,
    weeklyHours: definition.lectureHoursPerWeek + definition.otherHoursPerWeek,
    credits: definition.credits,
    maxMarks: definition.maxMarks,
    description: `Structured course outline for ${definition.title}, Gujarat University Three Years LL.B. Programme, Semester ${definition.semester}.`,
    objectives: definition.objectives || commonObjectives(definition.title),
    outcomes: [
      'Identify the principal concepts, legal sources and terminology covered by the course.',
      'Read and apply relevant primary legal materials to a structured legal problem.',
      'Communicate legal reasoning clearly while respecting professional and academic integrity.',
    ],
    topics,
    references: definition.references,
    contentPolicy: 'outline-and-metadata-only; no copyrighted textbook or case-report content is stored',
    assessmentPattern: {
      endSemesterExam: definition.maxMarks,
      internalAssessment: 0,
      totalMarks: definition.maxMarks,
      components: assessmentComponentsByCode[definition.code] || [{ name: 'University assessment', marks: definition.maxMarks }],
    },
  };
});
