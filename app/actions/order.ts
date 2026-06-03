"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const checkoutSchema = z.object({
  customerName: z.string().min(1, "氏名を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  postalCode: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(7, "郵便番号は7桁で入力してください")),
  prefecture: z.string().min(1, "都道府県を入力してください"),
  city: z.string().min(1, "市区町村を入力してください"),
  town: z.string(),
  addressLine: z
    .string()
    .min(1, "番地・建物名を入力してください")
    .max(200, "番地・建物名が長すぎます"),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{10,11}$/, "電話番号は10〜11桁の数字で入力してください"),
    ),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "カートが空です"),
});

export type CreateOrderInput = z.infer<typeof checkoutSchema>;

export type CreateOrderResult =
  | { success: true; orderId: string }
  | { success: false; error: string };

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "入力内容に誤りがあります";
    return { success: false, error: first };
  }

  const data = parsed.data;
  const userId = await getCurrentUserId();

  const aggregated = new Map<string, number>();
  for (const item of data.items) {
    aggregated.set(
      item.productId,
      (aggregated.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const productIds = [...aggregated.keys()];

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new Error("存在しない商品が含まれています");
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      let total = 0;
      const orderItems: {
        productId: string;
        quantity: number;
        unitPrice: number;
      }[] = [];

      for (const [productId, quantity] of aggregated) {
        const product = productMap.get(productId);
        if (!product) {
          throw new Error("存在しない商品が含まれています");
        }
        if (product.stock < quantity) {
          throw new Error(`「${product.name}」の在庫が不足しています`);
        }

        const updated = await tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count !== 1) {
          throw new Error(`「${product.name}」の在庫が不足しています`);
        }

        total += product.price * quantity;
        orderItems.push({
          productId,
          quantity,
          unitPrice: product.price,
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          customerName: data.customerName,
          email: data.email,
          postalCode: data.postalCode,
          prefecture: data.prefecture,
          city: data.city,
          town: data.town,
          addressLine: data.addressLine,
          phone: data.phone,
          total,
          status: "received",
          items: {
            create: orderItems,
          },
        },
      });

      return order.id;
    });

    return { success: true, orderId };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "注文の処理中にエラーが発生しました";
    return { success: false, error: message };
  }
}

export async function cancelOrder(formData: FormData) {
  const userId = await getCurrentUserId();
  const orderId = formData.get("orderId");

  if (!userId || typeof orderId !== "string") {
    return;
  }

  await prisma.order.updateMany({
    where: {
      id: orderId,
      userId,
      status: "received",
    },
    data: {
      status: "cancelled",
    },
  });

  revalidatePath("/history");
}
