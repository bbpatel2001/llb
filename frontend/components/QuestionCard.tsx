"use client";

import Link from 'next/link';
import { ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';

interface QuestionCardProps {
  id: string;
  text: string;
  type: 'MCQ' | 'SHORT' | 'LONG' | 'DESCRIPTIVE';
  subject: string;
  semester: number;
  year?: number;
}

export default function QuestionCard({
  id,
  text,
  type,
  subject,
  semester,
  year,
}: QuestionCardProps) {
  const typeColors = {
    MCQ: 'bg-purple-100 text-purple-800',
    SHORT: 'bg-blue-100 text-blue-800',
    LONG: 'bg-green-100 text-green-800',
    DESCRIPTIVE: 'bg-orange-100 text-orange-800',
  };

  const truncatedText = text.length > 120 ? text.substring(0, 120) + '...' : text;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 h-full flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[type]}`}>
          {type}
        </span>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          Sem {semester}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3 flex-1">{truncatedText}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">{subject}</span>
          {year && <span className="text-gray-500"> • {year}</span>}
        </div>
        <Link
          href={`/questions/${id}`}
          className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
        >
          <span className="text-xs font-medium">View</span>
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
