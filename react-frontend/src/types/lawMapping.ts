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

export interface LawMapping {
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

export interface LawMappingListResponse {
  mappings: LawMapping[];
  total: number;
  page: number;
  limit: number;
}

export interface LawMappingDetailResponse {
  mapping: LawMapping;
}
