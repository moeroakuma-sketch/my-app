"use client";

import Link from "next/link";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">カートは空です</h1>
        <p className="mt-2 text-zinc-600">お気に入りの商品をカートに追加してください。</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          商品一覧へ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">ショッピングカート</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <ul className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white px-4">
          {items.map((item) => (
            <CartLineItem key={item.productId} item={item} />
          ))}
        </ul>
        <CartSummary />
      </div>
    </div>
  );
}
