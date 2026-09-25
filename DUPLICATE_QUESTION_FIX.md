# Duplicate Questions Fix & Re-extraction Guide

## Problem Identified

Questions in the database have duplicate entries with slight variations in text:

**Example:**
- "Explain in detail the aims and objectives of the Cripps Mission, 1942. 20"
- "Explain in detail the aims and objectives of the Cripps Mission, 1942. 25 s OR Explain in detail the Final Draft and procedure..."

The core question is the same, but extraction artifacts (marks, "OR", extra text) make them appear different.

### Root Causes

1. **Extraction artifacts**: Marks (20, 25) appended to question text
2. **OR questions**: Alternative questions merged into single text
3. **Trailing characters**: Single letters (a, b, s, w) from document processing
4. **Multiple papers**: Same question appears in different papers with minor variations

## Solution Architecture

### Three-Layer Approach

#### 1. **Deduplication Service** (Prevention)
- `QuestionDeduplicationService` - Intelligent duplicate detection
- Normalizes question text before comparison
- Prevents duplicates during question insertion

#### 2. **Data Cleaning** (Re-extraction)
- `reextractQuestionsClean.ts` script
- Loads all questions from `extracted_questions/*.json`
- Cleans text aggressively
- Deduplicates
- Re-inserts into database

#### 3. **Pre-save Hook** (Database Level)
- Mongoose pre-save hook on Question model
- Automatically cleans question text before saving
- Removes trailing marks, OR sections, artifacts

## Usage

### Option A: Re-extract Questions (Recommended First Time)

This completely rebuilds the question database from the JSON files with proper cleaning.

```bash
cd backend

# First: Check what duplicates would be found
npm run reextract:questions

# Then: Actually perform the re-extraction
npm run reextract:questions -- --confirm
```

### Option B: API-Based Duplicate Cleanup

For production environments, use the REST endpoints:

```bash
# Find all duplicates
curl http://localhost:3000/api/content/duplicates

# Remove duplicates (keep first occurrence)
curl -X POST http://localhost:3000/api/content/duplicates/cleanup
```

## How Text Cleaning Works

### Examples

| Original | Cleaned |
|----------|---------|
| `1. Explain the Cripps Mission, 1942. 20` | `Explain the Cripps Mission, 1942.` |
| `2. Main provisions of Government of India Act, 1935. 25 s OR Explain other topics. w` | `Main provisions of Government of India Act, 1935.` |
| `3. Indian Independence Act, 1947. 20 R` | `Indian Independence Act, 1947.` |

### Cleaning Pipeline

1. Remove leading question numbers (1., Q1., etc.)
2. Remove trailing marks (20, 25, 100)
3. Remove " OR" and everything after
4. Remove trailing single letters (extraction artifacts)
5. Handle complex patterns (punctuation + marks + letters)
6. Normalize whitespace
7. Clean up extra periods

### Normalization for Deduplication

- Convert to lowercase
- Apply all cleaning rules
- Use as unique key

## Service API

### QuestionDeduplicationService

```typescript
// Check if question is duplicate
const duplicate = await QuestionDeduplicationService.findDuplicate(
  questionText,
  paperId // optional
);

// Get all duplicates
const groups = await QuestionDeduplicationService.findAllDuplicateGroups();

// Remove all duplicates (keep first)
const result = await QuestionDeduplicationService.removeDuplicates();
// Returns: { duplicateGroupsFound, questionsRemoved, duplicateIds }

// Normalize text for comparison
const normalized = QuestionDeduplicationService.normalizeQuestionText(text);

// Clean text for storage
const cleaned = QuestionDeduplicationService.cleanQuestionText(text);
```

## Files Created/Modified

### New Files
- `backend/src/services/questionDeduplicationService.ts` - Deduplication service
- `backend/src/scripts/reextractQuestionsClean.ts` - Re-extraction script
- `backend/src/scripts/deduplicateQuestions.ts` - Audit script

### Modified Files
- `backend/src/models/Question.ts` - Added pre-save hook
- `backend/src/services/questionService.ts` - Uses deduplication service
- `backend/src/routes/content.ts` - Added duplicate detection endpoints
- `backend/package.json` - Added reextract:questions script

## Verification

After running the re-extraction:

1. **No duplicates remain**: Check database
   ```
   db.questions.aggregate([
     { $group: { _id: '$questionText', count: { $sum: 1 } } },
     { $match: { count: { $gt: 1 } } }
   ])
   ```
   Should return 0 results.

2. **Questions properly cleaned**: Check a few questions
   ```
   db.questions.findOne()
   // questionText should NOT end with numbers or single letters
   ```

3. **Frontend shows no duplicates**: Open questions page, verify no same questions appear

## Next Steps

1. **Run the re-extraction**
   ```bash
   cd backend
   npm run reextract:questions -- --confirm
   ```

2. **Verify the results**
   - Check database for remaining duplicates
   - Check frontend for duplicate display

3. **Optional: Setup deduplication in extraction pipeline**
   - Modify the extraction code to use `QuestionDeduplicationService`
   - This prevents duplicates from being created in future extractions

## Troubleshooting

### Issue: Script fails to connect to database
- Check `.env` file for `MONGODB_URI`
- Ensure MongoDB is running
- Verify connection string format

### Issue: Some duplicates still remain
- May need to refine the cleaning rules
- Check if questions are truly duplicates or legitimately different
- Contact team for manual review

### Issue: Frontend still shows duplicates after re-extraction
- Clear browser cache and reload
- Restart backend server
- Check if frontend is fetching from correct endpoint

## Monitoring

To prevent future duplicates:

1. **Before insertion**: Use `findDuplicate()` to check
2. **Pre-save hook**: Automatically cleans text
3. **Periodic audit**: Run deduplication report monthly

```bash
npm run reextract:questions  # Shows duplicate report without modifying DB
```

## References

- Question Model: `backend/src/models/Question.ts`
- Question Service: `backend/src/services/questionService.ts`
- Content Routes: `backend/src/routes/content.ts`
- Deduplication Service: `backend/src/services/questionDeduplicationService.ts`
