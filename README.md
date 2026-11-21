# Bhool Map

**Find the wrong idea behind the wrong answer.**
Built by **Team Vanta** for Prasunex Innovathon 2026.

## The problem
A teacher with 40-60 students sees red crosses, not the wrong belief behind them. A student who writes 1/2 + 1/3 = 2/5 isn't careless. They are adding tops and bottoms, and many classmates likely do the same. Marking never shows that pattern.

## The idea
Every misconception is stored as a small **buggy rule**. For a student's answer, Bhool Map applies every buggy rule to the same problem. The rule that reproduces the wrong answer is the diagnosis. Results are explainable and checkable, and no AI call is needed to judge correctness.

## Features
- 3 problem types (fractions, integers, linear equations) with 11 misconception rules
- Answer analyser: correct / one rule fits (high confidence) / several fit (medium) / none fit
- Replay table showing every rule's result, with the match highlighted
- 3-minute reteach tip for each misconception
- Class map computed live from 12 sample students x 3 problems
- Teacher taps to resolve ambiguous answers; the map updates
- "Reteach to everyone" and "Small group" suggestions, with peer pairing
- Runs fully in the browser; no data leaves the page

## Tech stack
Next.js (App Router), TypeScript, Tailwind CSS. The rule engine is plain functions in `lib/engine.ts`; the UI is in `app/page.tsx`. Adding a misconception means adding one object to the rules list.

## Run locally
```bash
npm install
npm run dev
# open http://localhost:3000
```

## Limitations
- Answers are typed, not read from notebook photos
- Checks the final answer, not each written step
- Class data is sample data; nothing is saved
- English interface only
- Teacher feedback taps are counted but do not retrain anything yet

## Future development
1. Photo capture and step extraction (vision model + OCR) with a confirm-steps screen
2. Multi-step matching, so each line of working is diagnosed
3. Backend (FastAPI + PostgreSQL) with saved student fingerprints and progress over time
4. Hindi and regional languages
5. Library growth from teacher labels
6. Pilot in 3-5 classrooms, measuring precision and teacher time saved
