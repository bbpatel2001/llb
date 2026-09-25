import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLB Knowledge Platform - Master Law Studies",
  description: "Comprehensive AI-powered study platform for law students. Access questions, answers, flashcards, case laws, and more.",
  keywords: ["LLB", "law", "study", "education", "questions", "answers", "flashcards"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="min-h-screen flex flex-col">
          {/* Header Navigation */}
          <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">LLB</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">LLB Platform</span>
                </Link>

                {/* Navigation Links */}
                <ul className="hidden md:flex gap-8 items-center">
                  <li>
                    <Link href="/" className="text-gray-600 hover:text-primary-600 font-medium transition">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/questions" className="text-gray-600 hover:text-primary-600 font-medium transition">
                      Questions
                    </Link>
                  </li>
                  <li>
                    <Link href="/flashcards" className="text-gray-600 hover:text-primary-600 font-medium transition">
                      Flashcards
                    </Link>
                  </li>
                  <li>
                    <Link href="/cases" className="text-gray-600 hover:text-primary-600 font-medium transition">
                      Case Laws
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-gray-600 hover:text-primary-600 font-medium transition">
                      About
                    </Link>
                  </li>
                </ul>

                {/* Mobile Menu Button */}
                <button className="md:hidden">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                {/* Brand */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">LLB</span>
                    </div>
                    <span className="font-bold text-white">LLB Platform</span>
                  </div>
                  <p className="text-sm text-gray-400">Master law studies with AI-powered content</p>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/" className="hover:text-primary-400 transition">Home</Link></li>
                    <li><Link href="/questions" className="hover:text-primary-400 transition">Questions</Link></li>
                    <li><Link href="/flashcards" className="hover:text-primary-400 transition">Flashcards</Link></li>
                    <li><Link href="/cases" className="hover:text-primary-400 transition">Case Laws</Link></li>
                  </ul>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="font-semibold text-white mb-4">Resources</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/about" className="hover:text-primary-400 transition">About Us</Link></li>
                    <li><Link href="#" className="hover:text-primary-400 transition">Contact</Link></li>
                    <li><Link href="#" className="hover:text-primary-400 transition">Privacy</Link></li>
                    <li><Link href="#" className="hover:text-primary-400 transition">Terms</Link></li>
                  </ul>
                </div>

                {/* Social */}
                <div>
                  <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                  <div className="flex gap-4 text-sm">
                    <a href="#" className="hover:text-primary-400 transition">Facebook</a>
                    <a href="#" className="hover:text-primary-400 transition">LinkedIn</a>
                    <a href="#" className="hover:text-primary-400 transition">Twitter</a>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-8">
                <p className="text-center text-sm text-gray-400">
                  © 2026 LLB Platform. All rights reserved. | Powered by Next.js & AI
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
