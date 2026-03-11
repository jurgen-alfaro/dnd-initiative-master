# COMMITS.md

> Read this file before writing any commit message.
> Commit messages are documentation — they explain _why_ the code changed,
> not just _what_ changed. A good git log is a project's history book.

---

## 📐 Format — Conventional Commits

Every commit follows this structure:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Rules for the first line:**

- Maximum 72 characters
- `type` and `scope` are lowercase
- `description` starts with a lowercase verb in imperative mood
- No period at the end
- Always in English

---

## 🏷️ Types — Approved List

| Type       | When to use                          | Example                                             |
| ---------- | ------------------------------------ | --------------------------------------------------- |
| `feat`     | New feature or capability            | `feat(auth): add refresh token rotation`            |
| `fix`      | Bug fix                              | `fix(checkout): prevent double charge on retry`     |
| `refactor` | Code restructure, no behavior change | `refactor(users): extract validation to middleware` |
| `chore`    | Maintenance, deps, config            | `chore: update prisma to v5.10`                     |
| `docs`     | Documentation only                   | `docs(api): add error codes reference`              |
| `style`    | Formatting, no logic change          | `style(auth): fix indentation in login handler`     |
| `test`     | Adding or fixing tests               | `test(users): add unit tests for fetchUserById`     |
| `perf`     | Performance improvement              | `perf(db): add index on users.email`                |
| `revert`   | Reverting a previous commit          | `revert: feat(auth): add refresh token rotation`    |

**Rule:** if you can't decide between two types, pick the one that describes
the _primary intent_. A bug fix that also adds a test is still a `fix`.

---

## 🎯 Scopes — When and How to Use Them

Scopes are **required** when the change is isolated to a specific domain or layer.
Scopes are **optional** for project-wide changes (deps, config, tooling).

### Approved scopes

Use the domain name as the scope — matches your file naming convention:

```
auth        users       checkout     payments
dashboard   profile     api          db
middleware  config      ui           email
```

### Examples

```bash
# ✅ Scoped — change is isolated to a domain
feat(auth): add email verification on registration
fix(payments): handle declined card response from Stripe
refactor(users): move profile validation to middleware
test(checkout): add integration test for POST /checkout

# ✅ No scope — change affects multiple domains or is project-wide
chore: update all dependencies to latest
style: enforce prettier formatting across codebase
docs: add architecture overview to README
```

**Rule:** when in doubt, add the scope. It costs nothing and adds clarity.

---

## ✍️ Writing Good Descriptions

The description answers: **what does this commit make the system do differently?**

Not what you did — what the system now does.

```bash
# ❌ Describes your action (useless in git log)
fix(auth): fix bug in auth
feat(users): add user stuff
refactor(checkout): refactor checkout code
chore: update things

# ✅ Describes the behavior change (useful in git log)
fix(auth): prevent token refresh when session is expired
feat(users): allow profile picture upload via Cloudinary
refactor(checkout): extract payment orchestration to service layer
chore: upgrade Zod to v3.22 for discriminated union support
```

**The test:** read the description alone, 6 months from now.
Does it tell you what changed and why? If not, rewrite it.

---

## 📝 Commit Body — When to Use It

The body is optional but valuable when:

- The _why_ is not obvious from the description
- There's a tradeoff or decision worth documenting
- You're fixing a non-obvious bug

```bash
fix(auth): prevent token refresh when session is expired

Previously, the refresh endpoint accepted valid tokens even when the
associated session had been manually invalidated (e.g. after logout
from another device). This caused ghost sessions to persist.

Now we validate session status before issuing a new token.
```

**Format:** wrap at 72 characters, separate from subject with a blank line.

---

## 🌿 Branch Strategy

### Personal projects

Direct commits to `main` are acceptable. Apply the same commit quality standards
— the format doesn't change, only the branching workflow does.

### Collaborative projects

Follow the feature branch + PR workflow:

```
main                    ← production, always deployable
└── feat/user-avatar    ← feature branch
└── fix/token-refresh   ← bug fix branch
└── refactor/checkout   ← refactor branch
```

**Branch naming:** `<type>/<short-description-in-kebab-case>`

```bash
# ✅ Correct branch names
feat/email-verification
fix/double-charge-on-retry
refactor/checkout-service
chore/update-dependencies

# ❌ Wrong
feature-user-avatar      # missing type prefix
fix_token               # use kebab-case, not snake_case
FEAT/LOGIN              # lowercase only
my-changes              # not descriptive
```

**PR title = the squashed commit message.** Write it following the same
Conventional Commits format.

---

## ⚛️ Commit Discipline — Atomic Commits

Each commit should represent **one logical change**. Not one file, not one hour
of work — one coherent unit of change that could be reverted independently.

```bash
# ❌ Wrong — too many unrelated changes in one commit
feat(auth): add login, fix user profile bug, update README, refactor checkout

# ✅ Right — each commit is a self-contained change
feat(auth): add JWT-based login endpoint
fix(users): correct profile picture URL on update
docs: update README with local setup instructions
refactor(checkout): extract tax calculation to pure function
```

**Why:** atomic commits make `git bisect`, `git revert`, and code review dramatically easier.

---

## ⛔ Anti-Patterns — Never Do These

```bash
# ❌ Vague messages
fix: fix
feat: new feature
chore: changes
wip: working on stuff

# ❌ Past tense (use imperative)
feat(auth): added login endpoint       # use: add login endpoint
fix(users): fixed null pointer bug     # use: prevent null pointer on missing user

# ❌ Describing files changed instead of behavior
refactor: changed users.service.ts
chore: modified package.json

# ❌ Including "and" — sign of a non-atomic commit
feat(auth): add login and fix session bug and update docs

# ❌ Uppercase type or scope
Feat(Auth): Add login
FIX: resolve bug
```

---

## ✅ Quick Reference

```
Format:    <type>(<scope>): <description>
Language:  English always
Case:      lowercase type, scope, and description
Tense:     imperative ("add", "fix", "remove" — not "added", "fixed")
Length:    max 72 chars on first line
Scope:     required for domain-specific changes, optional for project-wide

Types:     feat · fix · refactor · chore · docs · style · test · perf · revert
Scopes:    auth · users · checkout · payments · api · db · middleware · ui · config

Branch:    <type>/<kebab-case-description>
PR title:  same format as commit message
```

---

## 💡 Examples to Reference

```bash
feat(auth): add email verification on registration
feat(users): allow profile picture upload via Cloudinary
feat(checkout): integrate Stripe payment intent flow

fix(auth): prevent token refresh when session is expired
fix(checkout): handle declined card response from Stripe
fix(users): return 404 when user is not found instead of 500

refactor(users): extract profile validation to middleware
refactor(checkout): move payment orchestration to service layer

chore: upgrade Zod to v3.22 for discriminated union support
chore: add ESLint rule for no-explicit-any
chore(db): add index on users.email for login performance

test(auth): add unit tests for token expiration logic
test(checkout): add integration test for double-charge prevention

docs(api): document AppErrorCode reference in README
```

---

_Related files: `CLAUDE.md` · `.claude/CODE_STANDARDS.md`_
