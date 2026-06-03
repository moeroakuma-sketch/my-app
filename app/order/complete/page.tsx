import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatFullAddress, formatPostalCode, formatPrice } from "@/lib/format";

type SearchParams = Promise<{ id?: string }>;

export default async function OrderCompletePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;

  if (!id) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const fullAddress = formatFullAddress(order);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
      <h1 className="mt-6 text-3xl font-bold text-zinc-900">
        ご注文ありがとうございます
      </h1>
      <p className="mt-2 text-zinc-600">
        注文を受け付けました。確認メールを {order.email} にお送りします（デモ）。
      </p>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 text-left text-sm">
        <p>
          <span className="text-zinc-500">注文番号:</span>{" "}
          <span className="font-mono font-medium">{order.id}</span>
        </p>
        <p className="mt-2">
          <span className="text-zinc-500">合計:</span>{" "}
          <span className="text-lg font-bold">{formatPrice(order.total)}</span>
        </p>
        <hr className="my-4 border-zinc-100" />
        <p className="text-zinc-500">お届け先</p>
        <p className="mt-1 font-medium">{order.customerName}</p>
        <p className="mt-1 text-zinc-700">
          〒{formatPostalCode(order.postalCode)}
          <br />
          {fullAddress}
          <br />
          TEL: {order.phone}
        </p>
        <hr className="my-4 border-zinc-100" />
        <p className="text-zinc-500">ご注文内容</p>
        <ul className="mt-2 space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/products"
        className="mt-8 inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
      >
        買い物を続ける
      </Link>
    </div>
  );
}
