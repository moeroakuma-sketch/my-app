import { beforeEach, describe, expect, test } from "vitest";
import { prismaMock, resetPrismaMock } from "../test-utils/prisma";

import {
  getCategories,
  getFeaturedProducts,
  getProductBySlug,
  getProducts,
} from "@/lib/products";

describe("product backend queries", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  test("gets products ordered by newest without a category filter", async () => {
    prismaMock.product.findMany.mockResolvedValueOnce([]);

    await getProducts();

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
    });
  });

  test("gets products ordered by newest with a category filter", async () => {
    prismaMock.product.findMany.mockResolvedValueOnce([]);

    await getProducts("coffee");

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: { category: "coffee" },
      orderBy: { createdAt: "desc" },
    });
  });

  test("treats an empty category as no category filter", async () => {
    prismaMock.product.findMany.mockResolvedValueOnce([]);

    await getProducts("");

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: "desc" },
    });
  });

  test("gets in-stock featured products using the requested limit", async () => {
    prismaMock.product.findMany.mockResolvedValueOnce([]);

    await getFeaturedProducts(3);

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: { stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  });

  test("uses a default featured product limit of 6", async () => {
    prismaMock.product.findMany.mockResolvedValueOnce([]);

    await getFeaturedProducts();

    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      where: { stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  });

  test("gets a product by slug", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null);

    await getProductBySlug("sample-product");

    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { slug: "sample-product" },
    });
  });

  test("maps distinct category rows to category names", async () => {
    prismaMock.product.findMany.mockResolvedValueOnce([
      { category: "coffee" },
      { category: "tea" },
    ]);

    await expect(getCategories()).resolves.toEqual(["coffee", "tea"]);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
  });

  test("returns an empty category list when Prisma returns no rows", async () => {
    prismaMock.product.findMany.mockResolvedValueOnce([]);

    await expect(getCategories()).resolves.toEqual([]);
  });
});
