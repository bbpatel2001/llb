import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { CaseLaw } from '../models/CaseLaw';
import { caseLaws } from '../data/caseLaws';

async function seedCaseLaws(): Promise<void> {
  await connectDB();

  try {
    const result = await CaseLaw.bulkWrite(
      caseLaws.map((caseLaw) => ({
        updateOne: {
          filter: { citation: caseLaw.citation },
          update: { $setOnInsert: caseLaw },
          upsert: true,
        },
      })),
    );

    console.log(`Case-law seed complete: ${result.upsertedCount} inserted, ${result.matchedCount} already present.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedCaseLaws().catch((error: unknown) => {
  console.error('Case-law seed failed:', error);
  process.exitCode = 1;
});
