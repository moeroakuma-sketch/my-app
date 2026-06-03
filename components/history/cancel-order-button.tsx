// components/history/cancel-order-button.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cancelOrder } from "@/app/actions/order";

type CancelOrderButtonProps = {
  orderId: string;
};

export function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        注文取消し
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  注文を取り消しますか？
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  この操作を行うと、注文ステータスがキャンセルに変更されます。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                戻る
              </button>

              <form action={cancelOrder}>
                <input type="hidden" name="orderId" value={orderId} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  取り消す
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}