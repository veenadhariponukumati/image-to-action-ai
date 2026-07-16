# Image-to-Action AI

Turn screenshots, handwritten notes, and whiteboard photos into structured, actionable
output: a summary, transcribed text, tasks (with priority), calendar events, and reminders —
extracted by OpenAI's vision model (`gpt-4o-mini`). Extractions are saved per-account, with
a persisted, interactive task checklist and a browsable history.

[![CI](https://github.com/veenadhariponukumati/image-to-action-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/veenadhariponukumati/image-to-action-ai/actions/workflows/ci.yml)

## Features

- Upload a screenshot/note/whiteboard photo → structured extraction via OpenAI vision, with a graceful demo-mode fallback if the backend is unreachable
- Email/password auth (scrypt-hashed passwords, JWT session cookies) with a full forgot/reset-password flow
- Per-user extraction history, with real persisted checkboxes for tasks
- Rate limiting on the LLM-backed endpoint and on auth routes
- CI on every push: migrations, typecheck, and the full test suite against a real Postgres service container

## Stack

- **Client:** React 19 + Tailwind 4 + shadcn/ui, routed with Wouter (`client/`)
- **Server:** Express + tRPC, with plain REST endpoints for auth and image extraction (`server/`)
- **DB:** Postgres via Drizzle ORM (`drizzle/`) — `users`, `extractions`, `tasks`, `password_reset_tokens`
- **Tests:** Vitest + Supertest (`*.test.ts`), 22 tests covering auth, password hashing, cross-user authorization, and the extraction pipeline (LLM calls mocked)

## Project layout

```
client/
  src/
    pages/          Home (upload + results + history), ResetPassword, NotFound
    components/      UploadZone, ResultsSection, ResultCard, HistorySection, AuthGate, LoadingState
    _core/hooks/     useAuth (session state, wraps trpc.auth.*)
    hooks/           useImageUpload (upload/extract/checklist-toggle/history-view flow)
server/
  extract.ts         POST /api/extract — auth-gated, rate-limited, multer upload -> invokeLLM (vision) -> saveExtraction
  routers.ts         tRPC router (auth.me/logout, extractions.list/toggleTask — all per-user)
  db.ts              Drizzle/Postgres queries: users, extractions, tasks, password reset tokens
  _core/
    app.ts           Builds the Express app (routes + middleware), no side effects — used directly by tests
    index.ts          Boots app.ts + Vite (dev) or static serving (prod) + listens
    auth.ts            POST /api/auth/{signup,login,forgot-password,reset-password}
    session.ts          JWT session cookie sign/verify, shared by tRPC context + plain REST routes
    llm.ts              invokeLLM — thin wrapper around the OpenAI SDK
    email.ts            Pluggable password-reset email sender (logs to console until a provider key is set)
shared/
  const.ts           Shared constants (cookie name, etc.)
drizzle/              Schema + migrations
```

`client/src/components/{AIChatBox,DashboardLayout,Map}.tsx` and `client/src/pages/ComponentShowcase.tsx`
are pre-built but currently unused — available scaffolding for future features, not part of the live app.

## Setup

```bash
pnpm install
pnpm run dev      # http://localhost:3000
pnpm test         # vitest (needs DATABASE_URL — see below)
pnpm run check    # tsc --noEmit
```

You'll need a `.env` with:

```
DATABASE_URL=postgres://user:password@localhost:5432/image_to_action
JWT_SECRET=some-random-string          # signs session cookies
OPENAI_API_KEY=sk-...                  # required for real extraction; without it, the extract endpoint 500s and the frontend falls back to demo data

# Optional — password-reset emails just log the link to the server console until this is set
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_URL=http://localhost:3000
```

For local Postgres: `docker run -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=image_to_action -p 5433:5432 postgres:16`,
then `npx drizzle-kit migrate`.

## CI

`.github/workflows/ci.yml` spins up a Postgres service container, runs migrations, then typecheck + the full test suite, on every push and PR against `main`.
