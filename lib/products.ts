import { prisma } from "@/lib/prisma";

export async function getProducts(category?: string) {
  return prisma.product.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeaturedProducts(limit = 6) {
  return prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
  });
}

export async function getCategories() {
  const rows = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}
