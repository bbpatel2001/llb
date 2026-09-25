'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/card';

interface CaseReference {
  caseName: string;
  citation: string;
  year: number;
  court: string;
  relevantPrinciple: string;
  relevantSections?: string[];
}

interface ActReference {
  actName: string;
  sections: Array<{
    number: string;
    title: string;
    summary: string;
  }>;
}

interface Answer {
  _id: string;
  type: 'short' | 'long' | 'standard' | 'mcq' | 'case_study';
  text: string;
  wordCount: number;
  keyPoints: string[];
  casesReferred: CaseReference[];
  actsReferred: ActReference[];
  studyTips: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  qualityScore: number;
  verified: boolean;
  mcqOptions?: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  mcqExplanation?: string;
  sources?: Array<{
    type: string;
    title: string;
    year: number;
  }>;
}

interface AnswerViewProps {
  questionId: string;
  questionText: string;
}

export default function AnswerView({ questionId, questionText }: AnswerViewProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('short');

  useEffect(() => {
    fetchAnswers();
  }, [questionId]);

  const fetchAnswers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/answers/${questionId}`);
      const data = await response.json();
      
      if (data.success) {
        setAnswers(data.answers);
      } else {
        setError(data.error || 'Failed to fetch answers');
      }
    } catch (err) {
      setError('Error fetching answers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading answers...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  const shortAnswer = answers.find((a) => a.type === 'short');
  const longAnswer = answers.find((a) => a.type === 'long');
  const mcqAnswer = answers.find((a) => a.type === 'mcq');
  const caseStudyAnswer = answers.find((a) => a.type === 'case_study');

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {shortAnswer && <TabsTrigger value="short">Short Answer</TabsTrigger>}
          {longAnswer && <TabsTrigger value="long">Long Answer</TabsTrigger>}
          {mcqAnswer && <TabsTrigger value="mcq">MCQ</TabsTrigger>}
          {caseStudyAnswer && <TabsTrigger value="case">Case Study</TabsTrigger>}
        </TabsList>

        {/* SHORT ANSWER TAB */}
        {shortAnswer && (
          <TabsContent value="short" className="space-y-4">
            <AnswerCard answer={shortAnswer} getDifficultyColor={getDifficultyColor} />
          </TabsContent>
        )}

        {/* LONG ANSWER TAB */}
        {longAnswer && (
          <TabsContent value="long" className="space-y-4">
            <AnswerCard answer={longAnswer} getDifficultyColor={getDifficultyColor} />
          </TabsContent>
        )}

        {/* MCQ TAB */}
        {mcqAnswer && (
          <TabsContent value="mcq" className="space-y-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Multiple Choice Question
                  <Badge className={getDifficultyColor(mcqAnswer.difficulty)}>
                    {mcqAnswer.difficulty}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {mcqAnswer.mcqOptions?.map((option, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border rounded-lg ${
                        option.isCorrect
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">
                        {option.label}. {option.text}
                        {option.isCorrect && <span className="text-green-600 ml-2">✓ Correct</span>}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{option.explanation}</div>
                    </div>
                  ))}
                </div>
                {mcqAnswer.mcqExplanation && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <strong>Explanation:</strong>
                    <p className="text-sm mt-1">{mcqAnswer.mcqExplanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* CASE STUDY TAB */}
        {caseStudyAnswer && (
          <TabsContent value="case" className="space-y-4">
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle>Case Study Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseStudyAnswer.questions?.map((q, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-b-0">
                    <div className="font-semibold text-base mb-2">
                      Q{idx + 1}: {q.subQuestion}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="text-gray-700">{q.expectedAnswer}</div>
                      <div className="text-gray-500 text-xs mt-2">Marks: {q.marks}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface AnswerCardProps {
  answer: Answer;
  getDifficultyColor: (difficulty: string) => string;
}

function AnswerCard({ answer, getDifficultyColor }: AnswerCardProps) {
  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="capitalize">{answer.type} Answer</span>
          <div className="flex gap-2">
            <Badge className={getDifficultyColor(answer.difficulty)}>
              {answer.difficulty}
            </Badge>
            <Badge variant="outline">
              Quality: {answer.qualityScore}/10
            </Badge>
            {answer.verified && (
              <Badge className="bg-green-100 text-green-800">Verified</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Answer Text */}
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-6">
            {answer.text}
          </div>
        </div>

        {/* Word Count */}
        <div className="text-xs text-gray-500">
          Word Count: {answer.wordCount} words
        </div>

        {/* Key Points */}
        {answer.keyPoints && answer.keyPoints.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Key Points</h4>
            <ul className="space-y-1 text-sm">
              {answer.keyPoints.map((point, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Case References */}
        {answer.casesReferred && answer.casesReferred.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Case Law References</h4>
            <div className="space-y-3">
              {answer.casesReferred.map((caseRef, idx) => (
                <div key={idx} className="border-l-2 border-amber-300 pl-3">
                  <div className="font-semibold text-sm">{caseRef.caseName}</div>
                  <div className="text-xs text-gray-600">
                    <span className="font-mono">{caseRef.citation}</span> ({caseRef.year})
                  </div>
                  <div className="text-xs text-gray-700 mt-1">
                    {caseRef.court}
                  </div>
                  <div className="text-sm mt-1 bg-white p-2 rounded">
                    <strong className="text-xs">Principle:</strong> {caseRef.relevantPrinciple}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Act References */}
        {answer.actsReferred && answer.actsReferred.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Statutory References</h4>
            <div className="space-y-3">
              {answer.actsReferred.map((act, idx) => (
                <div key={idx} className="border-l-2 border-purple-300 pl-3">
                  <div className="font-semibold text-sm">{act.actName}</div>
                  <div className="space-y-2 mt-2">
                    {act.sections.map((section, sIdx) => (
                      <div key={sIdx} className="bg-white p-2 rounded text-xs">
                        <div className="font-mono font-bold">Section {section.number}</div>
                        {section.title && <div className="font-semibold">{section.title}</div>}
                        <div className="text-gray-700">{section.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Tips */}
        {answer.studyTips && answer.studyTips.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Study Tips</h4>
            <ul className="space-y-1 text-sm">
              {answer.studyTips.map((tip, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-green-600">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        {answer.sources && answer.sources.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-semibold text-xs text-gray-600 mb-2">Sources</h4>
            <ul className="space-y-1 text-xs text-gray-500">
              {answer.sources.map((source, idx) => (
                <li key={idx}>
                  • {source.title} ({source.year})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
