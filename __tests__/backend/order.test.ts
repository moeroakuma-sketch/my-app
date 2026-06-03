import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  prismaMock,
  resetPrismaMock,
  transactionClientMock,
  useTransactionMock,
} from "../test-utils/prisma";

const authMock = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
}));

const revalidateMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: authMock.getCurrentUserId,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidateMock.revalidatePath,
}));

import { cancelOrder, createOrder, type CreateOrderInput } from "@/app/actions/order";

const validOrderInput: CreateOrderInput = {
  customerName: "山田 太郎",
  email: "taro@example.com",
  postalCode: "123-4567",
  prefecture: "東京都",
  city: "渋谷区",
  town: "神南",
  addressLine: "1-1-1",
  phone: "03-1234-5678",
  items: [{ productId: "product-1", quantity: 1 }],
};

describe("order backend actions", () => {
  beforeEach(() => {
    resetPrismaMock();
    authMock.getCurrentUserId.mockReset();
    revalidateMock.revalidatePath.mockReset();
    authMock.getCurrentUserId.mockResolvedValue("user-1");
    useTransactionMock();
  });

  test("returns a validation error before opening a transaction when the cart is empty", async () => {
    const result = await createOrder({
      ...validOrderInput,
      items: [],
    });

    expect(result).toEqual({ success: false, error: "カートが空です" });
    expect(authMock.getCurrentUserId).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  test.each([
    ["invalid email", { email: "not-an-email" }, "有効なメールアドレスを入力してください"],
    ["invalid postal code", { postalCode: "123" }, "郵便番号は7桁で入力してください"],
    ["invalid phone", { phone: "12345" }, "電話番号は10〜11桁の数字で入力してください"],
    ["zero quantity", { items: [{ productId: "product-1", quantity: 0 }] }, "Too small: expected number to be >=1"],
    ["negative quantity", { items: [{ productId: "product-1", quantity: -1 }] }, "Too small: expected number to be >=1"],
    ["decimal quantity", { items: [{ productId: "product-1", quantity: 1.5 }] }, "Invalid input: expected int, received number"],
  ])(
    "returns a validation error before opening a transaction for %s",
    async (_name, override, expectedError) => {
      const result = await createOrder({
        ...validOrderInput,
        ...override,
      });

      expect(result).toEqual({ success: false, error: expectedError });
      expect(authMock.getCurrentUserId).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    },
  );

  test("creates an order with aggregated quantities and decremented stock", async () => {
    transactionClientMock.product.findMany.mockResolvedValueOnce([
      {
        id: "product-1",
        name: "テスト商品A",
        price: 1000,
        stock: 10,
      },
      {
        id: "product-2",
        name: "テスト商品B",
        price: 500,
        stock: 2,
      },
    ]);
    transactionClientMock.product.updateMany.mockResolvedValue({ count: 1 });
    transactionClientMock.order.create.mockResolvedValueOnce({ id: "order-1" });

    const result = await createOrder({
      ...validOrderInput,
      items: [
        { productId: "product-1", quantity: 1 },
        { productId: "product-1", quantity: 2 },
        { productId: "product-2", quantity: 1 },
      ],
    });

    expect(result).toEqual({ success: true, orderId: "order-1" });
    expect(transactionClientMock.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["product-1", "product-2"] } },
    });
    expect(transactionClientMock.product.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: "product-1", stock: { gte: 3 } },
      data: { stock: { decrement: 3 } },
    });
    expect(transactionClientMock.product.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: "product-2", stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });
    expect(transactionClientMock.order.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        customerName: "山田 太郎",
        email: "taro@example.com",
        postalCode: "1234567",
        prefecture: "東京都",
        city: "渋谷区",
        town: "神南",
        addressLine: "1-1-1",
        phone: "0312345678",
        total: 3500,
        status: "received",
        items: {
          create: [
            { productId: "product-1", quantity: 3, unitPrice: 1000 },
            { productId: "product-2", quantity: 1, unitPrice: 500 },
          ],
        },
      },
    });
  });

  test("returns an error when requested quantity exceeds available stock", async () => {
    transactionClientMock.product.findMany.mockResolvedValueOnce([
      {
        id: "product-1",
        name: "テスト商品A",
        price: 1000,
        stock: 1,
      },
    ]);

    const result = await createOrder({
      ...validOrderInput,
      items: [{ productId: "product-1", quantity: 2 }],
    });

    expect(result).toEqual({
      success: false,
      error: "「テスト商品A」の在庫が不足しています",
    });
    expect(transactionClientMock.product.updateMany).not.toHaveBeenCalled();
    expect(transactionClientMock.order.create).not.toHaveBeenCalled();
  });

  test("returns an error when a product id does not exist", async () => {
    transactionClientMock.product.findMany.mockResolvedValueOnce([]);

    const result = await createOrder(validOrderInput);

    expect(result).toEqual({
      success: false,
      error: "存在しない商品が含まれています",
    });
    expect(transactionClientMock.product.updateMany).not.toHaveBeenCalled();
    expect(transactionClientMock.order.create).not.toHaveBeenCalled();
  });

  test("returns an error when a concurrent stock update fails", async () => {
    transactionClientMock.product.findMany.mockResolvedValueOnce([
      {
        id: "product-1",
        name: "テスト商品A",
        price: 1000,
        stock: 5,
      },
    ]);
    transactionClientMock.product.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await createOrder({
      ...validOrderInput,
      items: [{ productId: "product-1", quantity: 2 }],
    });

    expect(result).toEqual({
      success: false,
      error: "「テスト商品A」の在庫が不足しています",
    });
    expect(transactionClientMock.order.create).not.toHaveBeenCalled();
  });

  test("returns the fallback message when the transaction throws a non-Error value", async () => {
    prismaMock.$transaction.mockRejectedValueOnce("unexpected");

    const result = await createOrder(validOrderInput);

    expect(result).toEqual({
      success: false,
      error: "注文の処理中にエラーが発生しました",
    });
  });

  test("cancels only the current user's received order and revalidates history", async () => {
    prismaMock.order.updateMany.mockResolvedValueOnce({ count: 1 });
    const formData = new FormData();
    formData.set("orderId", "order-1");

    await cancelOrder(formData);

    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        userId: "user-1",
        status: "received",
      },
      data: {
        status: "cancelled",
      },
    });
    expect(revalidateMock.revalidatePath).toHaveBeenCalledWith("/history");
  });

  test("does not cancel an order when no user is logged in", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce(null);
    const formData = new FormData();
    formData.set("orderId", "order-1");

    await cancelOrder(formData);

    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    expect(revalidateMock.revalidatePath).not.toHaveBeenCalled();
  });

  test("does not cancel an order when orderId is missing", async () => {
    await cancelOrder(new FormData());

    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    expect(revalidateMock.revalidatePath).not.toHaveBeenCalled();
  });

  test("does not cancel an order when orderId is not a string", async () => {
    const formData = new FormData();
    formData.set("orderId", new File(["id"], "order.txt"));

    await cancelOrder(formData);

    expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    expect(revalidateMock.revalidatePath).not.toHaveBeenCalled();
  });
});
