import { vi, type Mock } from "vitest";

function createMock() {
  return vi.fn();
}

function failFast(name: string) {
  return () => {
    throw new Error(`Unexpected Prisma call: ${name}. Mock it in this test.`);
  };
}

function resetMock(mock: Mock, name: string) {
  mock.mockReset();
  mock.mockImplementation(failFast(name));
}

export const transactionClientMock = {
  product: {
    findMany: createMock(),
    updateMany: createMock(),
  },
  order: {
    create: createMock(),
  },
};

export const prismaMock = {
  $transaction: createMock(),
  product: {
    findMany: createMock(),
    findUnique: createMock(),
  },
  order: {
    findFirst: createMock(),
    updateMany: createMock(),
  },
  user: {
    findUnique: createMock(),
    create: createMock(),
    update: createMock(),
    delete: createMock(),
  },
  paymentMethod: {
    findFirst: createMock(),
    create: createMock(),
    update: createMock(),
  },
  review: {
    findUnique: createMock(),
    create: createMock(),
    update: createMock(),
  },
  reviewHelpful: {
    findUnique: createMock(),
    create: createMock(),
    delete: createMock(),
  },
  reviewReport: {
    create: createMock(),
  },
};

export function resetPrismaMock() {
  resetMock(prismaMock.$transaction, "prisma.$transaction");
  resetMock(prismaMock.product.findMany, "prisma.product.findMany");
  resetMock(prismaMock.product.findUnique, "prisma.product.findUnique");
  resetMock(prismaMock.order.findFirst, "prisma.order.findFirst");
  resetMock(prismaMock.order.updateMany, "prisma.order.updateMany");
  resetMock(prismaMock.user.findUnique, "prisma.user.findUnique");
  resetMock(prismaMock.user.create, "prisma.user.create");
  resetMock(prismaMock.user.update, "prisma.user.update");
  resetMock(prismaMock.user.delete, "prisma.user.delete");
  resetMock(prismaMock.paymentMethod.findFirst, "prisma.paymentMethod.findFirst");
  resetMock(prismaMock.paymentMethod.create, "prisma.paymentMethod.create");
  resetMock(prismaMock.paymentMethod.update, "prisma.paymentMethod.update");
  resetMock(prismaMock.review.findUnique, "prisma.review.findUnique");
  resetMock(prismaMock.review.create, "prisma.review.create");
  resetMock(prismaMock.review.update, "prisma.review.update");
  resetMock(prismaMock.reviewHelpful.findUnique, "prisma.reviewHelpful.findUnique");
  resetMock(prismaMock.reviewHelpful.create, "prisma.reviewHelpful.create");
  resetMock(prismaMock.reviewHelpful.delete, "prisma.reviewHelpful.delete");
  resetMock(prismaMock.reviewReport.create, "prisma.reviewReport.create");

  resetMock(transactionClientMock.product.findMany, "tx.product.findMany");
  resetMock(transactionClientMock.product.updateMany, "tx.product.updateMany");
  resetMock(transactionClientMock.order.create, "tx.order.create");
}

export function useTransactionMock() {
  prismaMock.$transaction.mockImplementation(async (input) => {
    if (Array.isArray(input)) {
      return Promise.all(input);
    }
    return input(transactionClientMock);
  });
}
