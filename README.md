# Image-to-Action AI

Turn screenshots, handwritten notes, and whiteboard photos into structured, actionable
output: a summary, transcribed text, tasks (with priority), calendar events, and reminders —
extracted by a vision-capable LLM.

## Stack

- **Client:** React 19 + Tailwind 4 + shadcn/ui, routed with Wouter (`client/`)
- **Server:** Express + tRPC, with a plain REST endpoint for image extraction (`server/`)
- **DB:** MySQL via Drizzle ORM (`drizzle/`) — currently just a `users` table for auth
- **Tests:** Vitest (`*.test.ts`)

## Project layout

```
client/
  src/
    pages/          Home (upload + results), NotFound
    components/      UploadZone, ResultsSection, ResultCard, LoadingState, AIChatBox, Map, DashboardLayout
    hooks/           useImageUpload (upload + extract flow)
    contexts/        ThemeContext
server/
  extract.ts         POST /api/extract — multer upload -> invokeLLM (vision) -> structured JSON
  routers.ts         tRPC router (auth.me, auth.logout)
  db.ts              Drizzle/MySQL user upsert helpers
  _core/             Server bootstrap (Express + tRPC + Vite middleware)
shared/
  const.ts           Shared constants (cookie name, etc.)
  types.ts           Shared type exports
drizzle/              SQL migrations
```

## Known gap: LLM backend

`server/extract.ts` calls `invokeLLM(...)` from `server/_core/llm`, expecting an
OpenAI-compatible chat-completions interface (`messages`, `response_format: json_schema`,
returning `choices[0].message.content`). That module — along with a few other `server/_core/*`
files referenced by imports (`oauth.ts`, `env.ts`, `context.ts`, `trpc.ts`, `cookies.ts`,
`errors.ts`, `systemRouter.ts`, `storageProxy.ts`, `vite.ts`) — is not present in this export
and needs to be implemented before the server will run. `invokeLLM` is the main one to write:
it should call a real vision-capable model (e.g. OpenAI `gpt-4o`/`gpt-4o-mini`, or
Anthropic Claude with image input) using an API key from your own `.env`, and return a
response shaped like `{ choices: [{ message: { content: string } }] }` so `extract.ts`
doesn't need to change.

## Setup

```bash
pnpm install
pnpm run dev      # http://localhost:3000
pnpm test         # vitest
pnpm run check    # tsc --noEmit
```

You'll need a `.env` with at least:

```
DATABASE_URL=mysql://...       # optional — auth/db features degrade gracefully without it
OPENAI_API_KEY=...             # or ANTHROPIC_API_KEY, depending on what you wire into invokeLLM
```
