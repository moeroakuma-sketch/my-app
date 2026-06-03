"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 hover:text-zinc-900"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="hidden sm:inline">カート</span>
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-xs font-bold text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
