import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import type { Prisma } from "../app/generated/prisma/client";
import { prisma } from "./db-client";
import { databaseSnapshotPath, projectRoot } from "./db-paths";
import { getPrismaResetCommand } from "./db-reset-command";
import {
  buildCheckConstraintSql,
  countSnapshotRecords,
  parseDatabaseSnapshot,
  snapshotTableNames,
} from "./db-snapshot-format";

async function loadSnapshot() {
  const rawSnapshot = await readFile(databaseSnapshotPath, "utf8");
  return parseDatabaseSnapshot(JSON.parse(rawSnapshot));
}

async function confirmReset(): Promise<boolean> {
  if (process.env.DB_RESET_CONFIRM === "1") {
    return true;
  }

  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question(
    "This will erase the local database in DATABASE_URL. Type RESET to continue: ",
  );
  prompt.close();

  return answer === "RESET";
}

function resetSchema() {
  const resetCommand = getPrismaResetCommand(
    projectRoot,
    process.platform,
  );

  const result = spawnSync(
    resetCommand.command,
    resetCommand.args,
    {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Prisma reset failed with exit code ${result.status}.`);
  }
}

async function restoreSnapshot() {
  await access(databaseSnapshotPath);
  const snapshot = await loadSnapshot();

  if (!(await confirmReset())) {
    console.log("Database reset cancelled.");
    return;
  }

  await prisma.$disconnect();
  resetSchema();

  const tables = snapshot.tables;

  await prisma.$transaction(
    async (transaction) => {
      for (const constraint of snapshot.checkConstraints) {
        await transaction.$executeRawUnsafe(
          buildCheckConstraintSql(constraint),
        );
      }

      if (tables.users.length > 0) {
        await transaction.user.createMany({
          data: tables.users as Prisma.UserCreateManyInput[],
        });
      }
      if (tables.products.length > 0) {
        await transaction.product.createMany({
          data: tables.products as Prisma.ProductCreateManyInput[],
        });
      }
      if (tables.paymentMethods.length > 0) {
        await transaction.paymentMethod.createMany({
          data: tables.paymentMethods as Prisma.PaymentMethodCreateManyInput[],
        });
      }
      if (tables.orders.length > 0) {
        await transaction.order.createMany({
          data: tables.orders as Prisma.OrderCreateManyInput[],
        });
      }
      if (tables.orderItems.length > 0) {
        await transaction.orderItem.createMany({
          data: tables.orderItems as Prisma.OrderItemCreateManyInput[],
        });
      }
      if (tables.reviews.length > 0) {
        await transaction.review.createMany({
          data: tables.reviews as Prisma.ReviewCreateManyInput[],
        });
      }
      if (tables.reviewHelpful.length > 0) {
        await transaction.reviewHelpful.createMany({
          data:
            tables.reviewHelpful as Prisma.ReviewHelpfulCreateManyInput[],
        });
      }
      if (tables.reviewImages.length > 0) {
        await transaction.reviewImage.createMany({
          data: tables.reviewImages as Prisma.ReviewImageCreateManyInput[],
        });
      }
      if (tables.reviewReports.length > 0) {
        await transaction.reviewReport.createMany({
          data: tables.reviewReports as Prisma.ReviewReportCreateManyInput[],
        });
      }
    },
    {
      maxWait: 10_000,
      timeout: 120_000,
    },
  );

  console.log(`Restored ${countSnapshotRecords(snapshot)} rows.`);
  for (const tableName of snapshotTableNames) {
    console.log(`- ${tableName}: ${snapshot.tables[tableName].length}`);
  }
}

restoreSnapshot()
  .catch((error) => {
    console.error("Failed to reset and restore the local database.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
