# PurrfectHire

Minimal recruiting decision workspace for structured technical interviews.

## Product goal

PurrfectHire is not an interview script. It turns role-specific scorecards into a decision system with:

- Separate Technical and Operating / Cultural scores.
- 50 / 50 contribution to the overall score.
- Role-specific internal weights.
- Hard gates that can force Reject.
- Explicit `Not evaluated` states that force Hold when critical information is missing.
- Required candidate conditions such as interest, compensation, availability and role logistics.
- A live Present / Hold / Reject recommendation.
- Interview prompts that expand only when needed.
- Candidate brief copy-out without inventing qualitative evidence.

## Current calibration

A candidate is:

- **Reject** when a hard gate fails or a non-negotiable logistics condition is false.
- **Hold** when a hard gate / required condition is unknown, or the calibrated score bar is not reached.
- **Present** when every hard gate and required condition passes, Technical and Operating are each at least `3.8 / 5`, and Overall is at least `4.0 / 5`.

These score thresholds are intentionally isolated in `lib/scoring.ts` so they can be recalibrated after real interview data.

## Role weights

### ProSights — CTO

Technical: Architecture 30%, Hands-on Engineering 25%, Product / Technical Judgment 25%, AI / Enterprise Systems 20%.

Operating: Founder / Builder Ownership 30%, Customer-facing Judgment 25%, Leadership & Hiring 20%, Startup / 0→1 15%, Founder-level Motivation 10%.

### Casa Health — Founding Engineer

Technical: Production AI 30%, Hands-on Shipping 22%, Architecture 20%, Healthcare / RCM or exceptional transferable depth 18%, Integrations 10%.

Operating: Founding Engineer Ownership 35%, Startup / Ambiguity 25%, Product Thinking 20%, Direct CEO Collaboration 10%, AI + Healthcare Motivation 10%.

### Optery — Senior Backend Engineer

Technical: Python / Django 35%, Backend Architecture & Production Ownership 22%, PostgreSQL / Performance 16%, Distributed / Async Systems 12%, Problem Solving 12%, AI Tool Fluency 3%.

Operating: Autonomy / Ownership 45%, Remote / Async Communication 35%, Constructive Disagreement / Collaboration 20%.

## Stack

- Next.js + TypeScript
- Tailwind CSS v4 foundation plus custom design tokens / CSS
- Supabase / PostgreSQL schema
- Vercel target deployment

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The current prototype persists assessment changes to `localStorage`. This makes the interaction testable before a Supabase project is connected.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
5. Connect server-side persistence. Browser-direct table access should remain blocked; RLS is enabled with no public policies in the initial schema.

## Next product step

Replace demo candidates and browser-only persistence with server-side Supabase CRUD, then add candidate creation / editing and Vercel deployment.
