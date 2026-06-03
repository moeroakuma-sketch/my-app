import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-zinc-900">商品が見つかりません</h1>
      <p className="mt-2 text-zinc-600">
        お探しの商品は存在しないか、削除された可能性があります。
      </p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
      >
        商品一覧へ
      </Link>
    </div>
  );
}
