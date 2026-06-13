export const snapshotTableNames = [
  "products",
  "users",
  "paymentMethods",
  "orders",
  "orderItems",
  "reviews",
  "reviewHelpful",
  "reviewImages",
  "reviewReports",
] as const;

export type SnapshotTableName = (typeof snapshotTableNames)[number];
export type SnapshotRow = unknown;

export type CheckConstraintSnapshot = {
  tableName: string;
  constraintName: string;
  definition: string;
};

export type DatabaseSnapshot = {
  formatVersion: 1;
  exportedAt: string;
  checkConstraints: CheckConstraintSnapshot[];
  tables: Record<SnapshotTableName, SnapshotRow[]>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCheckConstraint(
  value: unknown,
): value is CheckConstraintSnapshot {
  if (!isRecord(value)) return false;

  return (
    typeof value.tableName === "string" &&
    typeof value.constraintName === "string" &&
    typeof value.definition === "string" &&
    /^CHECK\s*\(/i.test(value.definition)
  );
}

export function parseDatabaseSnapshot(value: unknown): DatabaseSnapshot {
  if (!isRecord(value) || value.formatVersion !== 1) {
    throw new Error("Unsupported or invalid database snapshot.");
  }

  if (
    typeof value.exportedAt !== "string" ||
    Number.isNaN(Date.parse(value.exportedAt))
  ) {
    throw new Error("Snapshot export timestamp is missing or invalid.");
  }

  if (
    !Array.isArray(value.checkConstraints) ||
    !value.checkConstraints.every(isCheckConstraint)
  ) {
    throw new Error("Snapshot check constraints are missing or invalid.");
  }

  if (!isRecord(value.tables)) {
    throw new Error("Snapshot tables are missing or invalid.");
  }

  for (const tableName of snapshotTableNames) {
    if (!Array.isArray(value.tables[tableName])) {
      throw new Error(`Snapshot table "${tableName}" is missing or invalid.`);
    }
  }

  return value as DatabaseSnapshot;
}

export function countSnapshotRecords(snapshot: DatabaseSnapshot): number {
  return snapshotTableNames.reduce(
    (total, tableName) => total + snapshot.tables[tableName].length,
    0,
  );
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildCheckConstraintSql(
  constraint: CheckConstraintSnapshot,
): string {
  if (
    !/^CHECK\s*\(/i.test(constraint.definition) ||
    /;|--|\/\*/.test(constraint.definition)
  ) {
    throw new Error("Invalid check constraint definition.");
  }

  return [
    "ALTER TABLE",
    quoteIdentifier(constraint.tableName),
    "ADD CONSTRAINT",
    quoteIdentifier(constraint.constraintName),
    constraint.definition,
  ].join(" ");
}
