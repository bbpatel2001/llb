import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { QuestionValidationService } from '../services/questionValidationService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analyze Questions Script - Diagnostic tool
 * 
 * This script provides detailed analysis without modifying data:
 * - Loads all questions from JSON files
 * - Runs validation on each
 * - Generates comprehensive statistics
 * - Shows before/after examples
 */

async function analyzeQuestionsFromJSON() {
  const questionDir = path.join(__dirname, '../../..', 'extracted_questions');
  const files = fs
    .readdirSync(questionDir)
    .filter(f => f.endsWith('.json') && !f.includes('backup') && !f.includes('bak'));

  let totalQuestions = 0;
  let validCount = 0;
  let invalidCount = 0;
  let totalQuality = 0;
  const issues = new Map<string, number>();
  const samplesByFile = new Map<string, any[]>();

  console.log('\n📊 QUESTION ANALYSIS REPORT\n');
  console.log('='.repeat(70));

  for (const file of files) {
    try {
      const filePath = path.join(questionDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const questions = JSON.parse(content);

      let fileValid = 0;
      let fileInvalid = 0;
      let fileQuality = 0;
      const fileSamples: any[] = [];

      for (const q of questions) {
        if (q.questionText) {
          totalQuestions++;
          const validation = QuestionValidationService.validateQuestion(q.questionText);

          fileQuality += validation.quality;
          totalQuality += validation.quality;

          if (validation.isValid) {
            fileValid++;
            validCount++;
          } else {
            fileInvalid++;
            invalidCount++;
          }

          // Track issues
          for (const issue of validation.issues) {
            issues.set(issue, (issues.get(issue) || 0) + 1);
          }

          // Collect samples of bad questions
          if (validation.quality < 70 && fileSamples.length < 3) {
            fileSamples.push({
              text: q.questionText.substring(0, 80),
              quality: validation.quality,
              issues: validation.issues,
            });
          }
        }
      }

      samplesByFile.set(file, fileSamples);

      const fileAvgQuality = fileValid + fileInvalid > 0 
        ? Math.round(fileQuality / (fileValid + fileInvalid))
        : 0;

      console.log(`\n📄 ${file}`);
      console.log(`   Total: ${fileValid + fileInvalid} | Valid: ${fileValid} | Invalid: ${fileInvalid}`);
      console.log(`   Average Quality: ${fileAvgQuality}%`);
    } catch (error) {
      console.error(`Error processing ${file}:`, (error as Error).message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📈 OVERALL STATISTICS\n');

  const avgQuality = Math.round(totalQuality / totalQuestions);
  const validPercent = Math.round((validCount / totalQuestions) * 100);
  const invalidPercent = 100 - validPercent;

  console.log(`Total Questions Analyzed: ${totalQuestions}`);
  console.log(`Valid Questions:          ${validCount} (${validPercent}%)`);
  console.log(`Invalid/Garbage:          ${invalidCount} (${invalidPercent}%)`);
  console.log(`Average Quality Score:    ${avgQuality}%`);

  console.log('\n🔍 TOP ISSUES IN GARBAGE QUESTIONS\n');
  const sortedIssues = Array.from(issues.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  sortedIssues.forEach(([issue, count], idx) => {
    const percentage = Math.round((count / invalidCount) * 100);
    console.log(`${idx + 1}. ${issue}: ${count} (${percentage}%)`);
  });

  console.log('\n❌ SAMPLE GARBAGE QUESTIONS BY FILE\n');
  for (const [file, samples] of samplesByFile) {
    if (samples.length > 0) {
      console.log(`${file}:`);
      samples.forEach((sample, idx) => {
        console.log(`  ${idx + 1}. [Quality: ${sample.quality}%]`);
        console.log(`     "${sample.text}..."`);
        console.log(`     Issues: ${sample.issues.join(', ')}`);
      });
      console.log();
    }
  }

  console.log('='.repeat(70));
  console.log('\n✅ SUMMARY\n');
  console.log(`If you run cleanup with threshold of 65%:`);
  console.log(`  • ${invalidCount} garbage questions will be removed`);
  console.log(`  • ${validCount} clean questions will be kept`);
  console.log(`  • Cleanup rate: ${invalidPercent}%`);
  console.log();
  console.log(`To apply: npm run clean:garbage:apply`);
  console.log();
}

analyzeQuestionsFromJSON().catch(console.error);
