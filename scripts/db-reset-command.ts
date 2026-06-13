import path from "node:path";

type SupportedPlatform = "win32" | string;

export function getPrismaResetCommand(
  projectRoot: string,
  platform: SupportedPlatform,
) {
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const executableName = platform === "win32" ? "prisma.cmd" : "prisma";

  return {
    command: pathApi.resolve(
      projectRoot,
      "node_modules",
      ".bin",
      executableName,
    ),
    args: ["db", "push", "--force-reset"],
  };
}
