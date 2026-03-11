# ARCHITECTURE.md

> Read this file before creating any new folder, layer, or module.
> These decisions define how the system is structured and how dependencies flow.
> When in doubt about where something belongs: find the layer, not the folder.

---

## 🧠 Core Principle — The Dependency Rule

Dependencies flow in **one direction only**:

```
HTTP Layer → Service Layer → Repository Layer → ORM / DB
```

- Each layer knows only about the layer directly below it
- No layer imports from the layer above it
- Inner layers have zero knowledge of Express, Next.js, or HTTP concepts

**Why this matters:** if you swap Express for Fastify tomorrow, only the HTTP
layer changes. Services and repositories are untouched. If you swap Prisma for
another ORM, only repositories change. This is what makes the system testable
and maintainable.

---

## 🏗️ The Layers

### 1. HTTP Layer — Controllers & Route Handlers

**Responsibility:** receive the request, delegate, return the response. Nothing else.

**Contains:**

- Input already validated (Zod ran in middleware before this)
- One call to the service layer
- Mapping of `Result<T>` to HTTP status + JSON response

**Does NOT contain:**

- Business logic of any kind
- Direct DB calls
- `if/else` chains deciding what to do with data

```ts
// ✅ Correct — thin controller
// users.controller.ts
export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await fetchUserById(req.params.id); // one service call

    if (!result.success) {
      const status = ERROR_HTTP_STATUS[result.errorCode] ?? 400;
      return res.status(status).json({ success: false, ...result });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    next(err);
  }
}

// ❌ Wrong — business logic inside controller
export async function getUserById(req: Request, res: Response) {
  const user = await db.users.findOne({ id: req.params.id });
  if (!user) return res.status(404).json({ error: "not found" });
  if (user.role !== "admin")
    return res.status(403).json({ error: "forbidden" });
  // ... this belongs in the service
}
```

### 2. Validation Layer — Middleware

**Responsibility:** intercept the request before it reaches the controller,
validate the input with Zod, and reject invalid requests early.

**Rule:** validation logic is never duplicated in controllers.
Define the schema once in `[domain].schemas.ts`, apply it via middleware.

```ts
// middleware/validate.middleware.ts
import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { fromZodError } from "@/lib/errors/fromZod";
import { ERROR_HTTP_STATUS } from "@/lib/errors/httpMap";
import { AppErrorCode } from "@/lib/errors/codes";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const error = fromZodError(parsed.error);
      const status = ERROR_HTTP_STATUS[AppErrorCode.VALIDATION_ERROR];
      return res.status(status).json({ success: false, ...error });
    }

    req.body = parsed.data; // typed and sanitized
    next();
  };
}

// Usage in routes:
router.post("/users", validate(CreateUserSchema), createUserController);
```

**Adding cross-cutting validation behavior** (logging, metrics, rate limiting per
schema type) happens in `validate.middleware.ts` — one place, all endpoints.

### 3. Service Layer — Business Logic

**Responsibility:** all business rules, orchestration, and decisions.
This is where the application "thinks".

**Rules:**

- No `req`, `res`, `next` — zero framework knowledge
- No direct DB calls — always through the repository
- Returns `Result<T>` for operational outcomes
- Throws for unexpected system failures
- Pure functions where possible — same input, same output

```ts
// users.service.ts
import { fetchUserById } from "@/repositories/users.repository";
import { ok, fail, Result } from "@/lib/errors/result";
import { AppErrorCode } from "@/lib/errors/codes";
import { toUserDTO } from "@/lib/transformers/user.transformer";
import type { UserDTO } from "@/types/users.types";

export async function fetchUserProfile(
  userId: string,
): Promise<Result<UserDTO>> {
  const user = await fetchUserById(userId); // repository call

  if (!user) {
    return fail(AppErrorCode.USER_NOT_FOUND, `User ${userId} does not exist`);
  }

  if (!user.isActive) {
    return fail(AppErrorCode.UNAUTHORIZED, "User account is deactivated");
  }

  return ok(toUserDTO(user)); // transform before returning
}
```

**A service that imports from Express is an architectural bug.**

### 4. Repository Layer — Data Access

**Responsibility:** all interactions with the database or external data sources.
Returns raw domain objects — no business logic, no decisions.

**Rules:**

- Only layer allowed to import from the ORM (Prisma, Mongoose, etc.)
- Returns typed domain objects, never raw ORM types exposed upward
- One repository per domain entity
- Function names use `fetch` prefix (consistent with naming conventions)

```ts
// users.repository.ts
import { prisma } from "@/lib/prisma";
import type { RawUser } from "@/types/users.types";

export async function fetchUserById(id: string): Promise<RawUser | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function fetchActiveUsers(): Promise<RawUser[]> {
  return prisma.user.findMany({ where: { isActive: true } });
}

export async function createUser(data: CreateUserDTO): Promise<RawUser> {
  return prisma.user.create({ data });
}
```

**A repository that contains an `if` statement making a business decision is an
architectural bug.**

### 5. Middleware Layer — Cross-Cutting Concerns

**Responsibility:** intercept requests for concerns that apply across many endpoints.

| Middleware                | Responsibility                           |
| ------------------------- | ---------------------------------------- |
| `auth.middleware.ts`      | Verify JWT, attach `req.user`            |
| `validate.middleware.ts`  | Run Zod schemas, reject invalid input    |
| `logger.middleware.ts`    | Log all incoming requests                |
| `rateLimit.middleware.ts` | Rate limiting per IP or user             |
| `error.middleware.ts`     | Global error handler — last in the chain |

**Rule:** if a concern applies to more than one controller, it belongs in middleware.

---

## 🔄 Data Transformation — DTO Pattern

Data is transformed at layer boundaries. Raw DB objects never reach the HTTP response.

```
DB → RawUser → (transformer) → UserDTO → HTTP response
```

```ts
// lib/transformers/user.transformer.ts
import type { RawUser, UserDTO } from "@/types/users.types";

export function toUserDTO(user: RawUser): UserDTO {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
    // NOTE: passwordHash is intentionally excluded
  };
}
```

**Why:** prevents accidental exposure of sensitive fields (`passwordHash`, internal
flags, etc.) and decouples DB schema changes from API contracts.

---

## ⚛️ Next.js App Router Architecture

The same dependency rule applies — only adapted to the App Router model.

```
Page / Layout (RSC)     →  Server Action / Route Handler  →  Service  →  Repository
     ↓
Client Component        →  Server Action                  →  Service  →  Repository
```

**Server Components** fetch data directly by calling services — not repositories.

```ts
// app/dashboard/page.tsx — Server Component
import { fetchUserProfile } from '@/services/users.service'

export default async function DashboardPage() {
  const result = await fetchUserProfile(getCurrentUserId())

  if (!result.success) redirect('/login')  // or notFound()

  return <Dashboard user={result.data} />
}
```

**Client Components** interact through Server Actions — never call services directly.

```ts
// app/profile/actions.ts — Server Action
"use server";
import { updateUserProfile } from "@/services/users.service";
import { UpdateProfileSchema } from "@/schemas/users.schemas";
import { fromZodError } from "@/lib/errors/fromZod";
import type { Result } from "@/lib/errors/result";

export async function updateProfileAction(
  input: unknown,
): Promise<Result<UserDTO>> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  return updateUserProfile(getCurrentUserId(), parsed.data);
}
```

**Route Handlers** (`/api`) are thin — validate with Zod, call service, return JSON.

---

## 📁 Folder Structure by Architecture

### Express / Node.js

```
src/
├── routes/                   # Router definitions — wire URLs to controllers
│   └── users.routes.ts
├── controllers/              # HTTP layer — thin, delegates to services
│   └── users.controller.ts
├── services/                 # Business logic — framework-agnostic
│   └── users.service.ts
├── repositories/             # Data access — ORM calls only
│   └── users.repository.ts
├── middleware/               # Cross-cutting concerns
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   ├── logger.middleware.ts
│   └── error.middleware.ts
├── lib/
│   ├── errors/               # Result<T>, AppErrorCode, httpMap, fromZod
│   ├── transformers/         # RawX → DTO transformers
│   └── prisma.ts             # ORM client singleton
└── types/
    └── [domain].types.ts     # RawX types and DTOs
```

### Next.js (App Router)

```
src/
├── app/                      # Pages, layouts, route handlers, server actions
│   ├── (auth)/
│   ├── dashboard/
│   └── api/
├── components/
│   ├── ui/                   # Primitive components (Button, Input, Modal)
│   └── [feature]/            # Feature-specific components
├── services/                 # Business logic — same as Express, no framework deps
├── repositories/             # Data access
├── schemas/                  # Zod schemas — [domain].schemas.ts
├── lib/
│   ├── errors/
│   └── transformers/
└── types/
    └── [domain].types.ts
```

---

## 🔀 Dependency Direction — Visual Reference

```
┌─────────────────────────────────────────┐
│  HTTP Layer (Controller / RSC / Action) │  ← knows: Service
├─────────────────────────────────────────┤
│         Middleware (validate, auth)      │  ← knows: Schemas, Result
├─────────────────────────────────────────┤
│            Service Layer                │  ← knows: Repository, Result
├─────────────────────────────────────────┤
│           Repository Layer              │  ← knows: ORM, RawTypes
├─────────────────────────────────────────┤
│              ORM / DB                   │
└─────────────────────────────────────────┘

⬆ Dependencies never point upward
⬇ Each layer only imports from the layer below
```

---

## ⛔ Architectural Violations — Never Do These

```ts
// ❌ Service importing from Express
import { Request } from 'express'
export async function createUser(req: Request) { ... }

// ❌ Controller making DB calls directly
import { prisma } from '@/lib/prisma'
export async function getUser(req, res) {
  const user = await prisma.user.findUnique(...)  // belongs in repository
}

// ❌ Repository containing business logic
export async function fetchUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user.isActive) throw new Error('inactive')  // belongs in service
  return user
}

// ❌ Raw DB object reaching the HTTP response
return res.json(await prisma.user.findUnique(...))  // use toUserDTO()

// ❌ Skipping the service layer
// Controller calling repository directly
const user = await fetchUserById(req.params.id)  // where's the business logic?
return res.json(user)
```

---

## ✅ Architecture Decision Checklist

Before adding a new module or feature, answer:

- [ ] Which layer does this belong to? (HTTP / Service / Repository / Middleware)
- [ ] Does it import only from the layer below it?
- [ ] Is there any business logic in a controller or repository? (move it to service)
- [ ] Is there any HTTP knowledge in a service? (remove it)
- [ ] Are raw DB objects being returned directly? (add a transformer)
- [ ] Is validation duplicated across controllers? (move to middleware)
- [ ] Can the service be tested without Express or a real DB? (it should be)

---

_Related files: `CLAUDE.md` · `.claude/ERROR_HANDLING.md` · `.claude/FOLDER_STRUCTURE.md` · `.claude/TESTING.md`_
