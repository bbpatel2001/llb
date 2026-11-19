import { connectDB, disconnectDB } from '../config/database';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';

const ids = [
  '6af1cfa92c60cc5e40b43b02', '6af1cfa92c60cc5e40b43b09', '6af1cfa92c60cc5e40b43b10', '6af1cfa92c60cc5e40b43b16',
  '6af1d5f5fde931251f91be78', '6af1cfa92c60cc5e40b43b1b', '6af1cfa92c60cc5e40b43b21', '6af1cfa92c60cc5e40b43b24', '6af1cfa92c60cc5e40b43b27',
  '6af1e5676710e76a2e65509d', '6af1e5676710e76a2e6550a5', '6af1e5676710e76a2e6550ac', '6af1e5676710e76a2e6550b2', '6af1e5676710e76a2e6550b6', '6af1e5676710e76a2e6550b9', '6af1e5676710e76a2e6550bc', '6af1e5676710e76a2e6550bf',
  '6af2d4029d1366d1be84303d', '6af2d4029d1366d1be843045', '6af2d4029d1366d1be84304c', '6af2d4029d1366d1be843051', '6af2d4029d1366d1be843056', '6af2d4029d1366d1be843059',
  '6af1b720a6ec6a965d4bc99c', '6af1b720a6ec6a965d4bc9a5', '6af1b720a6ec6a965d4bc9ae',
  '6af1b721a6ec6a965d4bc9c0', '6af1b721a6ec6a965d4bc9c9', '6af1b721a6ec6a965d4bc9db', '6af1b721a6ec6a965d4bc9e4', '6af1b721a6ec6a965d4bc9ed',
];

async function main() {
  await connectDB();
  try {
    const questions = await Question.find({ _id: { $in: ids } }).lean();
    const answers = await Answer.find({ questionId: { $in: ids } }).select('questionId language type targetMarks wordCount').lean();
    for (const question of questions) {
      const records = answers
        .filter((answer) => String(answer.questionId) === String(question._id))
        .map((answer) => `${answer.language || 'x'}:${answer.type}:${answer.targetMarks || 'unmarked'}:${answer.wordCount}`);
      console.log(JSON.stringify({ id: String(question._id), question: question.questionText, answers: records }));
    }
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
