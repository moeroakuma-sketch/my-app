"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";

export function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <li className="flex gap-4 border-b border-zinc-100 py-4 last:border-0">
      <Link
        href={`/products/${item.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100"
      >
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/products/${item.slug}`}
            className="font-medium text-zinc-900 hover:underline"
          >
            {item.name}
          </Link>
          <p className="mt-1 text-sm text-zinc-500">
            {formatPrice(item.price)} × {item.quantity}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-50"
              aria-label="数量を減らす"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              className="rounded border border-zinc-200 p-1.5 hover:bg-zinc-50"
              aria-label="数量を増やす"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-zinc-900">
              {formatPrice(item.price * item.quantity)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-zinc-400 hover:text-red-600"
              aria-label="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
