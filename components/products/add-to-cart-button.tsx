"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

type AddToCartButtonProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  };
  showQuantitySelect?: boolean;
};

export function AddToCartButton({
  product,
  showQuantitySelect = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.min(product.stock, 10);

  if (product.stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-lg bg-zinc-200 px-6 py-3 text-sm font-medium text-zinc-500"
      >
        在庫切れ
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {showQuantitySelect && (
        <label className="block text-sm font-medium text-zinc-700">
          個数
          <select
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            {Array.from({ length: maxQuantity }, (_, index) => {
              const value = index + 1;
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              );
            })}
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          addItem(
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
            },
            quantity,
          );
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        <ShoppingCart className="h-4 w-4" />
        {added ? "カートに追加しました" : "カートに追加"}
      </button>
    </div>
  );
}
