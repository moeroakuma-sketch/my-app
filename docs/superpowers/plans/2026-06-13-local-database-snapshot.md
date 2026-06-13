# Local Database Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add repository-backed database snapshots and a one-command local reset and restore workflow.

**Architecture:** Prisma schema remains the main table definition. TypeScript scripts export all Prisma models plus PostgreSQL check constraints to JSON, then reset through Prisma and restore constraints and rows in dependency order.

**Tech Stack:** TypeScript, Prisma 7, PostgreSQL, `pg`, `tsx`, Vitest, GNU Make.

---

### Task 1: Snapshot Format

**Files:**
- Create: `scripts/db-snapshot-format.ts`
- Test: `__tests__/db-snapshot-format.test.ts`

- [ ] Define tests for validating all required table arrays.
- [ ] Define tests for total record counting.
- [ ] Define tests for safely quoted PostgreSQL check-constraint SQL.
- [ ] Run the focused test and confirm it fails because the module is missing.
- [ ] Implement the snapshot types and pure validation helpers.
- [ ] Run the focused test and confirm it passes.

### Task 2: Database Export

**Files:**
- Create: `scripts/db-client.ts`
- Create: `scripts/db-snapshot.ts`
- Create: `prisma/snapshots/local.json`

- [ ] Add a script-local Prisma client using `DATABASE_URL`.
- [ ] Query every model in deterministic ID order.
- [ ] Query public-schema check constraints through PostgreSQL metadata.
- [ ] Write formatted JSON to `prisma/snapshots/local.json`.
- [ ] Run the export against the current local database.

### Task 3: Database Reset and Restore

**Files:**
- Create: `scripts/db-reset.ts`

- [ ] Validate the snapshot before any destructive operation.
- [ ] Add an interactive reset confirmation with `DB_RESET_CONFIRM=1` bypass.
- [ ] Run the local Prisma binary with `db push --force-reset`.
- [ ] Restore check constraints.
- [ ] Restore all rows in foreign-key dependency order in one transaction.
- [ ] Print restored row counts and return non-zero on failure.

### Task 4: Command Surface and Documentation

**Files:**
- Create: `Makefile`
- Modify: `package.json`
- Modify: `README.md`

- [ ] Add `db:snapshot` and `db:reset` npm scripts.
- [ ] Add `make db-snapshot` and `make db-reset` targets.
- [ ] Document prerequisites, sensitive snapshot contents, commands, and
      Windows npm equivalents.

### Task 5: Verification

**Files:**
- Verify all changed files.

- [ ] Run `npm run test:run`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run db:snapshot`.
- [ ] Run `git diff --check`.
- [ ] Do not run the destructive `db-reset` command without a separate explicit
      request to execute it.

No commit is created automatically because repository instructions require an
explicit user request before committing.
