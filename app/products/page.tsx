import Link from "next/link";
import { ProductGrid } from "@/components/products/product-grid";
import { getCategories, getProducts } from "@/lib/products";

type SearchParams = Promise<{ category?: string }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(category),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">商品一覧</h1>

      {categories.length > 0 && (
        <nav className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              !category
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            すべて
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === cat
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {cat}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
