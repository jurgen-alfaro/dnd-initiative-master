# ERROR_HANDLING.md

> Read this file before writing any function that can fail, any route handler,
> or any middleware. These are not suggestions — they are the contract this
> codebase uses to handle errors consistently.

---

## 🧠 Core Mental Model

There are exactly two kinds of errors in this project:

| Type            | Definition                                 | Examples                                                      | How to handle                               |
| --------------- | ------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------- |
| **Operational** | Expected failure, part of business flow    | User not found, email duplicate, invalid input, card declined | Return as `Result<T>` with `success: false` |
| **System**      | Unexpected failure, outside business logic | DB connection lost, Cloudinary unreachable, null pointer, OOM | Throw — let the global handler catch it     |

**The rule:** if you can name the error as a business case, return it.
If the system broke unexpectedly, throw it.

---

## 📐 The Result Type — Single Source of Truth

Every function that can fail with an **operational error** must return `Result<T>`.
This is the only approved shape for communicating failure as a value.

```ts
// lib/errors/result.ts

export type Success<T> = {
  success: true;
  data: T;
};

export type Failure = {
  success: false;
  errorCode: AppErrorCode; // machine-readable identity
  message: string; // human-readable description (for logs/UI)
  context?: unknown; // optional debug data — never expose in prod
};

export type Result<T> = Success<T> | Failure;

// Factory helpers — always use these, never construct the objects inline
export const ok = <T>(data: T): Success<T> => ({ success: true, data });

export const fail = (
  errorCode: AppErrorCode,
  message: string,
  context?: unknown,
): Failure => ({ success: false, errorCode, message, context });
```

---

## 🏷️ Error Codes — The Approved List

All `errorCode` values must be defined here. Adding a new one requires adding
it to this enum — never use raw strings.

```ts
// lib/errors/codes.ts

export const AppErrorCode = {
  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Resources
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // System (used only by global error handler — not in services)
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type AppErrorCode = (typeof AppErrorCode)[keyof typeof AppErrorCode];
```

**Rule:** if you find yourself wanting to use a string literal as an error code,
stop — add it here first.

---

## 🔁 Usage Patterns

### ✅ Service — operational errors as Result

```ts
// services/authService.ts
import { ok, fail, Result } from "@/lib/errors/result";
import { AppErrorCode } from "@/lib/errors/codes";

type LoginResult = Result<{ userId: string; token: string }>;

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResult> {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return fail(
      AppErrorCode.INVALID_CREDENTIALS,
      "Email or password is incorrect",
    );
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return fail(
      AppErrorCode.INVALID_CREDENTIALS,
      "Email or password is incorrect",
    );
    // NOTE: same message for both cases — never reveal which field is wrong
  }

  const token = generateToken(user.id);
  return ok({ userId: user.id, token });
}
```

### ✅ Service — system errors propagate naturally (don't catch them here)

```ts
export async function uploadAvatar(
  userId: string,
  file: Buffer,
): Promise<Result<{ url: string }>> {
  // ❌ Don't do this — swallows system errors
  // try {
  //   const url = await cloudinary.upload(file)
  //   return ok({ url })
  // } catch {
  //   return fail('UPLOAD_FAILED', 'Upload failed')
  // }

  // ✅ Let system errors throw — global handler will catch them
  const url = await cloudinary.upload(file); // throws if Cloudinary is down
  return ok({ url });
}
```

---

## 🌐 HTTP Layer — Mapping Errors to Status Codes

### Express: centralized error map + middleware

```ts
// lib/errors/httpMap.ts
import { AppErrorCode } from "./codes";

export const ERROR_HTTP_STATUS: Record<AppErrorCode, number> = {
  INVALID_CREDENTIALS: 401,
  EMAIL_ALREADY_EXISTS: 409,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,
  UNAUTHORIZED: 403,
  USER_NOT_FOUND: 404,
  RESOURCE_NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
};
```

```ts
// middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { ERROR_HTTP_STATUS } from "@/lib/errors/httpMap";
import { AppErrorCode } from "@/lib/errors/codes";
import { logger } from "@/lib/logger";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Log everything — system errors get full context
  logger.error({
    errorCode: AppErrorCode.INTERNAL_ERROR,
    message: err instanceof Error ? err.message : "Unknown error",
    stack: err instanceof Error ? err.stack : undefined,
    userId: req.user?.id, // who made the request
    path: req.path,
    payload: req.body, // what they sent
  });

  // Respond — generic in prod, detailed in dev
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err instanceof Error
        ? err.message
        : "Unknown error";

  res.status(500).json({
    success: false,
    errorCode: AppErrorCode.INTERNAL_ERROR,
    message,
  });
}
```

```ts
// routes/authRoutes.ts — route handler consuming Result
import { Router } from "express";
import { loginUser } from "@/services/authService";
import { ERROR_HTTP_STATUS } from "@/lib/errors/httpMap";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const result = await loginUser(req.body.email, req.body.password);

    if (!result.success) {
      // Operational error — we handle it here, not in errorMiddleware
      const status = ERROR_HTTP_STATUS[result.errorCode] ?? 400;
      return res.status(status).json({
        success: false,
        errorCode: result.errorCode,
        message: result.message,
      });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    next(err); // System error — pass to errorMiddleware
  }
});
```

### Next.js App Router: Server Actions + Route Handlers

```ts
// app/api/auth/login/route.ts
import { loginUser } from "@/services/authService";
import { ERROR_HTTP_STATUS } from "@/lib/errors/httpMap";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await loginUser(body.email, body.password);

    if (!result.success) {
      const status = ERROR_HTTP_STATUS[result.errorCode] ?? 400;
      return NextResponse.json(
        {
          success: false,
          errorCode: result.errorCode,
          message: result.message,
        },
        { status },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    logger.error({
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? (err as Error).stack : undefined,
      path: req.nextUrl.pathname,
    });

    const message =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err instanceof Error
          ? err.message
          : "Unknown error";

    return NextResponse.json(
      { success: false, errorCode: "INTERNAL_ERROR", message },
      { status: 500 },
    );
  }
}
```

```ts
// Server Action example
"use server";
import { loginUser } from "@/services/authService";
import { Result } from "@/lib/errors/result";

export async function loginAction(
  email: string,
  password: string,
): Promise<Result<{ token: string }>> {
  // Server Actions return Result directly — the client component handles it
  return loginUser(email, password);
}
```

---

## 📋 Validation Errors (Zod)

Zod errors are operational — always transform them into `Result` before leaving
the validation boundary.

```ts
// lib/errors/fromZod.ts
import { ZodError } from "zod";
import { fail, Failure } from "./result";
import { AppErrorCode } from "./codes";

export function fromZodError(error: ZodError): Failure {
  const message = error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");

  return fail(AppErrorCode.VALIDATION_ERROR, message, error.errors);
}

// Usage in a route handler or service:
const parsed = CreateUserSchema.safeParse(input);
if (!parsed.success) {
  return fromZodError(parsed.error);
}
```

---

## 🪵 Logging Contract

Every error log must include these fields — no exceptions:

```ts
type ErrorLog = {
  errorCode: string; // AppErrorCode or 'INTERNAL_ERROR'
  message: string; // what happened
  stack?: string; // always for system errors
  userId?: string; // who triggered it (if authenticated)
  path?: string; // which endpoint
  payload?: unknown; // what they sent — REDACT sensitive fields (passwords, tokens)
};
```

**Sensitive fields that must never appear in logs:**
`password`, `passwordHash`, `token`, `refreshToken`, `cardNumber`, `cvv`

---

## ⛔ Anti-Patterns — Never Do This

```ts
// ❌ Silent catch — the worst pattern
try {
  await doSomething()
} catch {
  // nothing here
}

// ❌ Returning undefined to signal failure
async function getUser(id: string): Promise<User | undefined> { ... }

// ❌ Comparing error message strings
if (result.message === 'User not found') { ... }

// ❌ Using `any` in error handlers
} catch (e: any) {
  console.log(e.message)
}

// ❌ Exposing stack traces in production responses
res.status(500).json({ error: err.stack })

// ❌ Throwing operational errors (things you can name as business cases)
throw new Error('EMAIL_ALREADY_EXISTS')   // return fail(...) instead

// ❌ Inline status codes without the map
res.status(404).json({ error: 'not found' })  // use ERROR_HTTP_STATUS map
```

---

## ✅ Quick Reference Checklist

Before submitting code that handles errors, verify:

- [ ] Operational errors return `Result<T>` with a defined `AppErrorCode`
- [ ] System errors are allowed to throw and reach the global handler
- [ ] No `catch` block is empty or logs-only without handling
- [ ] Zod errors go through `fromZodError()` before leaving the boundary
- [ ] Route handlers use `ERROR_HTTP_STATUS` map for status codes
- [ ] Logs include: `errorCode`, `message`, `stack`, `userId`, `path`, `payload`
- [ ] No sensitive fields (`password`, `token`, etc.) appear in logs
- [ ] Error responses in production never expose stack traces or internal details

---

_Related files: `CLAUDE.md` · `.claude/CODE_STANDARDS.md` · `.claude/SECURITY.md`_
