import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Question } from '../models/Question';

dotenv.config();

// Curated same-topic/repeated-question groups identified across the supplied
// Semester 1 tort-law papers. Links are reciprocal so every question shows
// the other exam wordings in its Repeated Questions section.
const groups = [
  // Vicarious liability
  ['6af1b720a6ec6a965d4bc9a5', '6af1d5f5fde931251f91be78', '6af1e5676710e76a2e65509d', '6af2d4029d1366d1be84304c'],
  // Discharge / exemption from tort liability
  ['6af1cfa92c60cc5e40b43b09', '6af1e5676710e76a2e6550ac', '6af2d4029d1366d1be843045'],
  // Defamation and libel/slander defences
  ['6af1b721a6ec6a965d4bc9b7', '6af1cfa92c60cc5e40b43b16', '6af1e5676710e76a2e6550b2', '6af2d4029d1366d1be843051'],
  // Hit-and-run compensation
  ['6af1b721a6ec6a965d4bc9c0', '6af1cfa92c60cc5e40b43b24', '6af1e5676710e76a2e6550bf', '6af2d4029d1366d1be843059'],
  // Consumer dispute
  ['6af1b721a6ec6a965d4bc9d2', '6af1e5676710e76a2e6550bf'],
  // Consumer Protection Act objectives
  ['6af1b721a6ec6a965d4bc9c9', '6af2d4029d1366d1be843059'],
  // Third-party risk / owner liability / insurance
  ['6af1b721a6ec6a965d4bc9e4', '6af1cfa92c60cc5e40b43b1b', '6af1e5676710e76a2e6550bc', '6af2d4029d1366d1be843059'],
  // Inevitable accident
  ['6af1b721a6ec6a965d4bc9ed', '6af1cfa92c60cc5e40b43b27'],
  // Definition and essential elements of tort
  ['6af1cfa92c60cc5e40b43b02', '6af2d4029d1366d1be84303d'],
  // Absolute liability / hazardous-activity liability
  ['6af1b720a6ec6a965d4bc9ae', '6af1e5676710e76a2e6550b9'],
];

async function main() {
  await connectDB();
  try {
    const allIds = [...new Set(groups.flat())];
    const existing = await Question.find({ _id: { $in: allIds } }).select('_id').lean();
    const existingIds = new Set(existing.map((question) => String(question._id)));
    let updatedQuestions = 0;
    let skippedGroups = 0;

    for (const group of groups) {
      const validIds = group.filter((id) => existingIds.has(id));
      if (validIds.length < 2) {
        skippedGroups += 1;
        continue;
      }
      for (const id of validIds) {
        const related = validIds.filter((otherId) => otherId !== id);
        const result = await Question.updateOne(
          { _id: id },
          { $addToSet: { relatedQuestionIds: { $each: related } } },
        );
        updatedQuestions += result.modifiedCount;
      }
    }

    console.log(JSON.stringify({
      groupsProcessed: groups.length,
      groupsWithLinks: groups.length - skippedGroups,
      questionsUpdated: updatedQuestions,
      linkedQuestionIds: allIds.length,
    }, null, 2));
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
