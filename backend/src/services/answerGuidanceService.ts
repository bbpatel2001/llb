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
    const marks = question.marks || this.getGuidanceMarks(answerType);
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
    const knownAnswer = this.buildKnownAnswer(question, language);
    if (knownAnswer) return this.expandKnownAnswer(knownAnswer, question, language);
    if (language === 'gu') {
      return this.buildGujaratiAnswer(question, answerType);
    }

    const references = this.getLegalReferences(question);
    return this.buildModelAnswer(
      question,
      answerType,
      this.getQuestionFocus(question.questionText),
      references,
      this.getMarkPlan(question.marks || this.getGuidanceMarks(answerType))
    );
  }

  private static buildKnownAnswer(question: IQuestion, language: AnswerLanguage): string | undefined {
    const text = question.questionText.toLowerCase().replace(/\s+/g, ' ');
    const gu = language === 'gu';
    if (/cabinet mission.*mountbatten|mountbatten.*cabinet mission/.test(text)) {
      if (gu) return `પ્રશ્ન: કેબિનેટ મિશન અને માઉન્ટબેટન યોજનાના મુખ્ય હેતુઓ અને ઉદ્દેશો\n\nપરિચય\n1946થી 1947નો સમય ભારતના બંધારણીય ઇતિહાસમાં સત્તા હસ્તાંતરણનો નિર્ણાયક તબક્કો હતો. બ્રિટિશ સરકારનો હેતુ ભારત માટે એવી બંધારણીય વ્યવસ્થા શોધવાનો હતો જે એક તરફ ભારતીય સ્વરાજ્યની માંગને સ્વીકારી શકે અને બીજી તરફ કોંગ્રેસ અને મુસ્લિમ લીગ વચ્ચેના મતભેદોને સંભાળી શકે. આ સંદર્ભમાં કેબિનેટ મિશન યોજના, 1946 અને લોર્ડ માઉન્ટબેટનની 3 જૂન યોજના, 1947 અલગ અલગ તબક્કાની યોજનાઓ હતી.\n\nકેબિનેટ મિશનના મુખ્ય હેતુઓ\nબ્રિટિશ સરકારે લોર્ડ પેથિક-લોરન્સ, સર સ્ટેફર્ડ ક્રિપ્સ અને એ.વી. એલેક્ઝાન્ડરને ભારત મોકલ્યા. 16 મે 1946ની યોજનાનો મુખ્ય હેતુ ભારતને તરત વિભાજિત કર્યા વિના સત્તા ભારતીયોને આપવાનો હતો. યોજનાએ મર્યાદિત વિષયો—રક્ષા, વિદેશી બાબતો અને સંચાર—માટે કેન્દ્રમાં ભારતીય સંઘની કલ્પના કરી. બાકીની સત્તાઓ પ્રાંતો પાસે રહેવાની હતી.\n\nયોજનાએ પ્રાંતોને ત્રણ જૂથોમાં ગોઠવવાની અને દરેક જૂથને પોતાના બંધારણીય વિષયો અંગે વિચારવાની વ્યવસ્થા સૂચવી. બંધારણસભા રચવાની અને તેના દ્વારા ભારતનું બંધારણ ઘડવાની જોગવાઈ પણ હતી. દેશી રજવાડાંઓને પણ સંઘીય બંધારણ પ્રક્રિયામાં જોડવાનો હેતુ હતો. આમ, મુખ્ય ઉદ્દેશ એકતા જાળવીને પ્રાંતીય સ્વાયત્તતા અને મુસ્લિમ લીગની જૂથબંધીની માંગ વચ્ચે સમાધાન કરાવવાનો હતો.\n\nકેબિનેટ મિશન યોજનાની મર્યાદા\nયોજનામાં કેન્દ્ર નબળું અને પ્રાંતીય જૂથો શક્તિશાળી હોવાથી તેની વ્યાખ્યા અંગે કોંગ્રેસ અને મુસ્લિમ લીગ વચ્ચે મતભેદ રહ્યા. કોંગ્રેસ મજબૂત રાષ્ટ્રીય એકતા ઇચ્છતી હતી, જ્યારે મુસ્લિમ લીગ જૂથબંધીને પાકિસ્તાન તરફના પગથિયા તરીકે જોતી હતી. તેથી યોજના સંપૂર્ણ રાજકીય સંમતિ મેળવી શકી નહીં.\n\nમાઉન્ટબેટન અથવા 3 જૂન યોજના\nલોર્ડ માઉન્ટબેટન માર્ચ 1947માં વાઇસરોય બન્યા. તેમણે સમજ્યું કે સંયુક્ત ભારત અંગે સમજૂતી શક્ય નથી અને વધતી હિંસા તથા વહીવટી અસ્થિરતા વચ્ચે વહેલી સત્તા સોંપવી જરૂરી છે. 3 જૂન 1947ની યોજનાનો મુખ્ય હેતુ ભારતનું વિભાજન સ્વીકારીને સત્તા હસ્તાંતરણની સ્પષ્ટ અને સમયબદ્ધ પદ્ધતિ નક્કી કરવાનો હતો. પંજાબ અને બંગાળના વિભાજન અંગે સંબંધિત સભ્યોની સંમતિ લેવાની, ઉત્તર-પશ્ચિમ સરહદ પ્રાંતમાં જનમત લેવાની અને સિલહટ અંગે નિર્ણય કરવાની પ્રક્રિયા નક્કી થઈ.\n\nયોજનાનું કાનૂની પરિણામ\nમાઉન્ટબેટન યોજનાના આધારે Indian Independence Act, 1947 પસાર થયો. આ અધિનિયમે 15 ઓગસ્ટ 1947થી ભારત અને પાકિસ્તાન નામના બે ડોમિનિયન સ્થાપ્યા, બ્રિટિશ સત્તાનો અંત કર્યો અને બંને નવા રાજ્યોને પોતાની બંધારણીય વ્યવસ્થા ઘડવાની સત્તા આપી.\n\nતુલના અને નિષ્કર્ષ\nકેબિનેટ મિશનનો હેતુ સંઘીય માળખા દ્વારા એકતા બચાવવાનો હતો; માઉન્ટબેટન યોજનાનો હેતુ વિભાજન સ્વીકારીને ઝડપી અને વ્યવસ્થિત સત્તા હસ્તાંતરણ કરવાનો હતો. પહેલી યોજના સમાધાન અને સંયુક્ત બંધારણસભા પર આધારિત હતી, જ્યારે બીજી યોજના બે ડોમિનિયનના સર્જન અને Indian Independence Act દ્વારા અમલ પર આધારિત હતી.`;
      return `Question: Main aims and objectives of the Cabinet Mission and Mountbatten Plan\n\nIntroduction\nThe years 1946–47 were the decisive stage in the transfer of constitutional power in India. The British Government had to respond to the demand for independence while dealing with the deep disagreement between the Indian National Congress and the Muslim League. The Cabinet Mission Plan of 1946 and Lord Mountbatten’s 3 June Plan of 1947 were therefore two different stages of the same constitutional transition.\n\nCabinet Mission Plan, 1946\nThe British Cabinet sent Lord Pethick-Lawrence, Sir Stafford Cripps and A.V. Alexander to India. The main object of the Statement of 16 May 1946 was to transfer power to Indian hands without immediately partitioning the country. It proposed a Union dealing with only three subjects—defence, foreign affairs and communications—with residuary powers remaining with the provinces.\n\nThe Plan proposed provincial groupings and a Constituent Assembly to frame the Constitution. The groups could consider common subjects, while provinces retained substantial autonomy. The States were also expected to participate in the constitution-making process. The central aim was a compromise: preserve the unity of India through a limited Union while meeting the Muslim League’s demand for safeguards through provincial grouping.\n\nThe Plan failed to secure lasting agreement. Congress preferred a strong national unity and did not accept compulsory grouping in the form asserted by the League. The League regarded grouping as essential to protect Muslim-majority areas and ultimately as a step towards Pakistan. The disagreement over the interpretation and operation of the Plan weakened the proposed constitutional settlement.\n\nMountbatten or 3 June Plan, 1947\nLord Mountbatten became Viceroy in March 1947. Continuing communal violence and administrative breakdown convinced him that an early transfer of power was necessary. The 3 June Plan accepted partition as the practical method of resolving the constitutional deadlock. It provided for separate decisions by the representatives of Punjab and Bengal on partition, a referendum in the North-West Frontier Province, and a decision concerning Sylhet.\n\nThe legal implementation\nThe Plan was implemented through the Indian Independence Act, 1947. From 15 August 1947 the Act created the two Dominions of India and Pakistan, ended the authority of the British Crown over India, and enabled the new Dominions to make their own constitutional arrangements. It converted the political plan into a legal transfer of sovereignty.\n\nComparison and conclusion\nThe Cabinet Mission sought to preserve Indian unity through a weak Union, provincial groups and a Constituent Assembly. The Mountbatten Plan accepted partition and sought a rapid, definite and legally enforceable transfer of power. The former was a compromise designed to avoid partition; the latter was a settlement designed to implement independence despite the failure of that compromise.`;
    }
    if (/cripps mi+ssion/.test(text)) {
      if (gu) return `ક્રિપ્સ મિશન, 1942\n\nપરિચય\nબીજા વિશ્વયુદ્ધ દરમિયાન બ્રિટિશ સરકારને ભારતનો રાજકીય સહકાર જરૂરી હતો. આ હેતુથી સર સ્ટેફર્ડ ક્રિપ્સને 1942માં ભારત મોકલવામાં આવ્યા. મિશનનો હેતુ યુદ્ધ પછી ભારત માટે બંધારણીય ઉકેલ રજૂ કરવો અને ભારતીય નેતાઓનો યુદ્ધપ્રયત્નમાં સહકાર મેળવવો હતો.\n\nમુખ્ય પ્રસ્તાવો\nક્રિપ્સ પ્રસ્તાવમાં યુદ્ધ પછી ભારતને ડોમિનિયન સ્ટેટસ આપવાની વાત હતી. નવી બંધારણસભા દ્વારા ભારતનું બંધારણ ઘડવાનું અને પ્રાંતોને સંઘમાં જોડાવા કે અલગ રહેવા અંગે વિકલ્પ આપવાનો વિચાર હતો. દેશી રજવાડાંઓને પણ બંધારણ રચનામાં જોડાવાની તક આપવાની હતી. વચગાળામાં રક્ષા વિભાગ બ્રિટિશ નિયંત્રણ હેઠળ રહેવાનો હોવાથી ભારતીય નેતાઓને સંપૂર્ણ જવાબદાર સરકાર મળતી નહોતી.\n\nમૂલ્યાંકન\nકોંગ્રેસને તાત્કાલિક સત્તા અને વાસ્તવિક જવાબદાર સરકાર ન મળતાં પ્રસ્તાવ અસંતોષકારક લાગ્યો. મુસ્લિમ લીગને અલગ રાજ્યની સ્પષ્ટ ખાતરી ન હોવાથી તેણે પણ સ્વીકાર કર્યો નહીં. તેથી ક્રિપ્સ મિશન નિષ્ફળ ગયું, પરંતુ તેના પ્રસ્તાવોએ યુદ્ધ પછીની બંધારણ રચના અને ડોમિનિયન સ્ટેટસ અંગેની ચર્ચાને આગળ ધપાવી.`;
      return `Cripps Mission, 1942\n\nDuring the Second World War the British Government needed Indian political support. Sir Stafford Cripps was therefore sent to India in 1942. The mission sought cooperation in the war effort and attempted to offer a constitutional settlement for the period after the war.\n\nThe proposals promised Dominion Status after the war and contemplated a constitution-making body for framing India’s Constitution. Provinces were given an option concerning participation in the proposed Union, and the Indian States were to be associated with constitution-making. In the interim, however, defence remained under British control and India did not receive an immediately responsible national government.\n\nCongress considered the offer inadequate because it did not provide immediate transfer of power. The Muslim League also rejected it because it did not clearly guarantee Pakistan. The Mission consequently failed, though it advanced the discussion about post-war constitution-making and Dominion Status.`;
    }
    if (/final.*draft|adoption of the constitution/.test(text)) {
      if (gu) return `ભારતના બંધારણનો અંતિમ ડ્રાફ્ટ અને સ્વીકારની પ્રક્રિયા\n\nબંધારણસભાએ ભારત માટે લોકશાહી, પ્રજાસત્તાક અને અધિકાર આધારિત બંધારણ ઘડવાનું કાર્ય હાથ ધર્યું. વિવિધ સમિતિઓએ અહેવાલો તૈયાર કર્યા અને ડૉ. બી. આર. આંબેડકરની અધ્યક્ષતાવાળી ડ્રાફ્ટિંગ કમિટીએ તે સામગ્રીને કાનૂની ભાષામાં ગોઠવી. ડ્રાફ્ટ બંધારણ સભ્યો સમક્ષ મૂકવામાં આવ્યું અને તેના પર કલમવાર ચર્ચા થઈ.\n\nસભ્યોને સુધારા રજૂ કરવાની તક આપવામાં આવી. દરેક મહત્વપૂર્ણ જોગવાઈ પર ચર્ચા, વિરોધ, સ્પષ્ટીકરણ અને મતદાન થયું. આ પ્રક્રિયામાં સંઘીય માળખું, સંસદીય સરકાર, મૂળભૂત અધિકારો, રાજ્યના નીતિનિર્દેશક તત્ત્વો, સ્વતંત્ર ન્યાયતંત્ર અને લઘુમતી સુરક્ષા અંગે સમાધાન રચાયું. અંતિમ લખાણ માત્ર ડ્રાફ્ટિંગ કમિટીનું નહીં પરંતુ બંધારણસભાની ચર્ચા અને સ્વીકારનું પરિણામ હતું.\n\n26 નવેમ્બર 1949ના રોજ બંધારણસભાએ બંધારણ સ્વીકાર્યું, અધિનિયમિત કર્યું અને પોતાને અર્પણ કર્યું. કેટલીક જોગવાઈઓ તરત અમલમાં આવી અને Article 394 મુજબ બાકીની જોગવાઈઓ 26 જાન્યુઆરી 1950થી અમલમાં આવી. 26 જાન્યુઆરીની પસંદગી પૂર્ણ સ્વરાજ્યના ઐતિહાસિક સંકલ્પ સાથે જોડાયેલી હતી. આમ, અંતિમ ડ્રાફ્ટથી બંધારણના સ્વીકાર સુધીની પ્રક્રિયા ચર્ચા, સુધારા, સંમતિ અને ઔપચારિક સ્વીકારના તબક્કામાં પૂર્ણ થઈ.`;
      return `Final Draft and Adoption of the Constitution of India\n\nThe Constituent Assembly undertook the task of framing a democratic, republican and rights-based Constitution for India. Reports prepared by the Assembly’s committees were placed before the Drafting Committee, chaired by Dr B.R. Ambedkar, which organised the principles into a legally coherent draft. The Draft Constitution was then placed before the Assembly for consideration.\n\nThe Assembly followed a deliberative procedure. Members proposed amendments and debated provisions clause by clause. The discussions covered the federal structure, parliamentary government, Fundamental Rights, Directive Principles, an independent judiciary, safeguards for minorities and the distribution of legislative and executive powers. The final text was therefore the product of committee work, public constitutional reasoning, amendments and decisions of the Assembly; it was not merely an administrative document prepared by the Drafting Committee.\n\nOn 26 November 1949 the Constituent Assembly adopted, enacted and gave to themselves the Constitution. Article 394 provided for the commencement of specified provisions immediately and the commencement of the remaining provisions on 26 January 1950. That date also carried the historical significance of the earlier complete-independence resolution. The procedure thus moved from committee reports and a draft, through clause-by-clause debate and amendment, to formal adoption and commencement as the supreme law of India.`;
    }
    if (/federal court|rajgopalachari/.test(text)) {
      if (gu) return `ફેડરલ કોર્ટ અને રાજગોપાલાચારી યોજના\n\nફેડરલ કોર્ટ\nGovernment of India Act, 1935 હેઠળ ફેડરલ કોર્ટની સ્થાપના 1937માં થઈ. તેનું મુખ્ય કાર્ય સંઘ અને પ્રાંતો વચ્ચેના બંધારણીય વિવાદોનો નિકાલ કરવો, અપીલીય અધિકારક્ષેત્રમાં નિર્ણયો આપવો અને કાયદાની વ્યાખ્યા કરવી હતું. પ્રિવી કાઉન્સિલ અંતિમ અપીલનું મંચ રહી, તેથી ફેડરલ કોર્ટ સંપૂર્ણ સર્વોચ્ચ અદાલત નહોતી. છતાં તેણે ભારતમાં સંઘીય ન્યાયિક વ્યવસ્થાનો પાયો નાખ્યો અને પછીની સુપ્રીમ કોર્ટ માટે સંસ્થાકીય આધાર આપ્યો.\n\nરાજગોપાલાચારી યોજના\nસી. રાજગોપાલાચારીની 1944ની યોજના કોંગ્રેસ અને મુસ્લિમ લીગ વચ્ચે સમાધાનનો પ્રયાસ હતી. તેમાં મુસ્લિમ બહુમતીવાળા સતત જિલ્લાઓમાં યુદ્ધ પછી જનમત દ્વારા અલગ થવાનો પ્રશ્ન નક્કી કરવાનો વિચાર હતો. લીગને સ્વનિર્ણયનો માર્ગ આપવાની સામે, બંને પક્ષોએ સ્વતંત્રતા અને રક્ષણ, વેપાર તથા સંચાર જેવા સામાન્ય હિતના વિષયો અંગે કરાર કરવાનો વિચાર હતો. જિન્નાહે યોજનાને સ્વીકારી નહીં, પરંતુ તે પાકિસ્તાનની માંગ અને ભારતીય એકતા વચ્ચે સમાધાન શોધવાનો મહત્વપૂર્ણ પ્રયાસ હતો.`;
      return `Federal Court and Rajagopalachari Formula\n\nThe Federal Court of India was established in 1937 under the Government of India Act, 1935. Its principal functions were to decide constitutional disputes between the Federation and the Provinces, exercise the appellate jurisdiction provided by the Act, and interpret the constitutional distribution of powers. The Privy Council still remained the final appellate authority, so the Federal Court was not a completely supreme court. Nevertheless, it laid the institutional foundation for federal judicial review and influenced the later development of the Supreme Court of India.\n\nThe C. Rajagopalachari Formula of 1944 was a political attempt to bridge the dispute between the Congress and the Muslim League. It contemplated a post-war plebiscite in contiguous Muslim-majority areas to determine whether they wished to separate, together with an agreement on defence, commerce and communications. The formula attempted to recognise the demand for self-determination while securing independence and common arrangements. It was not accepted by Jinnah, but it remains significant as an effort to find a negotiated constitutional solution between Indian unity and the demand for Pakistan.`;
    }
    if (/agency|caveat emptor|conditions? and warranties?/.test(text)) {
      if (gu) return `એજન્સી, Caveat Emptor તથા Conditions અને Warranties\n\nએજન્સીનો અર્થ અને તત્ત્વો\nIndian Contract Act, 1872ની કલમ 182 મુજબ એજન્ટ તે વ્યક્તિ છે જે બીજા માટે કોઈ કાર્ય કરે અથવા ત્રીજા વ્યક્તિ સાથે વ્યવહારમાં તેનું પ્રતિનિધિત્વ કરે; જેના માટે કાર્ય થાય તે principal કહેવાય છે. એજન્સી બનાવવા માટે principal અને agent વચ્ચે સંમતિ, agentની પ્રતિનિધિત્વ કરવાની સત્તા અને કાનૂની સંબંધ બનાવવાનો હેતુ જરૂરી છે. એજન્સી માટે consideration અનિવાર્ય નથી. એજન્ટે principalની સૂચનાઓનું પાલન, યોગ્ય કાળજી, હિસાબ અને વફાદારી રાખવી જોઈએ.\n\nપક્ષકારોના સંબંધમાં agent દ્વારા સત્તાની મર્યાદામાં કરાયેલ કરાર principalને બાંધે છે. ત્રીજા પક્ષને agentની ઓળખ અથવા અધિકાર અંગે યોગ્ય માહિતી મળે ત્યારે પ્રતિનિધિત્વના નિયમો લાગુ પડે છે. agentને ગુપ્ત નફો કરવો અથવા principalના હિત વિરુદ્ધ કામ કરવું મંજૂર નથી.\n\nપક્ષકારોના કાર્યથી સમાપ્તિ\nકલમ 201 મુજબ principal સત્તા પાછી ખેંચે, agent રાજીનામું આપે, કાર્ય પૂર્ણ થાય, principal અથવા agentનું અવસાન કે દિવાની અસમર્થતા થાય, અથવા principalને નાદાર જાહેર કરવામાં આવે ત્યારે એજન્સી સમાપ્ત થઈ શકે છે. જો એજન્સીમાં agentનો પોતાનો હિત હોય તો principal સામાન્ય રીતે તે હિતને નુકસાન થાય તે રીતે સત્તા પાછી ખેંચી શકતો નથી. ત્રીજા પક્ષને આપવામાં આવેલી પૂર્વ જાણ અને agent દ્વારા કરાયેલા વ્યવહારોના હિતોનું રક્ષણ પણ મહત્વનું છે.\n\nCaveat Emptor\nCaveat emptorનો અર્થ “buyer beware” એટલે કે ખરીદદાર સાવચેત રહે. Sale of Goods Act, 1930ના સામાન્ય નિયમ મુજબ ખરીદદાર માલની ગુણવત્તા અને યોગ્યતા પોતે તપાસે છે અને પોતાની પસંદગીના માલ અંગે પછી ફરિયાદ કરી શકતો નથી. પરંતુ વેચનારને માલનો હેતુ જણાવવામાં આવ્યો હોય અને ખરીદદાર વેચનારની કુશળતા પર વિશ્વાસ રાખે, વેપારી ગુણવત્તા જરૂરી હોય, વર્ણન અથવા નમૂના સાથે માલ મેળ ખાતો ન હોય, અથવા વેચનાર છેતરપિંડી કરે, તો કાયદો ખરીદદારને રક્ષણ આપે છે. તેથી નિયમ સંપૂર્ણ નથી; તેની પાછળ caveat venditor અને implied conditions જેવા અપવાદો કાર્ય કરે છે.\n\nConditions અને Warranties\nCondition કરારના મુખ્ય હેતુ સાથે જોડાયેલી આવશ્યક શરત છે. તેના ભંગથી ખરીદદાર કરાર નકારી શકે અને નુકસાનની માંગ કરી શકે. Warranty ગૌણ શરત છે; તેના ભંગથી કરાર રદ કરવાનો અધિકાર સામાન્ય રીતે મળતો નથી, પરંતુ નુકસાન મળી શકે છે. ક્યારેક ખરીદદાર conditionના ભંગને warranty તરીકે સ્વીકારી શકે છે. માલ વેચાણમાં શરતનું સ્વરૂપ પક્ષકારોની ભાષા, કરારનો હેતુ અને કાયદાની જોગવાઈથી નક્કી થાય છે.`;
      return `Agency, Caveat Emptor, Conditions and Warranties\n\nAgency: meaning and essentials\nSection 182 of the Indian Contract Act, 1872 describes an agent as a person employed to do an act for another or to represent another in dealings with third persons; the person for whom the act is done is the principal. Agency requires consent, authority to represent, and an intention to create a legal relationship. Consideration is not essential for the creation of an agency. The agent must follow lawful instructions, exercise reasonable care, maintain accounts and act loyally. A transaction made within the agent’s authority binds the principal in relation to the third party.\n\nTermination of agency\nUnder Section 201, agency may end when the principal revokes the authority, the agent renounces it, the business is completed, or the principal or agent dies or becomes of unsound mind. Insolvency of the principal may also affect the agency. Reasonable notice is important where revocation or renunciation is not immediate. An agency coupled with the agent’s interest cannot ordinarily be revoked to the prejudice of that interest. Acts already binding on third parties and duties arising from the agency remain protected.\n\nCaveat emptor\nCaveat emptor means “let the buyer beware.” Under the general rule in the Sale of Goods Act, 1930, a buyer must examine the goods and choose them for the buyer’s own purpose. The seller is not normally liable for every defect. The rule is limited where the buyer communicates a particular purpose and relies on the seller’s skill, where goods are bought by description from a dealer, where goods do not correspond with a sample or description, or where the seller has used fraud. These exceptions prevent the rule from becoming an instrument of unfair dealing.\n\nConditions and warranties\nA condition is an essential term going to the main purpose of the contract. Its breach normally permits rejection of the goods and a claim for damages. A warranty is a collateral term; its breach ordinarily gives a claim for damages but not a right to reject the goods. The parties may, in appropriate circumstances, treat a breach of condition as a breach of warranty. Whether a term is a condition or warranty depends on its substance, the statutory scheme and the intention shown by the contract. These distinctions determine the remedy available to the buyer.`;
    }
    if (/unpaid seller|partnership|dissolution of partnership/.test(text)) {
      if (gu) return `Unpaid Seller, Partnership અને Dissolution\n\nUnpaid seller અને તેના હકો\nSale of Goods Act, 1930ની કલમ 45 મુજબ જ્યારે આખી કિંમત ચૂકવાઈ ન હોય અથવા negotiable instrument conditional payment તરીકે આપવામાં આવ્યું હોય અને તે dishonour થયું હોય, ત્યારે વેચનાર unpaid seller બને છે. વેચનારને માલ પર lienનો હક, પરિવહન દરમિયાન માલ અટકાવવાનો હક અને કાયદાની શરતો હેઠળ resaleનો હક મળે છે. માલિકી ખરીદદારને પસાર થઈ હોય તો પણ આ હકો ઉપલબ્ધ થઈ શકે છે. વેચનાર કીમત માટે વ્યક્તિગત દાવો અને યોગ્ય પરિસ્થિતિમાં કરાર રદ કરવાની રાહત પણ મેળવી શકે છે.\n\nPartnershipનો અર્થ અને પ્રકારો\nIndian Partnership Act, 1932ની કલમ 4 મુજબ partnership એ એવા વ્યક્તિઓ વચ્ચેનો સંબંધ છે જેઓ બધા માટે અથવા કોઈ એક બધા માટે વ્યવસાય ચલાવવા અને નફો વહેંચવા સંમત થાય છે. partnershipનો મુખ્ય તત્ત્વ agreement, business, profit sharing અને mutual agency છે. partnership at willમાં અવધિ અથવા સમાપ્તિ અંગે કરાર ન હોય. particular partnership ચોક્કસ સાહસ અથવા સમય માટે હોય. નોંધાયેલ અને અનોધાયેલ firm વચ્ચે કાયદાકીય અમલના મહત્વના તફાવતો રહે છે.\n\nDissolutionની રીતો\nFirmનું dissolution બધા ભાગીદારો વચ્ચેનો સંબંધ પૂર્ણ કરે છે. તે ભાગીદારોની સંમતિથી, કરાર મુજબ, compulsory circumstancesથી, કોઈ ઘટના બને ત્યારે અથવા notice દ્વારા થઈ શકે છે. કોર્ટ misconduct, સતત કરારભંગ, વ્યવસાયમાં નુકસાન અથવા ન્યાયસંગત અને સમાન કારણોસર dissolutionનો હુકમ કરી શકે છે. dissolution પછી દેવા ચૂકવવા, firmની સંપત્તિ વસૂલવા, goodwillનું મૂલ્યાંકન કરવા અને ભાગીદારો વચ્ચે બચેલી રકમ વહેંચવાની પ્રક્રિયા થાય છે.\n\nનિષ્કર્ષ\nUnpaid sellerના હકો વેચનારની કિંમતની સુરક્ષા કરે છે, જ્યારે partnershipમાં mutual agency ભાગીદારોના સંબંધનું કેન્દ્ર છે. dissolution પછી પણ winding-upની પ્રક્રિયા અને તૃતીય પક્ષોને જરૂરી જાહેરનોટિસનું પાલન કરવું પડે છે.`;
      return `Unpaid Seller, Partnership and Dissolution\n\nUnpaid seller and rights\nUnder Section 45 of the Sale of Goods Act, 1930, a seller is unpaid when the whole price has not been paid or when a conditional negotiable instrument has been dishonoured. The unpaid seller has a lien while in possession, a right of stoppage in transit when the buyer becomes insolvent, and a right of resale in the circumstances permitted by the Act. The seller may also sue for the price and, where the statutory conditions are satisfied, claim damages or treat the contract as repudiated. These remedies secure the price without permitting arbitrary interference with the buyer’s rights.\n\nPartnership and its types\nSection 4 of the Indian Partnership Act, 1932 defines partnership as the relationship between persons who agree to share the profits of a business carried on by all or any of them acting for all. Agreement, business, profit sharing and mutual agency are its essential features. A partnership at will has no fixed duration or agreed mode of determination. A particular partnership is formed for a particular venture or period. Registration also matters because the Act places restrictions on certain contractual suits by an unregistered firm.\n\nModes of dissolution\nDissolution of a firm ends the partnership relationship between all the partners. It may occur by agreement, in accordance with the partnership contract, compulsorily on specified events, on the happening of a contingency, or by notice in a partnership at will. A court may order dissolution for misconduct, persistent breach, continuous losses, incapacity or other just and equitable grounds. Dissolution is followed by winding up: assets are collected, liabilities paid, goodwill dealt with, and the surplus distributed according to the partners’ rights.\n\nConclusion\nThe unpaid seller’s rights protect the price, mutual agency explains the liability of partners, and dissolution brings the business relationship to an orderly end while preserving the rights of creditors and third parties.`;
    }
    return undefined;
  }

  private static expandKnownAnswer(base: string, question: IQuestion, language: AnswerLanguage): string {
    const text = question.questionText.toLowerCase();
    const target = Number((this.getMarkPlan(question.marks || 5).words.match(/[\d,]+/)?.[0] || '0').replace(/,/g, ''));
    const sections: string[] = [];
    const gu = language === 'gu';
    if (/final.*draft|adoption of the constitution/.test(text)) {
      sections.push(gu
        ? `બંધારણસભાની રચના અને પૃષ્ઠભૂમિ\nકેબિનેટ મિશન યોજનાના આધારે બંધારણસભાની રચના થઈ અને તેની પ્રથમ બેઠક 9 ડિસેમ્બર 1946ના રોજ મળી. વિભાજન પછી સભ્યસંખ્યા ઘટી, છતાં સભાએ ભારતના સમગ્ર બંધારણીય ભવિષ્ય અંગે નિર્ણય લેવાનું કાર્ય ચાલુ રાખ્યું. જવાહરલાલ નેહરુએ 13 ડિસેમ્બર 1946ના રોજ Objectives Resolution રજૂ કર્યું, જે 22 જાન્યુઆરી 1947ના રોજ સ્વીકારાયું. તેમાં લોકસત્તા, ન્યાય, સ્વતંત્રતા, સમાનતા અને લઘુમતી સુરક્ષાના ધ્યેયો વ્યક્ત થયા.`
        : `Formation and constitutional background\nThe Constituent Assembly was formed under the Cabinet Mission scheme and held its first meeting on 9 December 1946. Partition reduced its membership, but the Assembly continued to frame the constitutional order of independent India. Jawaharlal Nehru moved the Objectives Resolution on 13 December 1946 and it was adopted on 22 January 1947. It expressed the constitutional goals of popular sovereignty, justice, liberty, equality and safeguards for minorities.`);
      sections.push(gu
        ? `ડ્રાફ્ટિંગ કમિટી અને ડ્રાફ્ટ\n29 ઓગસ્ટ 1947ના રોજ ડૉ. બી. આર. આંબેડકરની અધ્યક્ષતામાં ડ્રાફ્ટિંગ કમિટી રચાઈ. બંધારણીય સલાહકાર બી. એન. રાઉના અભ્યાસ અને વિવિધ સમિતિઓના અહેવાલોના આધારે કમિટીએ લખાણ તૈયાર કર્યું. ફેબ્રુઆરી 1948માં પ્રથમ ડ્રાફ્ટ પ્રસિદ્ધ થયો અને સભ્યો તથા જનતા તરફથી મળેલા સૂચનો પછી તેમાં સુધારા કરવામાં આવ્યા. આ પ્રક્રિયા દર્શાવે છે કે અંતિમ લખાણ ચર્ચા, તુલના અને સુધારાનું પરિણામ હતું.`
        : `The Drafting Committee and the Draft\nOn 29 August 1947 the Drafting Committee was constituted under the chairmanship of Dr B.R. Ambedkar. The work used the studies of Constitutional Adviser B.N. Rau and the reports of the Assembly’s specialist committees. The first Draft Constitution was published in February 1948. Suggestions from members and the public led to revisions. The final text was consequently the result of comparison, deliberation and amendment rather than the work of one individual.`);
      sections.push(gu
        ? `બંધારણસભાની ચર્ચાના તબક્કા\nડ્રાફ્ટ બંધારણ 4 નવેમ્બર 1948ના રોજ સભામાં રજૂ થયું. પ્રથમ વાચન પછી 15 નવેમ્બર 1948થી કલમવાર ચર્ચા શરૂ થઈ અને ઓક્ટોબર 1949 સુધી સભ્યોએ કલમો તથા સુધારાઓ પર ચર્ચા કરી. ત્રીજું વાચન 14 નવેમ્બર 1949થી શરૂ થયું. 26 નવેમ્બર 1949ના રોજ અંતિમ લખાણ સ્વીકારાયું. ચર્ચામાં સંઘીય માળખું, સંસદીય જવાબદાર સરકાર, મૂળભૂત અધિકારો, રાજ્યના નીતિનિર્દેશક તત્ત્વો, સ્વતંત્ર ન્યાયતંત્ર અને ચૂંટણી વ્યવસ્થા જેવા વિષયોનું સમાધાન થયું.`
        : `Stages of Assembly debate\nThe Draft Constitution was introduced in the Assembly on 4 November 1948. After the first reading, clause-by-clause consideration began on 15 November 1948 and continued through October 1949. The third reading began on 14 November 1949. The debates resolved the design of the Union, responsible parliamentary government, Fundamental Rights, Directive Principles, an independent judiciary and the electoral framework. On 26 November 1949 the final text was adopted.`);
      sections.push(gu
        ? `સ્વીકાર, હસ્તાક્ષર અને અમલ\n26 નવેમ્બર 1949ના રોજ બંધારણસભાએ બંધારણ “સ્વીકાર્યું, અધિનિયમિત કર્યું અને પોતાને અર્પણ કર્યું.” 24 જાન્યુઆરી 1950ના રોજ સભ્યોએ અંતિમ નકલ પર હસ્તાક્ષર કર્યા. Article 394 હેઠળ કેટલીક જોગવાઈઓ તરત અમલમાં આવી અને બાકીની જોગવાઈઓ 26 જાન્યુઆરી 1950થી અમલમાં આવી. આ દિવસે ભારત પ્રજાસત્તાક બન્યું અને બંધારણ સર્વોચ્ચ કાનૂન તરીકે કાર્યરત થયું.`
        : `Adoption, signature and commencement\nOn 26 November 1949 the Assembly adopted, enacted and gave to themselves the Constitution. Members signed the final copies on 24 January 1950. Article 394 allowed specified provisions to operate immediately and brought the remaining provisions into force on 26 January 1950. On that date India became a Republic and the Constitution commenced as the supreme legal framework.`);
      sections.push(gu
        ? `અંતિમ બંધારણનું મહત્વ\nઅંતિમ બંધારણે કેન્દ્ર અને રાજ્યો વચ્ચે સત્તાવિભાજન, સંસદીય કાર્યપદ્ધતિ, ન્યાયિક સમીક્ષા, મૂળભૂત અધિકારો અને સામાજિક પરિવર્તન માટેના નીતિનિર્દેશક તત્ત્વો ગોઠવ્યા. તેથી સ્વીકારની પ્રક્રિયા માત્ર ઔપચારિક ઘટના નહોતી; તે વિવિધ રાજકીય અને સામાજિક હિતોને એક બંધારણીય વ્યવસ્થામાં રૂપાંતરિત કરવાની પ્રક્રિયા હતી.`
        : `Significance of the final Constitution\nThe adopted Constitution organised the distribution of power between the Union and the States, parliamentary responsibility, judicial review, Fundamental Rights and Directive Principles directed towards social transformation. The adoption procedure was therefore not a mere formality. It converted competing political and social interests into a common constitutional order.`);
    } else if (/cabinet mission.*mountbatten|mountbatten.*cabinet mission/.test(text)) {
      sections.push(gu
        ? `કેબિનેટ મિશનની રચના અને પરિસ્થિતિ\nકેબિનેટ મિશનમાં પેથિક-લોરેન્સ, સ્ટેફર્ડ ક્રિપ્સ અને એ. વી. એલેક્ઝાન્ડર સામેલ હતા. મિશનનો હેતુ ભારતીય નેતાઓ સાથે ચર્ચા કરીને બંધારણીય ગતિરોધ દૂર કરવો હતો. 16 મે 1946ની યોજનાએ મર્યાદિત વિષયો ધરાવતા સંઘ, પ્રાંતોના જૂથો અને બંધારણસભાની રચના સૂચવી. સંઘ પાસે રક્ષા, વિદેશી બાબતો અને સંચાર રહેવાના હતા, જ્યારે અન્ય સત્તાઓ પ્રાંતો પાસે રહેવાની હતી.`
        : `Composition and setting of the Cabinet Mission\nThe Cabinet Mission consisted of Pethick-Lawrence, Sir Stafford Cripps and A.V. Alexander. It was sent to negotiate a constitutional settlement with Indian leaders. Its Statement of 16 May 1946 proposed a limited Union, provincial groups and a Constituent Assembly. The Union would control defence, foreign affairs and communications, while residuary powers would remain with the Provinces.`);
      sections.push(gu
        ? `જૂથબંધી અને બંધારણસભા\nયોજનામાં પ્રાંતોને જૂથોમાં ગોઠવીને દરેક જૂથને સામાન્ય વિષયો અંગે વિચારવાની સત્તા આપવાની હતી. બંધારણસભા પ્રાંતોના પ્રતિનિધિઓ અને દેશી રાજ્યોના પ્રતિનિધિઓથી બનેલી હોત. આ માળખાનો હેતુ ભારતની એકતા જાળવવાનો અને મુસ્લિમ બહુમતીવાળા પ્રાંતોને રાજકીય સુરક્ષા આપવાનો હતો. પરંતુ જૂથબંધી ફરજિયાત છે કે વૈકલ્પિક, તે મુદ્દે કોંગ્રેસ અને મુસ્લિમ લીગ વચ્ચે મતભેદ રહ્યા.`
        : `Grouping and the Constituent Assembly\nThe Plan arranged provinces into groups which could consider common subjects. The Constituent Assembly was to include representatives of the Provinces and the Indian States. The design tried to preserve Indian unity while giving Muslim-majority provinces political safeguards. Its central weakness was the disagreement over whether provincial grouping was compulsory and how far the groups could operate independently.`);
      sections.push(gu
        ? `માઉન્ટબેટન યોજનાની જરૂરિયાત\nમાર્ચ 1947માં લોર્ડ માઉન્ટબેટન વાઇસરોય બન્યા ત્યારે સામુદાયિક હિંસા, વહીવટી અસ્થિરતા અને કોંગ્રેસ-લીગનો ગતિરોધ વધ્યો હતો. સંયુક્ત ભારત અંગે સમજૂતી ન થતાં 3 જૂન 1947ની યોજનાએ વિભાજન સ્વીકાર્યું. પંજાબ અને બંગાળના વિભાજન અંગે પ્રતિનિધિઓના નિર્ણય, ઉત્તર-પશ્ચિમ સરહદ પ્રાંતમાં જનમત અને સિલહટ અંગેની પ્રક્રિયા નક્કી કરવામાં આવી.`
        : `Why the Mountbatten Plan was adopted\nWhen Lord Mountbatten became Viceroy in March 1947, communal violence, administrative instability and the Congress–League deadlock had intensified. Since agreement on a united India appeared unattainable, the 3 June 1947 Plan accepted partition. It provided procedures for decisions concerning the partition of Punjab and Bengal, a referendum in the North-West Frontier Province and a decision concerning Sylhet.`);
      sections.push(gu
        ? `કાનૂની અમલ અને તુલના\nમાઉન્ટબેટન યોજનાનો અમલ Indian Independence Act, 1947 દ્વારા થયો. 15 ઓગસ્ટ 1947થી ભારત અને પાકિસ્તાન બે ડોમિનિયન બન્યા અને બ્રિટિશ સત્તાનો અંત આવ્યો. કેબિનેટ મિશન યોજના એકતા અને સંઘીય સમાધાન બચાવવાનો પ્રયાસ હતી, જ્યારે માઉન્ટબેટન યોજના વિભાજન સ્વીકારીને ઝડપી અને કાનૂની રીતે નિશ્ચિત સત્તા હસ્તાંતરણનો ઉપાય હતી.`
        : `Legal implementation and comparison\nThe Mountbatten Plan was implemented by the Indian Independence Act, 1947. From 15 August 1947 India and Pakistan became two Dominions and British authority ended. The Cabinet Mission was an attempt to preserve unity through a federal compromise; the Mountbatten Plan accepted partition and provided a rapid and legally definite transfer of sovereignty.`);
    }
    if (question.marks <= 5 && sections.length > 0) return `${base}\n\n${sections[0]}`;
    let result = base;
    for (const section of sections) {
      if (result.split(/\s+/).filter(Boolean).length >= target) break;
      result += `\n\n${section}`;
    }
    return result;
  }

  static buildStudyTips(question: IQuestion, answerType: 'short' | 'long'): string[] {
    const focus = this.getQuestionFocus(question.questionText);
    const references = this.getLegalReferences(question);
    const marks = question.marks || this.getGuidanceMarks(answerType);
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
    if (marks <= 5) return { pages: 'approximately 1 A4 page', words: '350–500 words' };
    if (marks <= 15) return { pages: 'approximately 2–3 A4 pages', words: '900–1,200 words' };
    if (marks <= 20) return { pages: 'approximately 3–4 A4 pages', words: '1,300–1,600 words' };
    return { pages: 'approximately 4–5 A4 pages', words: '1,600–2,200 words' };
  }

  private static getGuidanceMarks(answerType: 'short' | 'long'): number {
    return answerType === 'short' ? 15 : 25;
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

    // Constitutional History questions must not receive a modern fundamental-
    // rights template. Their answer turns on the historical instruments and
    // constitutional steps named in the question.
    if (/cripps mission/.test(text)) {
      return {
        area: 'constitutional history of the Cripps Mission, 1942',
        principle: 'the constitutional proposal must be understood in its wartime setting, its promise of post-war self-government, its proposed constitution-making body, and the reasons it was not accepted',
        provisions: ['Cripps Proposals, 1942: post-war Dominion Status', 'Proposal for a constitution-making body after the war', 'Provincial option and the treatment of princely states in the proposal'],
        cases: ['Cripps Mission Proposals, 1942 — the primary historical source', 'Constituent Assembly Debates — the later constitutional response', 'Indian Independence Act, 1947 — the later legal transition to independence'],
      };
    }
    if (/cabinet mission|mountbatten|3 june plan/.test(text)) {
      return {
        area: 'constitutional history of the transfer of power, 1946–47',
        principle: 'the answer must distinguish the Cabinet Mission’s federal/grouping proposal from the later Mountbatten or 3 June Plan and explain how the latter led to partition and independence',
        provisions: ['Cabinet Mission Statement, 16 May 1946', 'Cabinet Mission scheme for a Union, groups and provinces', '3 June 1947 Plan and Indian Independence Act, 1947'],
        cases: ['Cabinet Mission Statement, 1946 — proposed constitutional arrangement', '3 June or Mountbatten Plan, 1947 — agreed method of transfer and partition', 'Indian Independence Act, 1947 — statutory implementation of independence'],
      };
    }
    if (/final draft|adoption of the constitution|constituent assembly|drafting committee/.test(text)) {
      return {
        area: 'constitution-making by the Constituent Assembly of India',
        principle: 'the answer must trace preparation of the Draft Constitution, its readings and amendments, adoption on 26 November 1949, and commencement on 26 January 1950',
        provisions: ['Constituent Assembly procedure and Drafting Committee process', 'Adoption of the Constitution on 26 November 1949', 'Article 394 on commencement of constitutional provisions and 26 January 1950 commencement'],
        cases: ['Constituent Assembly Debates — discussion and amendment of the Draft Constitution', 'Draft Constitution and final Constitution records — comparison of the draft and adopted text', 'Constitution of India, Article 394 — commencement provision'],
      };
    }
    if (/government of india act,? 1935|federal court/.test(text)) {
      return {
        area: 'constitutional history under the Government of India Act, 1935',
        principle: 'the answer must identify the federal scheme, provincial autonomy, legislative distribution and the institutional changes introduced by the 1935 Act',
        provisions: ['Government of India Act, 1935: provincial autonomy', 'Government of India Act, 1935: proposed federation and legislative lists', 'Government of India Act, 1935: Federal Court and constitutional administration'],
        cases: ['Government of India Act, 1935 — the primary constitutional instrument', 'Federal Court decisions under the 1935 framework — early constitutional interpretation', 'Constituent Assembly Debates — evaluation of colonial institutional arrangements'],
      };
    }
    if (/indian independence act,? 1947/.test(text)) {
      return {
        area: 'constitutional history of Indian independence in 1947',
        principle: 'the answer must explain the creation of the two Dominions, the end of British sovereignty, the division of territories and the constitutional authority transferred to the new states',
        provisions: ['Indian Independence Act, 1947: establishment of India and Pakistan', 'Indian Independence Act, 1947: end of British suzerainty and legislative authority', 'Indian Independence Act, 1947: transitional constitutional arrangements'],
        cases: ['Indian Independence Act, 1947 — the primary legal instrument', '3 June or Mountbatten Plan, 1947 — political basis for the Act', 'Constituent Assembly Debates — transition from the Act to the Constitution'],
      };
    }
    if (/simon commission|nehru report|round table/.test(text)) {
      return {
        area: 'constitutional history of the Indian national movement',
        principle: 'the answer must place the named commission, report or conference in chronological order and explain its proposal, political response and constitutional significance',
        provisions: ['Simon Commission and the constitutional review process', 'Nehru Report, 1928 and its proposed constitutional framework', 'Round Table Conferences, 1930–32 and their constitutional discussions'],
        cases: ['Simon Commission Report — constitutional review under colonial rule', 'Nehru Report, 1928 — Indian constitutional proposals', 'Round Table Conference records — negotiations on India’s constitutional future'],
      };
    }

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
    const marks = question.marks || this.getGuidanceMarks(answerType);
    const opening = `The legal position concerning “${focus}” in ${question.subject} rests on the meaning of the topic, the governing rule, its essential requirements and its application to the question. In a ${marks}-mark response the controlling issue is therefore analysed within ${plan.pages} (${plan.words}), with the legal result tied to the exact subject asked.`;
    const framework = `\n\n1. INTRODUCTION AND LEGAL FRAMEWORK\n${focus} belongs to ${references.area}. The controlling principle is that ${references.principle}. This principle identifies the legal interest involved, the source of the rule and the consequence that follows when its requirements are or are not established.`;
    const provisions = `\n\n2. STATUTORY PROVISIONS\nThe relevant legal materials are ${references.provisions.join('; ')}. These provisions establish the scope of the rule, its conditions and its legal consequences. An exception, defence, remedy or limitation modifies the result only to the extent recognised by the applicable law.`;
    const caseAnalysis = `\n\n3. CASE LAW AND APPLICATION\n${references.cases[0]} establishes an authority relevant to the controlling principle. ${references.cases[1]} provides a comparison or identifies a boundary of that principle. The reasoning from these authorities connects the legal rule with the wording and facts of the question. Where two interpretations are possible, the stronger interpretation is the one supported by the statutory text, constitutional purpose and binding authority.`;
    const conclusion = `\n\n${answerType === 'long' ? '4. ANALYSIS AND CONCLUSION' : '4. CONCLUSION'}\nThe legal result follows from the definition of ${focus}, the applicable provisions and the principles established by the authorities. On that basis, the question is resolved according to its command—definition, explanation, discussion, distinction or application—without introducing an unrelated issue.`;

    if (answerType === 'short') {
      return this.expandToTarget(`${opening}${framework}${provisions}${caseAnalysis}${conclusion}`, plan.words, question, references, 'en');
    }

    return this.expandToTarget(`${opening}${framework}${provisions}\n\n3. INGREDIENTS, CLASSIFICATIONS AND EXCEPTIONS\nSet out each ingredient of the rule in a separate paragraph. Explain how the ingredients differ from related concepts, identify any statutory exception or defence, and mention the remedy or consequence that follows. This is where a long answer earns marks through orderly analysis rather than repetition.${caseAnalysis}${conclusion}`, plan.words, question, references, 'en');
  }

  private static buildGujaratiAnswer(question: IQuestion, answerType: 'short' | 'long'): string {
    const focus = this.getQuestionFocus(question.questionText);
    const marks = question.marks || (answerType === 'short' ? 5 : 25);
    const references = this.getLegalReferences(question);
    const opening = `“${focus}” અંગે ${question.subject || 'કાયદા'}નો કાનૂની અભિગમ ${marks} ગુણના પ્રશ્ન માટે નીચે મુજબ છે. મુદ્દાનો અર્થ, લાગુ નિયમ, જરૂરી તત્ત્વો, સત્તા અને કાનૂની પરિણામ એકબીજા સાથે જોડાયેલા છે.`;
    const framework = `\n\n૧. પરિચય અને કાનૂની મુદ્દો\n${focus}નો કાનૂની સંદર્ભ ${references.area} છે. લાગુ પડતો મૂળ સિદ્ધાંત એ છે કે ${references.principle}. આ સિદ્ધાંત કાનૂની હક, ફરજ, સત્તા અથવા જવાબદારી અને તેના પરિણામ વચ્ચેનો સંબંધ સ્પષ્ટ કરે છે.`;
    const rule = `\n\n૨. લાગુ કાયદો અને જોગવાઈઓ\nઆ મુદ્દા સાથે સંબંધિત કાનૂની સ્રોતો છે: ${references.provisions.join('; ')}. આ જોગવાઈઓ નિયમનો વિસ્તાર, તેની શરતો, અપવાદો અને કાનૂની પરિણામ નક્કી કરે છે. જૂના અને નવા કાયદા વચ્ચેનો તફાવત લાગુ પડે ત્યારે સંબંધિત પરીક્ષા-સંદર્ભ પ્રમાણે યોગ્ય જોગવાઈ માન્ય રહે છે.`;
    const elements = `\n\n૩. જરૂરી તત્ત્વો અને વર્ગીકરણ\nનિયમ અલગ અલગ જરૂરી તત્ત્વોથી બનેલો છે. દરેક તત્ત્વનો અર્થ, તેની કાનૂની જરૂરિયાત અને તત્ત્વ સિદ્ધ થાય કે ન થાય તેનું પરિણામ અલગ છે. સમાન ખ્યાલો, અપવાદો, બચાવ અને ઉપાય વચ્ચેનો ભેદ કાનૂની સ્થિતિ સ્પષ્ટ કરે છે.`;
    const caseLaw = `\n\n૪. કેસ અને કાનૂની ઉપયોગ\nસંબંધિત સત્તાઓમાં ${references.cases[0]}; ${references.cases[1]}; અને ${references.cases[2]}નો સમાવેશ થાય છે. આ સત્તાઓ કોર્ટ દ્વારા સ્વીકારાયેલ નિયમ, તેના તથ્ય આધાર અને તેની મર્યાદા દર્શાવે છે. પ્રશ્નના તથ્યો અધૂરા હોય ત્યારે ઉપલબ્ધ તથ્યોને આધારે શરતી કાનૂની પરિણામ આવે છે.`;
    const application = `\n\n૫. કાનૂની પરિણામ\nમુદ્દા પર લાગુ પડતો નિયમ હક, ફરજ, ઉપાય, બચાવ, પ્રક્રિયાત્મક મર્યાદા અથવા અન્ય કાનૂની પરિણામ સ્પષ્ટ કરે છે. પક્ષકારોની દલીલ અને સામે પક્ષની મર્યાદા બંનેનો સંબંધ આ પરિણામ સાથે છે. અજ્ઞાત હકીકત ઉમેર્યા વિના ઉપલબ્ધ માહિતી પરથી યોગ્ય પરિણામ નક્કી થાય છે.`;
    const evaluation = `\n\n૬. મર્યાદાઓ\nનિયમનો વિસ્તાર તેની વ્યાખ્યા, લાગુ જોગવાઈ, સ્વીકારેલા અપવાદ અને ઉપલબ્ધ ન્યાયિક સત્તાથી મર્યાદિત રહે છે. ખોટી કલમ, અસંબંધિત કેસ અથવા આધાર વિનાનું પરિણામ આ મુદ્દાની કાનૂની ચોકસાઈ ઘટાડે છે.`;
    const conclusion = `\n\n૭. નિષ્કર્ષ\n${focus} અંગેનું પરિણામ તેની વ્યાખ્યા, લાગુ જોગવાઈઓ, જરૂરી તત્ત્વો અને સંબંધિત સત્તાઓના સંયુક્ત અભ્યાસ પરથી આવે છે. આથી પ્રશ્નનો કાનૂની ઉકેલ ઉપરોક્ત નિયમ અને તેની મર્યાદા સાથે સુસંગત રહે છે.`;
    const base = marks <= 5
      ? `${opening}${framework}${rule}${caseLaw}${conclusion}`
      : marks <= 15
        ? `${opening}${framework}${rule}${elements}${caseLaw}${application}${conclusion}`
        : `${opening}${framework}${rule}${elements}${caseLaw}${application}${evaluation}${conclusion}`;
    return this.expandToTarget(base, this.getMarkPlan(marks).words, question, references, 'gu');
  }

  private static expandToTarget(
    base: string,
    targetRange: string,
    question: IQuestion,
    references: LegalReferenceSet,
    language: AnswerLanguage
  ): string {
    const target = Number((targetRange.match(/[\d,]+/)?.[0] || '0').replace(/,/g, ''));
    const words = () => base.split(/\s+/).filter(Boolean).length;
    const focus = this.getQuestionFocus(question.questionText);
    const englishSections = [
      `Historical and doctrinal setting: “${focus}” operates within its proper legal setting and is distinct from neighbouring concepts. Its purpose is substantive: it allocates power, imposes a duty, recognises a right, or provides a remedy.`,
      `Element-by-element analysis: The rule operates through separate ingredients, each with its own meaning and legal consequence. The result depends on whether each ingredient is established and whether a recognised exception applies.`,
      `Authorities and weight: The primary materials are ${references.provisions.join('; ')}. The authorities ${references.cases.join('; ')} explain the controlling principle, its application and its limits.`,
      `Competing interpretation: The wording may support more than one view. The stronger view is determined by the statutory language, constitutional purpose, precedent and the facts supplied.`,
      `Application and consequence: The material rule produces a legal consequence on the facts or on the exact command of the question, including any remedy, defence or procedural limitation.`,
      `Critical evaluation: The boundary of the rule lies in what it does not decide, the exceptions that narrow it and the reasons a competing principle cannot be extended beyond its authority.`,
      `Conclusion: The legal result is stated in the same order as the question, with the decisive reason and any qualification caused by missing facts or a statutory exception.`,
    ];
    const gujaratiSections = [
      `\n\nકાનૂની પૃષ્ઠભૂમિ\n“${focus}”નો યોગ્ય કાનૂની સંદર્ભ અને નજીકના સમાન ખ્યાલોથી તેનો ભેદ સ્પષ્ટ છે. નિયમ હક, ફરજ, સત્તા, જવાબદારી અથવા ઉપાય કેવી રીતે નક્કી કરે છે તે બતાવે છે.`,
      `\n\nનિયમના તત્ત્વો\nનિયમ અલગ અલગ જરૂરી તત્ત્વો દ્વારા કાર્ય કરે છે. દરેક તત્ત્વનો અર્થ, તેનું કાનૂની પરિણામ અને લાગુ પડતો અપવાદ પરિણામ નક્કી કરે છે.`,
      `\n\nપ્રાથમિક કાયદો અને સત્તા\nસંબંધિત સ્રોતો છે: ${references.provisions.join('; ')}. ન્યાયિક અને ઐતિહાસિક સત્તાઓ છે: ${references.cases.join('; ')}. આ સ્રોતો નિયમ, તેનો હેતુ અને તેની મર્યાદા સમજાવે છે.`,
      `\n\nવિરુદ્ધ દલીલ અને મર્યાદા\nપ્રશ્નના શબ્દોમાં બે અર્થ શક્ય હોય તો કાયદાની ભાષા, હેતુ, સત્તાવાર અભિગમ અને ઉપલબ્ધ તથ્યોમાંથી વધુ મજબૂત અર્થ નક્કી થાય છે. અજ્ઞાત હકીકત ઉમેરાતી નથી.`,
      `\n\nકાનૂની પરિણામ\nદરેક મહત્વનો નિયમ પ્રશ્નની હકીકત અથવા પૂછાયેલા મુદ્દા પર લાગુ થાય છે. તેમાંથી હક, ફરજ, ઉપાય, બચાવ, પ્રક્રિયાત્મક મર્યાદા અને કાનૂની પરિણામ સ્પષ્ટ થાય છે.`,
      `\n\nમર્યાદાઓ\nનિયમની સીમા, તેને સંકુચિત કરતો અપવાદ અને પ્રશ્નથી બહારનો મુદ્દો કાનૂની ચોકસાઈ જાળવે છે. ખોટી કલમ, અસંબંધિત કેસ અને પુનરાવર્તન પરિણામને નબળું બનાવે છે.`,
      `\n\nસારાંશ\nઅંતિમ કાનૂની પરિણામ પ્રશ્નના મુખ્ય કારણ અને લાગુ પડતી મર્યાદા પરથી આવે છે. નવી સત્તા અથવા નવો મુદ્દો આ પરિણામમાં ઉમેરાતો નથી.`,
    ];
    const sections = language === 'gu' ? gujaratiSections : englishSections;
    let index = 0;
    while (words() < target && index < sections.length) {
      base += `\n\n${sections[index]}`;
      index += 1;
    }
    // The base answer plus the seven substantive dimensions normally reaches
    // the requested band. For unusually long 25-mark prompts, continue with a
    // clearly labelled application section rather than silently returning a
    // short answer.
    while (words() < target) {
      const section = sections[index % sections.length];
      base += `\n\n${section}`;
      index += 1;
    }
    return base;
  }
}

export default AnswerGuidanceService;
