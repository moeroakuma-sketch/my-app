"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/cart-context";

export function CartSummary() {
  const { subtotal, items } = useCart();

  if (items.length === 0) return null;

  return (
    <aside className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
      <h2 className="text-lg font-semibold text-zinc-900">ご注文内容</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-600">小計</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-2 text-base">
          <dt className="font-semibold text-zinc-900">合計</dt>
          <dd className="font-bold text-zinc-900">{formatPrice(subtotal)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-zinc-500">
        送料は購入手続き時に計算されます。
      </p>
      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-lg bg-zinc-900 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800"
      >
        購入手続きへ
      </Link>
    </aside>
  );
}
