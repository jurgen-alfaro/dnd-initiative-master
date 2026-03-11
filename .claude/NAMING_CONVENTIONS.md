# NAMING_CONVENTIONS.md

> Read this file before creating any file, function, type, variable, or folder.
> Consistency beats personal preference — if the convention is defined here, follow it.
> If a case is not covered, match the closest existing pattern and document it.

---

## 🗂️ Files & Folders

### Backend — `[domain].[layer].ts`

Every backend file is named with its domain first, then its architectural layer.

| Layer              | Convention               | Example               |
| ------------------ | ------------------------ | --------------------- |
| Controller / Route | `[domain].controller.ts` | `users.controller.ts` |
| Service            | `[domain].service.ts`    | `auth.service.ts`     |
| Repository         | `[domain].repository.ts` | `users.repository.ts` |
| Middleware         | `[domain].middleware.ts` | `auth.middleware.ts`  |
| Shared types       | `[domain].types.ts`      | `users.types.ts`      |
| Zod schemas        | `[domain].schemas.ts`    | `auth.schemas.ts`     |

```
src/
├── users.controller.ts
├── users.service.ts
├── users.repository.ts
├── users.types.ts
└── users.schemas.ts
```

**Rule:** the domain name is always singular: `user`, not `users` — except for
route files where the plural matches the REST endpoint (`/users`).

### Frontend — Components

| Thing                | Convention               | Example            |
| -------------------- | ------------------------ | ------------------ |
| React component file | `PascalCase.tsx`         | `UserCard.tsx`     |
| Custom hook file     | `camelCase.tsx`          | `useLoginForm.tsx` |
| Utility / helper     | `camelCase.ts`           | `formatDate.ts`    |
| Context file         | `PascalCase.context.tsx` | `Auth.context.tsx` |
| Types file           | `[domain].types.ts`      | `users.types.ts`   |
| Zod schemas          | `[domain].schemas.ts`    | `auth.schemas.ts`  |

### Next.js App Router — Folders

- Route folders: **kebab-case** — matches the URL exactly
- Group folders (no URL segment): `(group-name)`
- Dynamic segments: `[param]`

```
app/
├── (auth)/
│   ├── login/
│   └── reset-password/       ← kebab-case
├── dashboard/
│   └── user-settings/        ← kebab-case, not userSettings
├── api/
│   └── users/
│       └── [userId]/
└── my-profile/               ← kebab-case
```

---

## 🔤 Functions

| Type                     | Convention              | Example                            |
| ------------------------ | ----------------------- | ---------------------------------- |
| General function         | `camelCase`, verb first | `formatDate`, `validateInput`      |
| Data fetching (DB / API) | `fetch` prefix, always  | `fetchUsers`, `fetchUserById`      |
| Boolean returning        | `is/has/can` prefix     | `isAuthenticated`, `hasPermission` |
| Event handlers           | `handle` prefix         | `handleSubmit`, `handleClick`      |
| Factory functions        | `create` prefix         | `createAppError`, `createToken`    |
| Transformers             | `to` prefix             | `toUserDTO`, `toPublicProfile`     |

```ts
// ✅ Correct
async function fetchActiveUsers(): Promise<User[]> { ... }
async function fetchUserById(id: string): Promise<User | null> { ... }
function handleSubmit(e: FormEvent) { ... }
function isTokenExpired(token: string): boolean { ... }
function toUserDTO(user: RawUser): UserDTO { ... }

// ❌ Wrong
async function getUsers() { ... }        // use fetch, not get
async function loadUser(id: string) { ... } // use fetch, not load
function submitForm() { ... }            // missing handle prefix
function checkToken() { ... }            // use is/has/can prefix
```

**Rule:** `fetch` is the single prefix for all async data access — DB queries,
external APIs, internal service calls. No `get`, `load`, or `retrieve`.

---

## 📐 Variables & Constants

| Type             | Convention             | Example                            |
| ---------------- | ---------------------- | ---------------------------------- |
| Regular variable | `camelCase`            | `currentUser`, `responseData`      |
| Boolean variable | `is/has/can` prefix    | `isLoading`, `hasError`, `canEdit` |
| Global constant  | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_BASE_URL`  |
| Enum-like object | `SCREAMING_SNAKE_CASE` | `AppErrorCode.USER_NOT_FOUND`      |

```ts
// ✅ Correct
const MAX_RETRY_COUNT = 3;
const isLoading = true;
const hasPermission = checkPermission(user, "admin");
const currentUser = await fetchUserById(id);

// ❌ Wrong
const maxRetries = 3; // should be SCREAMING_SNAKE
const loading = true; // missing is prefix for booleans
const userLoaded = false; // unclear — use isUserLoaded
```

**Note on booleans:** `is/has/can` are the primary prefixes. `show/hide` is
acceptable for UI visibility state when `is` feels unnatural:
`showModal`, `showDropdown`. Avoid mixing randomly — pick one per variable
and be consistent within the same component.

---

## 🏷️ Types & Schemas

| Thing                     | Convention                     | Example                               |
| ------------------------- | ------------------------------ | ------------------------------------- |
| TypeScript type           | `PascalCase`                   | `User`, `AuthToken`                   |
| Zod schema                | `PascalCase` + `Schema` suffix | `UserSchema`, `CreateUserSchema`      |
| DTO (derived from schema) | `PascalCase` + `DTO` suffix    | `UserDTO`, `CreateUserDTO`            |
| Props type                | Component name + `Props`       | `UserCardProps`, `LoginFormProps`     |
| API response type         | `PascalCase` + `Response`      | `LoginResponse`, `FetchUsersResponse` |

```ts
// ✅ Zod schema → DTO pattern
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
type CreateUserDTO = z.infer<typeof CreateUserSchema>

// ✅ Component props
type UserCardProps = {
  user: UserDTO
  onSelect: (id: string) => void
}

// ❌ Wrong
const userSchema = z.object({ ... })     // should be PascalCase: UserSchema
type IUser = { ... }                     // no I prefix — use User
type UserInterface = { ... }             // no Interface suffix — use User
type user = { ... }                      // types are always PascalCase
```

---

## ⚛️ React Components & Hooks

```ts
// ✅ Component — PascalCase, matches filename
export function UserCard({ user, onSelect }: UserCardProps) { ... }
// File: UserCard.tsx

// ✅ Custom hook — camelCase with use prefix, matches filename
export function useLoginForm(initialEmail?: string) { ... }
// File: useLoginForm.tsx

// ✅ Event handlers inside components — handle prefix
function handleSubmit(e: FormEvent) { ... }
function handleEmailChange(value: string) { ... }
function handleModalClose() { ... }

// ❌ Wrong
export function userCard() { ... }       // components are PascalCase
export function LoginFormHook() { ... }  // hooks use camelCase + use prefix
function submitForm() { ... }            // missing handle prefix
function onSubmit() { ... }              // on is for props, handle is for implementations
```

**`on` vs `handle` distinction:**

- `on` prefix → prop names passed to a component: `onSubmit`, `onClose`, `onSelect`
- `handle` prefix → the actual implementation inside the component: `handleSubmit`, `handleClose`

```ts
// ✅ Correct pattern
type ModalProps = {
  onClose: () => void      // prop — uses on
}

function Modal({ onClose }: ModalProps) {
  function handleClose() { // implementation — uses handle
    // do cleanup...
    onClose()
  }

  return <button onClick={handleClose}>Close</button>
}
```

---

## 📁 Shared Types Location

Types shared across multiple files live in `[domain].types.ts`, colocated
with the domain they belong to:

```
src/
├── users.types.ts      ← User, UserDTO, CreateUserDTO, UserCardProps
├── auth.types.ts       ← AuthToken, LoginDTO, Session
└── shared.types.ts     ← Result<T>, AppError, PaginatedResponse<T>
```

**Rule:** don't create a global `/types` folder. Types live next to their domain.
The only exception is truly cross-cutting types (`Result<T>`, `AppError`) which
live in `lib/errors/` or `shared.types.ts`.

---

## ⛔ Anti-Patterns — Never Do These

```ts
// ❌ Abbreviations that lose meaning
const usr = fetchUser(id)       // use: user
const btn = document.querySelector('button')  // use: button or submitButton
const fn = () => { ... }        // use a descriptive name

// ❌ Meaningless generic names
const data = await fetchUsers()     // use: users
const result = processForm()        // use: validationResult or formResult
const temp = transform(input)       // use a descriptive name

// ❌ Type prefixes/suffixes that add noise
type IUser = { ... }            // use: User
type UserInterface = { ... }    // use: User
type TUser = { ... }            // use: User

// ❌ Wrong casing for the context
const Max_Retry = 3             // use: MAX_RETRY
const CURRENT_user = { ... }    // use: currentUser
export function usercard() { }  // use: UserCard

// ❌ get/load prefix for async data access
async function getUsers() { }   // use: fetchUsers
async function loadProfile() { }// use: fetchProfile
```

---

## ✅ Quick Reference Card

```
Files (backend)     → [domain].[layer].ts       users.service.ts
Files (component)   → PascalCase.tsx             UserCard.tsx
Files (hook)        → camelCase.tsx              useLoginForm.tsx
Route folders       → kebab-case                 user-settings/

Functions (data)    → fetch + PascalCase         fetchUserById
Functions (boolean) → is/has/can + camelCase     isAuthenticated
Functions (handler) → handle + PascalCase        handleSubmit
Functions (factory) → create + PascalCase        createAppError

Variables           → camelCase                  currentUser
Booleans            → is/has/can prefix          isLoading
Constants           → SCREAMING_SNAKE            MAX_RETRY_COUNT

Types               → PascalCase                 User
Zod schemas         → PascalCase + Schema        CreateUserSchema
DTOs                → PascalCase + DTO           CreateUserDTO
Props               → ComponentName + Props      UserCardProps

Props (passed in)   → on prefix                  onClose, onSelect
Handlers (impl)     → handle prefix              handleClose, handleSelect
```

---

_Related files: `CLAUDE.md` · `.claude/CODE_STANDARDS.md` · `.claude/FOLDER_STRUCTURE.md`_
