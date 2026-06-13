# Local Database Snapshot Design

## Goal

Store the current local PostgreSQL schema metadata and all table rows in the
repository, then rebuild another local database from that saved state with one
`make` command.

## Commands

- `make db-snapshot` exports the current database to
  `prisma/snapshots/local.json`.
- `make db-reset` resets the database described by `DATABASE_URL`, recreates
  tables from `prisma/schema.prisma`, restores PostgreSQL check constraints,
  and inserts all saved rows.
- Equivalent npm scripts remain available for Windows environments where GNU
  Make is not installed.

## Snapshot Contents

The snapshot contains:

- A format version and export timestamp.
- PostgreSQL check constraints not represented by Prisma schema syntax.
- Every row from Product, User, PaymentMethod, Order, OrderItem, Review,
  ReviewHelpful, ReviewImage, and ReviewReport.

The snapshot intentionally contains password hashes, account details, orders,
reviews, and payment method metadata because the user approved storing the
complete current local database in the repository. It must only contain
development data suitable for repository access.

## Restore Flow

1. Read and validate the snapshot before making destructive changes.
2. Require interactive confirmation unless `DB_RESET_CONFIRM=1` is set.
3. Run `prisma db push --force-reset` against `DATABASE_URL`.
4. Recreate saved PostgreSQL check constraints.
5. Insert rows in foreign-key dependency order inside a transaction.
6. Print per-table counts after successful restoration.

## Failure Handling

- A missing or malformed snapshot stops before database reset.
- A failed Prisma reset stops before data restoration.
- Constraint or row restoration failures return a non-zero exit code.
- Row inserts are transactional so a restoration failure does not leave a
  partially populated database.

## Verification

- Unit tests cover snapshot validation, record counting, and quoted constraint
  SQL generation.
- `npm run db:snapshot` verifies that the current database can be exported.
- `npm run lint` and `npm run test:run` verify repository consistency.
- The destructive `db-reset` command is not run automatically.
