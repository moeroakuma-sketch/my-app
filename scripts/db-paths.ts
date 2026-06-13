import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const databaseSnapshotPath = resolve(
  projectRoot,
  "prisma",
  "snapshots",
  "local.json",
);
