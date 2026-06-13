import { describe, expect, test } from "vitest";
import {
  buildCheckConstraintSql,
  countSnapshotRecords,
  parseDatabaseSnapshot,
} from "@/scripts/db-snapshot-format";

const validSnapshot = {
  formatVersion: 1,
  exportedAt: "2026-06-13T00:00:00.000Z",
  checkConstraints: [
    {
      tableName: "Review",
      constraintName: "Review_rating_check",
      definition: "CHECK (((rating >= 1) AND (rating <= 5)))",
    },
  ],
  tables: {
    products: [{ id: "product-1" }],
    users: [{ id: "user-1" }],
    paymentMethods: [],
    orders: [],
    orderItems: [],
    reviews: [{ id: "review-1" }],
    reviewHelpful: [],
    reviewImages: [],
    reviewReports: [],
  },
};

describe("parseDatabaseSnapshot", () => {
  test("accepts a snapshot containing every required table", () => {
    expect(parseDatabaseSnapshot(validSnapshot)).toEqual(validSnapshot);
  });

  test("rejects a snapshot with a missing table", () => {
    const invalidSnapshot = structuredClone(validSnapshot);
    delete (invalidSnapshot.tables as Partial<typeof invalidSnapshot.tables>)
      .orders;

    expect(() => parseDatabaseSnapshot(invalidSnapshot)).toThrow(
      "Snapshot table \"orders\" is missing or invalid.",
    );
  });
});

test("countSnapshotRecords totals rows across all tables", () => {
  const snapshot = parseDatabaseSnapshot(validSnapshot);

  expect(countSnapshotRecords(snapshot)).toBe(3);
});

test("buildCheckConstraintSql safely quotes identifiers", () => {
  expect(
    buildCheckConstraintSql({
      tableName: 'Review"Archive',
      constraintName: 'rating"check',
      definition: "CHECK (rating BETWEEN 1 AND 5)",
    }),
  ).toBe(
    'ALTER TABLE "Review""Archive" ADD CONSTRAINT "rating""check" CHECK (rating BETWEEN 1 AND 5)',
  );
});

test("buildCheckConstraintSql rejects non-check SQL", () => {
  expect(() =>
    buildCheckConstraintSql({
      tableName: "Review",
      constraintName: "unsafe",
      definition: "DROP TABLE Review",
    }),
  ).toThrow("Invalid check constraint definition.");
});
