import { vi } from "vitest";
import { prismaMock } from "./__tests__/test-utils/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
