import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper } from '../models/Paper';
dotenv.config();
(async () => { await connectDB(); try { console.log(JSON.stringify(await Paper.find({ semester: 1, subject: { $in: ['CONSTITUTIONAL','CONTRACT','CRIMINAL','Foundation-106F Constitutional History of India'] } }).select('subject title fileName').lean(), null, 2)); } finally { await disconnectDB(); } })().catch((error) => { console.error(error); process.exitCode = 1; });
