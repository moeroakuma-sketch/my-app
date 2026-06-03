import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, PackageSearch, ReceiptText, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CancelOrderButton } from "@/components/history/cancel-order-button";


type OrderHistoryItem = {
  id: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
};

type OrderHistoryOrder = {
  id: string;
  createdAt: string;
  status: "received" | "paid" | "shipping" | "completed" | "cancelled" | string;
  total: number;
  items: OrderHistoryItem[];
};

const statusLabel: Record<string, string> = {
  received: "受付済み",
  paid: "支払い済み",
  shipping: "配送中",
  completed: "完了",
  cancelled: "キャンセル",
};

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function HistoryPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login?next=/history");
  }

  const rawOrders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const orders: OrderHistoryOrder[] = rawOrders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    total: order.total,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.product.name,
      productImageUrl: item.product.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  }));

  const hasOrders = orders.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">注文履歴</h1>
          <p className="mt-2 text-sm text-zinc-600">
            過去の注文内容、合計金額、配送状況を確認できます。
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <ShoppingBag className="h-4 w-4" />
          買い物を続ける
        </Link>
      </div>

      {hasOrders ? (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-zinc-500" />
                    <p className="font-mono text-sm font-semibold text-zinc-900">
                      {order.id}
                    </p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
                    <Clock3 className="h-4 w-4" />
                    {formatOrderDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-medium text-zinc-500">合計</p>
                  <p className="text-xl font-bold text-zinc-900">
                    {formatPrice(order.total)}
                  </p>
                  {order.status === "received" && (
  <div className="mt-3">
    <CancelOrderButton orderId={order.id} />
  </div>
)}
                </div>
              </div>

              <div className="divide-y divide-zinc-100">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[64px_1fr] gap-4 px-4 py-4 sm:grid-cols-[72px_1fr_auto] sm:items-center sm:px-5"
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-zinc-100">
                      {item.productImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <PackageSearch className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatPrice(item.unitPrice)} x {item.quantity}
                      </p>
                    </div>

                    <p className="col-start-2 text-sm font-semibold text-zinc-900 sm:col-start-auto">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <PackageSearch className="mx-auto h-12 w-12 text-zinc-400" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">
            注文履歴はまだありません
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            注文が完了すると、このページに購入内容とステータスが表示されます。
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <ShoppingBag className="h-4 w-4" />
            商品を見る
          </Link>
        </div>
      )}
    </div>
  );
}
