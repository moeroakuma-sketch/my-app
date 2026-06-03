import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  prismaMock,
  resetPrismaMock,
  useTransactionMock,
} from "../test-utils/prisma";

const authMock = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
}));

const navigationMock = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

const revalidateMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const fsMock = vi.hoisted(() => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserId: authMock.getCurrentUserId,
}));

vi.mock("next/navigation", () => ({
  redirect: navigationMock.redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidateMock.revalidatePath,
}));

vi.mock("fs/promises", () => ({
  mkdir: fsMock.mkdir,
  writeFile: fsMock.writeFile,
  default: fsMock,
}));

import {
  createReview,
  reportReview,
  toggleReviewHelpful,
} from "@/app/actions/review";

function reviewForm(fields: Record<string, string | File | File[]>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const file of value) form.append(key, file);
    } else {
      form.set(key, value);
    }
  }
  return form;
}

function imageFile(type = "image/png", size = 1) {
  return new File([new Uint8Array(size)], "review-image", { type });
}

describe("review backend actions", () => {
  beforeEach(() => {
    resetPrismaMock();
    useTransactionMock();
    authMock.getCurrentUserId.mockReset();
    navigationMock.redirect.mockReset();
    revalidateMock.revalidatePath.mockReset();
    fsMock.mkdir.mockReset();
    fsMock.writeFile.mockReset();

    authMock.getCurrentUserId.mockResolvedValue("user-1");
    navigationMock.redirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
    fsMock.mkdir.mockResolvedValue(undefined);
    fsMock.writeFile.mockResolvedValue(undefined);
  });

  test("returns an error when the product does not exist", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce(null);

    await expect(createReview("product-1", new FormData())).resolves.toEqual({
      success: false,
      error: "商品が見つかりません。",
    });
  });

  test("redirects anonymous users to login after loading the product slug", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });
    authMock.getCurrentUserId.mockResolvedValueOnce(null);

    await expect(createReview("product-1", new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fproducts%2Fsample",
    );
  });

  test.each([
    ["missing rating", {}, "評価を選択してください。"],
    ["invalid rating", { rating: "bad" }, "評価は1〜5で選択してください。"],
    ["out of range rating", { rating: "6" }, "評価は1〜5で選択してください。"],
    ["empty comment", { rating: "5", comment: "  " }, "レビュー内容を入力してください。"],
    [
      "too long comment",
      { rating: "5", comment: "あ".repeat(1001) },
      "レビュー内容は1000文字以内で入力してください。",
    ],
  ])("rejects %s", async (_name, fields, error) => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });

    await expect(
      createReview("product-1", reviewForm(fields)),
    ).resolves.toEqual({
      success: false,
      error,
    });
  });

  test("rejects more than three images", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });

    await expect(
      createReview(
        "product-1",
        reviewForm({
          rating: "5",
          comment: "良い商品です",
          images: [imageFile(), imageFile(), imageFile(), imageFile()],
        }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "画像は3枚まで投稿できます。",
    });
  });

  test("rejects unsupported image types", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });

    await expect(
      createReview(
        "product-1",
        reviewForm({
          rating: "5",
          comment: "良い商品です",
          images: [imageFile("image/gif")],
        }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "画像はJPEG、PNG、WebPのみ投稿できます。",
    });
  });

  test("rejects images larger than 5MB", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });

    await expect(
      createReview(
        "product-1",
        reviewForm({
          rating: "5",
          comment: "良い商品です",
          images: [imageFile("image/png", 5 * 1024 * 1024 + 1)],
        }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "画像は1枚5MBまで投稿できます。",
    });
  });

  test("rejects reviews for products the user has not purchased", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });
    prismaMock.order.findFirst.mockResolvedValueOnce(null);

    await expect(
      createReview(
        "product-1",
        reviewForm({ rating: "5", comment: "良い商品です" }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "購入済みの商品だけレビューできます。",
    });
  });

  test("rejects duplicate reviews", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });
    prismaMock.order.findFirst.mockResolvedValueOnce({ id: "order-1" });
    prismaMock.review.findUnique.mockResolvedValueOnce({ id: "review-1" });

    await expect(
      createReview(
        "product-1",
        reviewForm({ rating: "5", comment: "良い商品です" }),
      ),
    ).resolves.toEqual({
      success: false,
      error: "この商品にはすでにレビュー済みです。",
    });
  });

  test("creates a review with image records and revalidates the product page", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ slug: "sample" });
    prismaMock.order.findFirst.mockResolvedValueOnce({ id: "order-1" });
    prismaMock.review.findUnique.mockResolvedValueOnce(null);
    prismaMock.review.create.mockResolvedValueOnce({});

    await expect(
      createReview(
        "product-1",
        reviewForm({
          rating: "5",
          comment: "良い商品です",
          images: [imageFile("image/png")],
        }),
      ),
    ).resolves.toEqual({ success: true });

    expect(fsMock.mkdir).toHaveBeenCalled();
    expect(fsMock.writeFile).toHaveBeenCalled();
    expect(prismaMock.review.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.any(String),
        userId: "user-1",
        productId: "product-1",
        rating: 5,
        comment: "良い商品です",
        ReviewImage: {
          create: [
            {
              id: expect.any(String),
              imagePath: expect.stringMatching(
                /^\/uploads\/reviews\/.+\/.+\.png$/,
              ),
            },
          ],
        },
      }),
    });
    expect(revalidateMock.revalidatePath).toHaveBeenCalledWith(
      "/products/sample",
    );
  });

  test("adds helpful to another user's review", async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      userId: "other-user",
      Product: { slug: "sample" },
    });
    prismaMock.reviewHelpful.findUnique.mockResolvedValueOnce(null);
    prismaMock.reviewHelpful.create.mockResolvedValueOnce({});
    prismaMock.review.update.mockResolvedValueOnce({});

    await expect(toggleReviewHelpful("review-1")).resolves.toEqual({
      success: true,
    });

    expect(prismaMock.reviewHelpful.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        reviewId: "review-1",
        userId: "user-1",
      },
    });
    expect(prismaMock.review.update).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: { helpfulCount: { increment: 1 } },
    });
  });

  test("removes existing helpful from another user's review", async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      userId: "other-user",
      Product: { slug: "sample" },
    });
    prismaMock.reviewHelpful.findUnique.mockResolvedValueOnce({ id: "helpful-1" });
    prismaMock.reviewHelpful.delete.mockResolvedValueOnce({});
    prismaMock.review.update.mockResolvedValueOnce({});

    await expect(toggleReviewHelpful("review-1")).resolves.toEqual({
      success: true,
    });

    expect(prismaMock.reviewHelpful.delete).toHaveBeenCalledWith({
      where: { id: "helpful-1" },
    });
    expect(prismaMock.review.update).toHaveBeenCalledWith({
      where: { id: "review-1" },
      data: { helpfulCount: { decrement: 1 } },
    });
  });

  test("rejects helpful on the user's own review", async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      userId: "user-1",
      Product: { slug: "sample" },
    });

    await expect(toggleReviewHelpful("review-1")).resolves.toEqual({
      success: false,
      error: "自分のレビューには押せません。",
    });
  });

  test("rejects invalid review report reasons", async () => {
    await expect(
      reportReview("review-1", reviewForm({ reason: "other" })),
    ).resolves.toEqual({
      success: false,
      error: "報告理由を選択してください。",
    });
  });

  test("rejects reporting the user's own review", async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      userId: "user-1",
      Product: { slug: "sample" },
    });

    await expect(
      reportReview("review-1", reviewForm({ reason: "false_info" })),
    ).resolves.toEqual({
      success: false,
      error: "自分のレビューは報告できません。",
    });
  });

  test("creates a review report and revalidates the product page", async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      userId: "other-user",
      Product: { slug: "sample" },
    });
    prismaMock.reviewReport.create.mockResolvedValueOnce({});

    await expect(
      reportReview("review-1", reviewForm({ reason: "harassment" })),
    ).resolves.toEqual({ success: true });

    expect(prismaMock.reviewReport.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        reviewId: "review-1",
        userId: "user-1",
        reason: "harassment",
        status: "pending",
      },
    });
    expect(revalidateMock.revalidatePath).toHaveBeenCalledWith(
      "/products/sample",
    );
  });

  test("reports duplicate review reports as an error", async () => {
    prismaMock.review.findUnique.mockResolvedValueOnce({
      userId: "other-user",
      Product: { slug: "sample" },
    });
    prismaMock.reviewReport.create.mockRejectedValueOnce(new Error("duplicate"));

    await expect(
      reportReview("review-1", reviewForm({ reason: "harassment" })),
    ).resolves.toEqual({
      success: false,
      error: "このレビューはすでに報告済みです。",
    });
  });
});
