# AGENTS.md — Project AI Context

> This file is automatically read by Codex at the start of every session.
> It defines the non-negotiable standards, architecture decisions, and patterns for this project.
> When in doubt: **read this file before writing a single line of code.**

---

## 🧠 Project Overview

- **Name:** D&D Initiative Master
- **Type:** Next.js App Router Application
- **Stack:** Next.js 16 · React 19 · Drizzle ORM · Neon PostgreSQL · Zod · Tailwind CSS 4
- **Purpose:** Real-time combat tracker for Dungeons & Dragons 5e sessions with multi-user synchronization

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **pnpm** package manager
- A **Neon Database** account ([sign up free](https://neon.tech/))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/jurgen-alfaro/dnd-initiative-master.git
   cd dnd-initiative-master
   pnpm install
   ```

2. **Set up your database:**
   - Create a new project on [Neon](https://neon.tech/)
   - Copy your connection string from the Neon dashboard
   - Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

3. **Initialize the database schema:**
   ```bash
   pnpm db:push
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** and create your first party!

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Run custom migrations |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio (visual database editor) |

---

## ⛔ ABSOLUTE RULES — Never Violate These

These are hard constraints. No exceptions, no "just this once".

```
❌ NEVER use `any` in TypeScript — use `unknown`, generics, or define the type
❌ NEVER create classes — use functions, closures, and plain objects
❌ NEVER mix business logic inside React components or route handlers
❌ NEVER place a file in the wrong layer (see Architecture section)
❌ NEVER use `console.log` for runtime logging — use the project logger
❌ NEVER swallow errors silently — every catch block must handle or rethrow
❌ NEVER use `as SomeType` to force a cast — prove the type or use a guard
```

---

## ✅ Core Technical Standards

### TypeScript

- `strict: true` is enabled — respect every flag it enables
- Prefer `type` over `interface` for object shapes (use `interface` only for extension patterns)
- Use `unknown` when the type is genuinely unknown, then narrow with guards
- Zod is the single source of truth for runtime validation — derive TS types from schemas:
  ```ts
  const UserSchema = z.object({ id: z.string(), email: z.string().email() });
  type User = z.infer<typeof UserSchema>; // ✅ derived from schema
  ```
- Avoid type assertions (`as`). If you need one, leave a `// NOTE:` explaining why.

### Functions over Classes

- All logic is expressed as pure functions or composable higher-order functions
- Side effects are pushed to the edges (route handlers, event handlers, DB calls)
- No `class`, no `this`, no inheritance chains
- Dependency injection via function arguments, not constructors

### Error Handling

- Every async function returns `Result<T, E>` or throws a typed error — never returns `undefined` silently
- Use a consistent error shape across the entire project:
  ```ts
  type AppError = {
    code: string; // e.g. "USER_NOT_FOUND"
    message: string; // human-readable
    context?: unknown; // optional debug data
  };
  ```
- In Express: all errors flow through the centralized error middleware — never `res.status(500).json(...)` inline
- In Next.js: use `notFound()`, `redirect()`, and error boundaries correctly per App Router conventions
- `catch (e)` blocks must either: handle the error, transform it, or rethrow it. Never swallow.

---

## 🏗️ Architecture

### Separation of Concerns (Mandatory)

```
UI / Route Handler  →  only handles HTTP/rendering, delegates everything else
        ↓
Service Layer       →  business logic, orchestration, NO framework dependencies
        ↓
Repository / Data   →  all DB/external API calls, returns domain types
```

**A component or route handler that contains business logic is a bug.**

### Next.js (App Router) - **THIS PROJECT**

- Server Components are the default — only add `"use client"` when you need interactivity
- Data fetching happens in Server Components or Server Actions, not in client hooks
- Route handlers (`/api`) are thin: validate input with Zod → call service → return response
- `app/` structure for this project:
  ```
  app/
  ├── server/actions.ts    # Server Actions (all business logic)
  ├── api/                 # Route handlers (polling endpoint)
  ├── components/          # UI components (presentational)
  ├── lib/                 # Utilities, hooks, types
  ├── db/                  # Database schema & migrations
  └── pages/               # Page components (orchestrators)
  ```

### 🎯 Project-Specific Architecture Notes

- **Server Actions** (`app/server/actions.ts`) contain ALL business logic and database operations
- **Optimistic Updates** via `usePartyPolling` hook for instant UI feedback
- **Real-time Sync** using polling (3-second interval) instead of WebSockets (simpler for serverless)
- **No Repository Layer** - DB queries in Server Actions (acceptable for this project size)
- **Drizzle ORM** for type-safe database operations with Neon PostgreSQL
- **Zod Validation** for all Server Action inputs (schemas defined inline)

---

## 📁 Folder Structure

### This Project Structure

```
app/
├── api/                    # Route handlers
│   └── party/[code]/       # Polling endpoint for real-time sync
├── components/
│   ├── ui/                 # UI primitives (Button, Input, Dialog, Badge)
│   └── [feature components]/ # Feature-specific (CombatantCard, TurnControls, etc)
├── db/
│   ├── index.ts            # Database client initialization
│   ├── schema.ts           # Drizzle schema definitions
│   └── migrate.ts          # Migration utilities
├── lib/
│   ├── hooks/              # Custom hooks (usePartyPolling, useRecentParty)
│   ├── types.ts            # TypeScript types (Combatant, Party, Condition)
│   ├── code-gen.ts         # Party code generator
│   ├── name-gen.ts         # Random name generator
│   ├── condition-icons.ts  # D&D 5e condition mappings
│   ├── condition-descriptions.ts # D&D 5e condition rules text
│   └── [other utils]       # Pure utility functions
├── pages/                  # Page components
│   ├── HomePage.tsx        # Home page component
│   └── PartyPage.tsx       # Party page component
├── party/                  # Dynamic routes
│   ├── [code]/page.tsx     # Party detail page (SSR)
│   └── create/page.tsx     # Create party page
└── server/
    └── actions.ts          # Server Actions (ALL business logic)
```

**Root level:**
```
drizzle/                    # Drizzle migrations (auto-generated)
lib/                        # Root lib utilities
public/                     # Static assets
.claude/                    # AI context files
```

> 📌 **Before creating a new file:** find where it belongs in this structure.
> If it doesn't fit cleanly, ask — don't improvise a new folder.

---

## 📐 Naming Conventions

| Thing                  | Convention                   | Example                 |
| ---------------------- | ---------------------------- | ----------------------- |
| Files (components)     | PascalCase                   | `UserCard.tsx`          |
| Files (utils/services) | camelCase                    | `authService.ts`        |
| Functions              | camelCase                    | `getUserById`           |
| Types / Schemas        | PascalCase                   | `UserSchema`, `User`    |
| Constants              | SCREAMING_SNAKE              | `MAX_RETRY_COUNT`       |
| Zod schemas            | PascalCase + `Schema` suffix | `CreateUserSchema`      |
| Boolean vars           | `is/has/can` prefix          | `isLoading`, `hasError` |
| Event handlers         | `handle` prefix              | `handleSubmit`          |

---

## 🧪 Testing

- Unit tests for all service functions — services must be testable without a framework
- Integration tests for route handlers (use `supertest` for Express)
- No mocking of the module under test — mock only external dependencies (DB, APIs)
- Test file lives next to the source file: `authService.ts` → `authService.test.ts`
- Test naming: `describe('authService') > it('should return error when user not found')`

---

## 📦 Detailed Standards References

For deeper rules on each topic, read the relevant file before working in that area:

| Topic                   | File                            |
| ----------------------- | ------------------------------- |
| Architecture decisions  | `.claude/ARCHITECTURE.md`       |
| Naming conventions      | `.claude/NAMING_CONVENTIONS.md` |
| Error handling patterns | `.claude/ERROR_HANDLING.md`     |
| Commit conventions      | `.claude/COMMITS.md`            |

---

## 🔁 Codex Behavior Expectations

When working in this project, you should:

1. **Read the relevant `.claude/` file** before starting work in a new domain
2. **Ask before creating a new folder or architectural pattern** — don't assume
3. **Propose, don't impose** — if you think a standard should be broken, say so explicitly and explain why
4. **Match the style of surrounding code** — consistency beats personal preference
5. **Never generate placeholder logic** — if something is unclear, ask. Don't write `// TODO: implement this`
6. **Output only what was asked** — don't refactor unrelated code without being asked

---

## Agent skills

### Issue tracker

Issues en GitHub Issues de `jurgen-alfaro/dnd-initiative-master` (CLI `gh`). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: un `GLOSSARY.md` + `docs/adr/` en la raíz. See `docs/agents/domain.md`.

---

_Last updated: 2026-03-10_
_Stack: Next.js 16 (App Router) · React 19 · Drizzle ORM · Neon PostgreSQL · TypeScript · Zod · Tailwind CSS 4_
