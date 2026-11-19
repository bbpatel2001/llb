export const SEMESTER1_SUBJECTS = {
  '101': '101 Law of Torts Including Motor Vehicle Accident and Consumer Protection Laws',
  '102': '102 Criminal Law I',
  '103': '103 Criminal Law II',
  '104': '104 Law of Contract and Specific Relief Act I',
  '105': '105 Special Contract',
  '106F': '106F Constitutional History of India',
  '107K': '107K Use of Law Journal and Legal Software',
} as const;

export function canonicalSemester1Subject(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const text = value.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  if (/^(?:cc-?101|101|law of tort|tort)/i.test(text) || /motor vehicle|consumer protection/.test(text)) return SEMESTER1_SUBJECTS['101'];
  if (/^(?:cc-?102|cs-?102|102|criminal law i\b)/i.test(text) || (/indian penal code|bharatiya nyaya sanhita/.test(text) && !/specific offences/.test(text))) return SEMESTER1_SUBJECTS['102'];
  if (/^(?:cc-?103|cs-?103|103|criminal law ii\b)/i.test(text) || /specific offences/.test(text)) return SEMESTER1_SUBJECTS['103'];
  if (/^(?:cc-?104|cs-?104|104|law of contract)/i.test(text) || /specific relief/.test(text)) return SEMESTER1_SUBJECTS['104'];
  if (/^(?:cc-?105|cs-?105|105|special contract)/i.test(text)) return SEMESTER1_SUBJECTS['105'];
  if (/^(?:cc-?106f|cs-?106f|106f|foundation-106f|constitutional history|constitutional)/i.test(text)) return SEMESTER1_SUBJECTS['106F'];
  if (/^(?:cc-?107k|cs-?107k|107k|use of law journal|law journal|legal software)/i.test(text)) return SEMESTER1_SUBJECTS['107K'];
  if (/^contract$/i.test(text)) return SEMESTER1_SUBJECTS['104'];
  if (/^criminal$/i.test(text)) return SEMESTER1_SUBJECTS['102'];
  return value.trim();
}
