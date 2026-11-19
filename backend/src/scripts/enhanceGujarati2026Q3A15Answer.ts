import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Answer } from '../models/Answer';

dotenv.config();
const questionId = '6af1be53286aaeb0b7d420ee';
(async()=>{await connectDB(); try{const a:any=await Answer.findOne({questionId,targetMarks:15,language:'gu'}); if(!a) throw new Error('Gujarati answer not found'); a.wordCount=String(a.text).split(/\s+/).filter(Boolean).length; a.reviewStatus='review_required'; await a.save(); console.log(JSON.stringify({language:'gu',wordCount:a.wordCount}));}finally{await disconnectDB();}})().catch(e=>{console.error(e);process.exitCode=1;});
