import { createHash, randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Syllabus } from '../models/Syllabus';
import { structuredSyllabi } from '../data/gujaratUniversityLlb2026';

const SOURCE_FILE_NAME = 'gujarat-university-llb-2026-27-structured-outline.json';

async function seedGujaratUniversityLlb(): Promise<void> {
  await connectDB();

  try {
    const owner = await User.findOne({ active: true, role: 'admin' }).select('_id').lean()
      || await User.findOne({ active: true }).select('_id').lean()
      || await User.findOne({ email: 'system-syllabus@local.invalid' }).select('_id').lean()
      || await User.create({
        name: 'Syllabus Import System',
        email: 'system-syllabus@local.invalid',
        passwordHash: randomBytes(32).toString('hex'),
        role: 'admin',
        active: false,
        verified: true,
      });

    let inserted = 0;
    let updated = 0;
    for (const record of structuredSyllabi) {
      const sourceSha256 = createHash('sha256')
        .update(JSON.stringify({ ...record, source: undefined }))
        .digest('hex');
      const payload = {
        ...record,
        version: 1,
        status: 'published' as const,
        source: { format: 'json' as const, fileName: SOURCE_FILE_NAME, sha256: sourceSha256 },
        createdBy: owner._id,
        publishedAt: new Date(),
      };
      const existing = await Syllabus.findOne({ syllabusKey: record.syllabusKey, version: 1 }).select('_id').lean();
      if (existing) {
        await Syllabus.updateOne({ _id: existing._id }, { $set: payload });
        updated += 1;
      } else {
        await Syllabus.create(payload);
        inserted += 1;
      }
    }

    console.log(`Gujarat University LL.B. syllabus seed complete: ${inserted} inserted, ${updated} updated, ${structuredSyllabi.length} courses total.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedGujaratUniversityLlb().catch((error: unknown) => {
  console.error('Gujarat University LL.B. syllabus seed failed:', error);
  process.exitCode = 1;
});
