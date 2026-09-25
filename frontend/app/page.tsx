"use client";

import { ArrowRightIcon, AcademicCapIcon, SparklesIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      icon: SparklesIcon,
      title: "AI-Generated Content",
      description: "Study materials generated from actual LLB question papers using advanced AI",
    },
    {
      icon: BookOpenIcon,
      title: "Multiple Formats",
      description: "Long answers, short answers, MCQs, flashcards, case laws, and revision notes",
    },
    {
      icon: AcademicCapIcon,
      title: "Comprehensive Coverage",
      description: "Papers from multiple years and semesters from Goa University",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Master LLB with AI-Powered Study Materials
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive study platform generating intelligent content from question papers to help law students excel.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/papers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Explore Papers <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <Link
            href="/study"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Start Studying
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8 py-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <Icon className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </section>

      {/* Content Types Section */}
      <section className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">Available Content Types</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            "Long Answers",
            "Short Answers",
            "MCQs",
            "Flashcards",
            "Case Laws",
            "Bare Acts",
            "Revision Notes",
            "Practice Tests",
          ].map((type) => (
            <div key={type} className="bg-white p-4 rounded border-l-4 border-primary-600">
              <p className="font-medium text-gray-900">{type}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid md:grid-cols-3 gap-8 text-center py-8">
        {[
          { number: "100+", label: "Question Papers" },
          { number: "10,000+", label: "Study Materials" },
          { number: "7", label: "Content Types" },
        ].map((stat, index) => (
          <div key={index}>
            <p className="text-3xl font-bold text-primary-600">{stat.number}</p>
            <p className="text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
