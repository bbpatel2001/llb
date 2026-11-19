import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper, Question } from '../models/index';
dotenv.config();
(async () => { await connectDB(); try { console.log(JSON.stringify({ papers: await Paper.distinct('subject', { semester: 1 }), questions: await Question.distinct('subject', { semester: 1 }) }, null, 2)); } finally { await disconnectDB(); } })().catch((error) => { console.error(error); process.exitCode = 1; });
