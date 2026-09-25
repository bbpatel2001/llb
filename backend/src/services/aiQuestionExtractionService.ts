/**
 * AI Question Extraction Service
 * Uses Free AI APIs to extract questions from PDFs/images instead of OCR
 * 
 * Free APIs available:
 * 1. Claude API (Free tier via Anthropic)
 * 2. Groq API (Free, very fast, no rate limits for educational use)
 * 3. Ollama (Local, completely free)
 * 4. LM Studio (Local, free)
 */

export interface ExtractedQuestion {
  questionNumber: string;
  questionText: string;
  marks: number;
  type: 'SHORT' | 'LONG' | 'MCQ' | 'CASE_STUDY' | 'DESCRIPTIVE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options?: Array<{ label: string; text: string }>;
  correctAnswer?: string;
}

export class AIQuestionExtractionService {
  /**
   * Extract questions using Groq API (Free, fast, no rate limits)
   * Groq is perfect for this - free tier with good limits
   */
  static async extractQuestionsGroq(pdfPath: string): Promise<ExtractedQuestion[]> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not set in .env');
    }

    // Read PDF file
    const fs = await import('fs');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');

    const prompt = `You are an expert at extracting exam questions from PDF documents.

Extract ALL questions from this exam paper and return them as a JSON array.

For each question, provide:
- questionNumber: The question number (e.g., "1", "2a", etc.)
- questionText: The complete question text (cleaned, no OCR errors)
- marks: Total marks for this question
- type: One of SHORT, LONG, MCQ, CASE_STUDY, DESCRIPTIVE
- difficulty: EASY, MEDIUM, or HARD
- options: (if MCQ) Array of {label, text}
- correctAnswer: (if MCQ) The correct option

Return ONLY valid, complete questions. Skip:
- Instructions, headers, footers
- Incomplete questions
- Questions cut off at page boundaries
- Any corrupted or garbled text

Return as valid JSON array only, no other text.

Example format:
[
  {
    "questionNumber": "1",
    "questionText": "Explain in detail the aims and objectives of the Cripps Mission, 1942.",
    "marks": 25,
    "type": "LONG",
    "difficulty": "MEDIUM",
    "options": null,
    "correctAnswer": null
  },
  ...
]`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768', // Free model
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64Pdf}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4096,
          temperature: 0, // Deterministic output
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON response
      const questions = JSON.parse(content);
      return questions;
    } catch (error) {
      console.error('Groq extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract using local Ollama (completely free, privacy-friendly)
   * Setup: ollama pull mistral
   * Then: ollama serve
   */
  static async extractQuestionsOllama(pdfPath: string): Promise<ExtractedQuestion[]> {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

    const fs = await import('fs');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');

    const prompt = `Extract all exam questions from this PDF and return as JSON array.

For each question provide:
- questionNumber
- questionText (cleaned, no errors)
- marks
- type (SHORT/LONG/MCQ/CASE_STUDY/DESCRIPTIVE)
- difficulty (EASY/MEDIUM/HARD)
- options (for MCQ)
- correctAnswer (for MCQ)

Skip incomplete/corrupted questions, instructions, headers.

Return ONLY valid JSON array:`;

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral',
          prompt: prompt,
          images: [base64Pdf],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const jsonStr = data.response;

      // Extract JSON from response
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Ollama response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      return questions;
    } catch (error) {
      console.error('Ollama extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract using Claude API (can use free credits or pay-as-you-go)
   */
  static async extractQuestionsClaudeVision(pdfPath: string): Promise<ExtractedQuestion[]> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in .env');
    }

    const fs = await import('fs');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');

    const prompt = `Extract all questions from this exam paper PDF.

Return a JSON array with:
{
  "questionNumber": string,
  "questionText": string (cleaned),
  "marks": number,
  "type": "LONG" | "SHORT" | "MCQ" | "DESCRIPTIVE",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "options": null | [{label, text}],
  "correctAnswer": null | string
}

Skip incomplete, corrupted, or instruction text.
Return ONLY valid JSON array.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64Pdf,
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const content = data.content[0].text;

      // Parse JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      return questions;
    } catch (error) {
      console.error('Claude extraction error:', error);
      throw error;
    }
  }

  /**
   * Smart selector - use best available API
   */
  static async extractQuestions(pdfPath: string): Promise<ExtractedQuestion[]> {
    // Try in order of preference
    
    // 1. Try Groq (fastest, free, no setup)
    if (process.env.GROQ_API_KEY) {
      console.log('Using Groq API for extraction...');
      return this.extractQuestionsGroq(pdfPath);
    }

    // 2. Try Local Ollama (completely free, privacy)
    if (process.env.OLLAMA_URL) {
      console.log('Using Ollama for extraction...');
      return this.extractQuestionsOllama(pdfPath);
    }

    // 3. Try Claude (if API key available)
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude API for extraction...');
      return this.extractQuestionsClaudeVision(pdfPath);
    }

    throw new Error('No AI extraction API configured. Set GROQ_API_KEY, OLLAMA_URL, or ANTHROPIC_API_KEY');
  }

  /**
   * Batch extract from multiple PDFs
   */
  static async extractFromMultiplePDFs(pdfPaths: string[]): Promise<{
    file: string;
    questions: ExtractedQuestion[];
    error?: string;
  }[]> {
    const results = [];

    for (const pdfPath of pdfPaths) {
      try {
        console.log(`Extracting: ${pdfPath}`);
        const questions = await this.extractQuestions(pdfPath);
        results.push({
          file: pdfPath,
          questions,
        });
      } catch (error) {
        results.push({
          file: pdfPath,
          questions: [],
          error: (error as Error).message,
        });
      }
    }

    return results;
  }
}
