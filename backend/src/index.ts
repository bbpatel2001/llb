/**
 * LLB Knowledge Platform - Backend API
 * Entry point for the Express server
 */

import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDB, getDBStatus } from "./config/database";
import { Paper, Question } from "./models/index";
import contentRoutes from "./routes/content";
import answerRoutes from "./routes/answers";
import quizRoutes from "./routes/quizzes";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import studyRoutes from "./routes/study";
import syllabusRoutes from "./routes/syllabi";
import lawMappingRoutes from "./routes/lawMapping";
import articleRoutes from "./routes/articles";
import blogRoutes from "./routes/blogs";
import { requestContext, rateLimit, validatePaginationQuery } from "./middleware/security";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 6000;  // Backend on 6000
const UNREADABLE_QUESTION_PATTERN = new RegExp(`[${String.fromCodePoint(0xe000)}-${String.fromCodePoint(0xf8ff)}${String.fromCodePoint(0xfffd)}]`);
const READABLE_QUESTION_FILTER = {
  $and: [
    { questionText: { $not: UNREADABLE_QUESTION_PATTERN } },
    { questionText: { $regex: '\\p{L}' } },
  ],
};

function escapeRegex(value: string): string {
  return value.replace(/[^\w\s-]/g, "\\$&");
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Request identity, bounded query parameters, and a conservative process-local API limiter.
app.use(requestContext);
app.use(rateLimit({ windowMs: 60_000, max: 300, name: 'api' }));
app.use('/api', validatePaginationQuery);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:6001",
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "256kb", extended: false, parameterLimit: 100 }));

// ============================================================================
// ROUTES - Authentication
// ============================================================================
app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, max: 30, name: 'auth', key: (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase().slice(0, 120)}` }), authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/syllabi", syllabusRoutes);
app.use("/api/law-mappings", lawMappingRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/blogs", blogRoutes);

// ============================================================================
// ROUTES - Content Generation
// ============================================================================
app.use("/api/content", contentRoutes);

// ============================================================================
// ROUTES - Answers
// ============================================================================
app.use("/api/answers", answerRoutes);

// ============================================================================
// ROUTES - Quizzes
// ============================================================================
app.use("/api/quizzes", quizRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: getDBStatus(),
  });
});

// API documentation
app.get("/api", (_req: Request, res: Response) => {
  res.json({
    message: "LLB Knowledge Platform API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      papers: "GET /api/papers",
      "/api/papers/:id/questions": "GET",
      questions: "GET /api/questions",
      stats: "GET /api/stats",
      plugins: "GET /api/plugins",
    },
  });
});

// Get all papers
app.get("/api/papers", async (req: Request, res: Response) => {
  try {
    const { semester, subject, skip = 0, limit = 20 } = req.query;
    
    const query: any = {};
    if (semester) query.semester = parseInt(semester as string);
    if (subject) query.subject = (subject as string).toUpperCase();

    const papers = await Paper.find(query)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string));
    
    const total = await Paper.countDocuments(query);

    res.json({
      papers,
      total,
      page: Math.floor(parseInt(skip as string) / parseInt(limit as string)) + 1,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get one paper's questions
app.get("/api/papers/:paperId/questions", async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.paperId)) {
      return res.status(400).json({ error: "Invalid paper ID" });
    }
    const { skip = 0, limit = 100 } = req.query;
    let query: any = { paperId: req.params.paperId, ...READABLE_QUESTION_FILTER };
    let questions = await Question.find(query)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ questionNumber: 1 });
    let total = await Question.countDocuments(query);

    // Imported PDF questions may not have a direct paperId. Fall back to the
    // paper's semester/subject so every paper still opens its relevant bank.
    if (total === 0) {
      const paper = await Paper.findById(req.params.paperId).lean();
      if (paper) {
        query = { semester: paper.semester, subject: paper.subject, ...READABLE_QUESTION_FILTER };
        questions = await Question.find(query)
          .skip(parseInt(skip as string))
          .limit(parseInt(limit as string))
          .sort({ questionNumber: 1 });
        total = await Question.countDocuments(query);
      }
    }
    return res.json({ questions, total });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Get one paper
app.get("/api/papers/:paperId", async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.paperId)) {
      return res.status(400).json({ error: "Invalid paper ID" });
    }
    const paper = await Paper.findById(req.params.paperId);
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }
    return res.json(paper);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Get all questions with semester, subject, type, and text filters
app.get("/api/questions", async (req: Request, res: Response) => {
  try {
    const { semester, subject, type, search, skip = 0, limit = 50 } = req.query;
    const query: any = { ...READABLE_QUESTION_FILTER };
    if (semester) query.semester = parseInt(semester as string);
    if (subject) query.subject = (subject as string).toUpperCase();
    if (type) query.type = (type as string).toUpperCase();
    if (search) {
      query.$or = [
        { questionText: { $regex: escapeRegex(search as string).slice(0, 200), $options: "i" } },
        { tags: { $regex: escapeRegex(search as string).slice(0, 200), $options: "i" } },
      ];
    }
    const offset = parseInt(skip as string);
    const pageSize = Math.min(parseInt(limit as string), 100);
    const [questions, total] = await Promise.all([
      Question.find(query).skip(offset).limit(pageSize).sort({ semester: 1, subject: 1, questionNumber: 1 }),
      Question.countDocuments(query),
    ]);
    res.json({ questions, total, page: Math.floor(offset / pageSize) + 1 });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/questions/filters", async (_req: Request, res: Response) => {
  try {
    const subjects = await Question.distinct("subject", { ...READABLE_QUESTION_FILTER, subject: { $nin: [null, ""] } });
    res.json({ semesters: [1, 2, 3, 4, 5, 6], subjects: subjects.sort() });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get one question
app.get("/api/questions/:questionId", async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.questionId)) {
      return res.status(400).json({ error: "Invalid question ID" });
    }
    const question = await Question.findOne({ _id: req.params.questionId, ...READABLE_QUESTION_FILTER });
    if (!question) return res.status(404).json({ error: "Question not found" });
    return res.json({ question });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Get questions by semester
app.get("/api/questions/semester/:semester", async (req: Request, res: Response) => {
  try {
    const { semester } = req.params;
    const { subject, type, skip = 0, limit = 50 } = req.query;

    const query: any = { semester: parseInt(semester), ...READABLE_QUESTION_FILTER };
    if (subject) query.subject = (subject as string).toUpperCase();
    if (type) query.type = (type as string).toUpperCase();

    const questions = await Question.find(query)
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ questionNumber: 1 });

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      total,
      semester: parseInt(semester),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get statistics
app.get("/api/stats", async (_req: Request, res: Response) => {
  try {
    const totalPapers = await Paper.countDocuments();
    const totalQuestions = await Question.countDocuments(READABLE_QUESTION_FILTER);
    
    const byType = await Question.aggregate([
      { $match: READABLE_QUESTION_FILTER },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const bySemester = await Question.aggregate([
      { $match: READABLE_QUESTION_FILTER },
      { $group: { _id: "$semester", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const bySubject = await Question.aggregate([
      { $match: READABLE_QUESTION_FILTER },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalPapers,
      totalQuestions,
      byType: Object.fromEntries(byType.map((x: any) => [x._id, x.count])),
      bySemester: Object.fromEntries(bySemester.map((x: any) => [x._id, x.count])),
      bySubject: Object.fromEntries(bySubject.map((x: any) => [x._id, x.count])),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================================================
// PLUGIN SYSTEM INITIALIZATION - DISABLED
// ============================================================================
// Plugins are kept in backend but not initialized during server startup
// They can be added later without blocking the main server

// ============================================================================
// SERVER START
// ============================================================================

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`LLB Knowledge Platform - Backend Server`);
      console.log(`${"=".repeat(60)}`);
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✓ API: http://localhost:${PORT}/api`);
      console.log(`✓ Database: ${getDBStatus()}`);
      console.log(`${"=".repeat(60)}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
