# PRISM (PR Intelligence System Mechanism)

PRISM is an AI-powered pull request intelligence system that helps reviewers understand a GitHub PR before they enter the diff. It converts a public PR URL into a structured review briefing with risk scoring, impact mapping, critical files, review strategy, blind spots, and ready-to-use review comments.

The app is built as a production-oriented Next.js application with custom email OTP authentication, Supabase Postgres history storage, and pluggable AI providers.

## Problem

Modern pull requests are often difficult to review efficiently because reviewers need to manually answer several questions before they can make useful comments:

- What is this PR actually changing?
- Which files or domains are most risky?
- Are there security, API, dependency, or test coverage concerns?
- Where should the reviewer start?
- What might be easy to miss?
- How should the review be structured?

Traditional code review tools show the diff, but they do not provide enough context, prioritization, or reasoning. This creates slow reviews, missed edge cases, shallow approvals, and inconsistent feedback quality.

## Solution

PRISM acts as an intelligence layer on top of GitHub pull requests.

A user signs in with email OTP, pastes a public GitHub PR URL, and receives a visual analysis report. The report combines deterministic heuristics with LLM reasoning to produce a typed, structured review briefing.

PRISM currently provides:

- Email OTP authentication using local SMTP.
- Per-user saved PR analysis history.
- GitHub PR metadata, file, review, and comment fetching.
- Deterministic risk heuristics.
- LLM-powered semantic analysis.
- Structured JSON output rendered as a modern dark UI.
- Executive briefing with primary impact, starting point, watch file, and risk level.
- Impact map grouped by likely affected areas.
- Review strategy and reviewer blind spots.
- Critical files and generated review comments.

## Architecture

```text
User
  |
  v
Next.js App Router UI
  |
  |-- /api/auth/request-otp
  |     Generates OTP, stores hashed OTP, sends email via SMTP
  |
  |-- /api/auth/verify-otp
  |     Verifies OTP, creates/loads user, sets HTTP-only session cookie
  |
  |-- /api/auth/session
  |     Reads current user from session cookie
  |
  |-- /api/analyze-pr
  |     Parses PR URL
  |     Fetches GitHub PR data
  |     Runs heuristic engine
  |     Builds AI prompt
  |     Calls selected AI provider
  |     Parses structured output
  |     Stores report in Supabase
  |
  |-- /api/history
        Loads saved analyses for the signed-in user

Supabase Postgres
  |
  |-- users
  |-- email_otps
  |-- user_sessions
  |-- pr_analyses

External Services
  |
  |-- GitHub REST API
  |-- SMTP provider / Gmail App Password
  |-- Groq / OpenAI / Claude / Gemini
```

## System Flow

1. User enters email.
2. Server generates a 6-digit OTP.
3. OTP is hashed and stored in Supabase Postgres with an expiry.
4. OTP email is sent through SMTP.
5. User verifies the OTP.
6. Server creates a user session and stores a hashed session token.
7. Browser receives an HTTP-only session cookie.
8. User submits a GitHub PR URL.
9. Server fetches PR metadata, changed files, reviews, and review comments.
10. Heuristic engine extracts deterministic risk signals.
11. Prompt builder sends PR context and signals to the selected AI provider.
12. AI output is parsed into a typed report.
13. Report is saved to the user's history.
14. UI renders the report as a structured review briefing.

## Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API routes
- Node.js runtime
- Custom OTP authentication
- HTTP-only session cookies
- Nodemailer SMTP integration

### Database

- Supabase Postgres
- Tables:
  - `users`
  - `email_otps`
  - `user_sessions`
  - `pr_analyses`

### AI Providers

PRISM supports multiple providers through `AI_PROVIDER`:

- Groq
- OpenAI
- Anthropic Claude
- Google Gemini

### External APIs

- GitHub REST API
- SMTP provider such as Gmail SMTP, Resend SMTP, Brevo, or SendGrid

## Folder Structure

```text
app/
  api/
    analyze-pr/route.ts       Main PR analysis pipeline
    history/route.ts          User analysis history
    auth/
      request-otp/route.ts    Generate and email OTP
      verify-otp/route.ts     Verify OTP and create session
      session/route.ts        Current user endpoint
      logout/route.ts         Clear session
  globals.css                 Global dark UI background
  layout.tsx                  Metadata and root layout
  page.tsx                    Main application page

components/
  AuthPanel.tsx               Email OTP UI
  PRInput.tsx                 GitHub PR URL input
  HistoryList.tsx             Saved analysis history
  ReportCard.tsx              Report layout
  ExecutiveBriefing.tsx       Top-level report summary
  MetaBanner.tsx              PR metadata
  RiskMeter.tsx               Risk score card
  SummarySection.tsx          Semantic summary
  ImpactMap.tsx               Impact grouping
  ReviewStrategy.tsx          Review plan
  ReviewConcerns.tsx          Existing PR review context
  CriticalFiles.tsx           Critical file list
  AutoComments.tsx            Generated comments
  BlindSpots.tsx              Missed-review risks
  DependencyImpact.tsx        Downstream impact
  LoadingState.tsx            Loading UI
  ErrorState.tsx              Error UI

lib/
  auth.ts                     OTP, SMTP, and session helpers
  supabase.ts                 Supabase admin client and DB types
  parser.ts                   GitHub PR URL parser
  github.ts                   GitHub API fetching
  heuristics.ts               Deterministic risk engine
  prompt.ts                   LLM prompt builder
  ai/
    index.ts                  Provider router
    schemas.ts                AI output schema
    groq.ts
    openai.ts
    claude.ts
    gemini.ts

supabase/
  schema.sql                  Database schema

types/
  index.ts                    Shared TypeScript interfaces
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

Required variables:

```env
GITHUB_TOKEN=

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="PRISM Support <your-email@example.com>"

AUTH_SESSION_SECRET=

AI_PROVIDER=groq
GROQ_API_KEY=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

### 3. Generate Session Secret

```bash
openssl rand -base64 32
```

Use the output as:

```env
AUTH_SESSION_SECRET=your-generated-secret
```

### 4. Configure Supabase

Create a Supabase project and run:

```sql
supabase/schema.sql
```

Run the file in Supabase SQL Editor.

Use:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key.

Important: the service role key must remain server-side only. Do not expose it with a `NEXT_PUBLIC_` prefix.

### 5. Configure SMTP

For Gmail SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM="PRISM Support <your-email@gmail.com>"
```

Use a Gmail App Password, not your normal Gmail password.

### 6. Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Deployment

The project is designed to deploy on Vercel.

Steps:

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add all required environment variables in Vercel Project Settings.
4. Run the Supabase schema in your Supabase project.
5. Deploy.

For production, make sure:

- `AUTH_SESSION_SECRET` is strong and stable.
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser.
- SMTP credentials are configured as server-side environment variables.
- GitHub token is configured to avoid low unauthenticated rate limits.

## Current Capabilities

### Authentication

PRISM uses custom email OTP authentication:

- Server generates a 6-digit OTP.
- OTP is hashed before storing.
- OTP expires after 10 minutes.
- Verified users receive an HTTP-only session cookie.
- Sessions are stored as hashed tokens in the database.

### PR Analysis

PRISM analyzes:

- PR metadata
- Changed files
- Additions and deletions
- Review comments
- Review states
- File paths and affected domains
- Heuristic risk signals
- LLM-generated semantic interpretation

### Saved History

Every completed analysis is stored per user and can be re-opened from the history panel.

## Future Improvements

### Full Repository Knowledge Graph

Add a repo-level knowledge graph that maps the whole codebase as connected nodes:

- Files
- Classes
- Functions
- API routes
- Database tables
- Services
- Call relationships
- Dependency edges
- Test coverage links
- Ownership areas

This would allow PRISM to understand not only what changed in a PR, but what those changes connect to across the repository.

Possible graph-powered features:

- Identify downstream files impacted by a changed function.
- Detect changed APIs and all consumers.
- Show which tests should be run.
- Highlight hidden dependency chains.
- Detect high-risk central modules.
- Build a visual repo map for reviewers.

### Suggested Code Changes

Extend PRISM from analysis to assisted remediation:

- Suggest safer implementations.
- Recommend missing tests.
- Generate patch suggestions.
- Detect risky patterns and propose alternatives.
- Suggest refactors for duplicated or fragile logic.
- Generate review comments with code snippets.

### Private Repository Support

Add GitHub OAuth or GitHub App installation support so users can analyze private PRs securely.

### Team and Organization Workspaces

Add:

- Shared team history
- Organization-level dashboards
- Reviewer assignments
- Project-level risk trends
- Saved repo profiles

### Review Quality Scoring

Track whether reviewers addressed the riskiest files and concerns:

- Missed critical areas
- Review depth score
- Test coverage score
- Security attention score
- Suggested reviewer matching

### CI Integration

Add GitHub Checks integration:

- Automatically analyze every PR.
- Post a PRISM summary as a check.
- Block merge for critical risk without review.
- Add generated review checklist to PR comments.

### Semantic Search Over Past Analyses

Let users search historical PRs by meaning:

- "Show high-risk auth changes"
- "Find PRs that touched API permissions"
- "Which PRs had missing test warnings?"

### Rich Visual Reports

Potential UI upgrades:

- Interactive dependency graph
- Risk heatmap
- File impact timeline
- Expandable evidence cards
- Reviewer checklist mode
- Exportable PDF/Markdown report

### Stronger Security

Future production hardening:

- Rate limit OTP requests.
- Add OTP attempt limits.
- Add session rotation.
- Add audit logs.
- Add CSRF protection for sensitive routes.
- Add email allowlists or workspace domains.

## Security Notes

- Never commit `.env`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- SMTP credentials must remain server-side only.
- Use Gmail App Passwords or a dedicated SMTP provider.
- Use a strong `AUTH_SESSION_SECRET`.
- Keep `GITHUB_TOKEN` private.

## Project Vision

PRISM aims to become a complete pull request intelligence system, not just a summarizer.

The long-term goal is to combine:

- GitHub metadata
- Code diffs
- Static heuristics
- LLM reasoning
- Repository knowledge graphs
- Historical review data
- Team workflow signals

Together, these can help reviewers make faster, safer, and more consistent decisions.
