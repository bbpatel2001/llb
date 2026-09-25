# Quick Fix: Remove Duplicate Questions

## TL;DR - Do This Now

```bash
cd backend
npm run reextract:questions -- --confirm
```

This will:
1. Load all questions from `extracted_questions/*.json`
2. Clean question text (remove marks, OR sections, artifacts)
3. Remove duplicates (keeping the first occurrence)
4. Re-insert into database

Takes ~1-2 minutes.

## Before & After

**BEFORE:**
```
Question 1: "Explain in detail the aims and objectives of the Cripps Mission, 1942. 20 I"
Question 2: "Explain in detail the aims and objectives of the Cripps Mission, 1942. 25 s OR..."
```
(These look like 2 different questions but are actually the same)

**AFTER:**
```
Question: "Explain in detail the aims and objectives of the Cripps Mission, 1942."
```
(Only one, clean, properly formatted)

## What Gets Cleaned

- ✅ Removes trailing marks: "20", "25", "100"
- ✅ Removes trailing characters: "s", "w", "a", "b"
- ✅ Removes " OR" sections and alternative questions
- ✅ Removes extraction artifacts
- ✅ Normalizes whitespace

## Verification

After running, check:

```bash
# Should show 0 duplicates
curl http://localhost:3000/api/content/duplicates

# Should show clean questions
curl http://localhost:3000/api/quizzes/questions?semester=1&subject=CONSTITUTIONAL
```

## If Something Goes Wrong

The script backs up nothing (by design). But you can restore from the JSON files:

```bash
# Rerun the script to reload from source
npm run reextract:questions -- --confirm
```

## Need More Info?

See `DUPLICATE_QUESTION_FIX.md` for detailed explanation.
