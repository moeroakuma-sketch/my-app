import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

import { prisma } from "./db-client";
import { databaseSnapshotPath, projectRoot } from "./db-paths";
import {
  countSnapshotRecords,
  type DatabaseSnapshot,
} from "./db-snapshot-format";

type CheckConstraintRow = {
  tableName: string;
  constraintName: string;
  definition: string;
};

async function exportSnapshot() {
  const [
    products,
    users,
    paymentMethods,
    orders,
    orderItems,
    reviews,
    reviewHelpful,
    reviewImages,
    reviewReports,
    checkConstraints,
  ] = await Promise.all([
    prisma.product.findMany({ orderBy: { id: "asc" } }),
    prisma.user.findMany({ orderBy: { id: "asc" } }),
    prisma.paymentMethod.findMany({ orderBy: { id: "asc" } }),
    prisma.order.findMany({ orderBy: { id: "asc" } }),
    prisma.orderItem.findMany({ orderBy: { id: "asc" } }),
    prisma.review.findMany({ orderBy: { id: "asc" } }),
    prisma.reviewHelpful.findMany({ orderBy: { id: "asc" } }),
    prisma.reviewImage.findMany({ orderBy: { id: "asc" } }),
    prisma.reviewReport.findMany({ orderBy: { id: "asc" } }),
    prisma.$queryRaw<CheckConstraintRow[]>`
      SELECT
        relation.relname AS "tableName",
        constraint_record.conname AS "constraintName",
        pg_get_constraintdef(constraint_record.oid) AS "definition"
      FROM pg_constraint AS constraint_record
      INNER JOIN pg_class AS relation
        ON relation.oid = constraint_record.conrelid
      INNER JOIN pg_namespace AS namespace
        ON namespace.oid = relation.relnamespace
      WHERE constraint_record.contype = 'c'
        AND namespace.nspname = 'public'
      ORDER BY relation.relname, constraint_record.conname
    `,
  ]);

  const snapshot: DatabaseSnapshot = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    checkConstraints,
    tables: {
      products,
      users,
      paymentMethods,
      orders,
      orderItems,
      reviews,
      reviewHelpful,
      reviewImages,
      reviewReports,
    },
  };

  await mkdir(dirname(databaseSnapshotPath), { recursive: true });
  await writeFile(
    databaseSnapshotPath,
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Saved ${countSnapshotRecords(snapshot)} rows to ${relative(projectRoot, databaseSnapshotPath)}.`,
  );
  console.log(`Saved ${checkConstraints.length} PostgreSQL check constraints.`);
}

exportSnapshot()
  .catch((error) => {
    console.error("Failed to export the local database snapshot.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
