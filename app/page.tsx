import Link from "next/link";
import { ProductGrid } from "@/components/products/product-grid";
import { getFeaturedProducts } from "@/lib/products";

export default async function HomePage() {
  const featured = await getFeaturedProducts(6);

  return (
    <>
      <section className="bg-zinc-900 px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            暮らしを豊かにする
            <br />
            セレクトショップ
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">
            厳選されたアイテムを、シンプルで快適なお買い物体験でお届けします。
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            商品を見る
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-zinc-900">おすすめ商品</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            すべて見る →
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
    </>
  );
}
