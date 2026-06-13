import { describe, expect, test } from "vitest";
import { getPrismaResetCommand } from "@/scripts/db-reset-command";

describe("getPrismaResetCommand", () => {
  test("uses the local Windows Prisma executable", () => {
    expect(getPrismaResetCommand("C:\\project", "win32")).toEqual({
      command: "C:\\project\\node_modules\\.bin\\prisma.cmd",
      args: ["db", "push", "--force-reset"],
    });
  });

  test("uses the local POSIX Prisma executable", () => {
    expect(getPrismaResetCommand("/project", "linux")).toEqual({
      command: "/project/node_modules/.bin/prisma",
      args: ["db", "push", "--force-reset"],
    });
  });
});
