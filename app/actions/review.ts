"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";

const MAX_COMMENT_LENGTH = 1000;
const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const REVIEWABLE_ORDER_STATUSES = ["paid", "shipping", "completed"];
const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);
}

function validateImages(files: File[]): string | null {
  if (files.length > MAX_IMAGE_COUNT) {
    return "画像は3枚まで投稿できます。";
  }

  for (const file of files) {
    if (!IMAGE_EXTENSIONS.has(file.type)) {
      return "画像はJPEG、PNG、WebPのみ投稿できます。";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "画像は1枚5MBまで投稿できます。";
    }
  }

  return null;
}

async function hasPurchasedProduct(userId: string, productId: string) {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: {
        in: REVIEWABLE_ORDER_STATUSES,
      },
      items: {
        some: {
          productId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return !!order;
}

async function saveReviewImages(reviewId: string, files: File[]) {
  if (files.length === 0) return [];

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "reviews",
    reviewId,
  );
  await mkdir(uploadDir, { recursive: true });

  const images: { id: string; imagePath: string }[] = [];

  for (const file of files) {
    const extension = IMAGE_EXTENSIONS.get(file.type);
    if (!extension) continue;

    const fileName = `${randomUUID()}.${extension}`;
    const imagePath = `/uploads/reviews/${reviewId}/${fileName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(path.join(uploadDir, fileName), bytes);
    images.push({
      id: randomUUID(),
      imagePath,
    });
  }

  return images;
}


//レビュー作成
export async function createReview(
  productId: string,
  formData: FormData,
): Promise<ReviewActionResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  if (!product) {
    return { success: false, error: "商品が見つかりません。" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`);
  }

  const ratingValue = formData.get("rating");
  if (typeof ratingValue !== "string") {
    return { success: false, error: "評価を選択してください。" };
  }

  const rating = Number(ratingValue);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "評価は1〜5で選択してください。" };
  }

  const comment = getString(formData, "comment").trim();
  if (!comment) {
    return { success: false, error: "レビュー内容を入力してください。" };
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    return {
      success: false,
      error: `レビュー内容は${MAX_COMMENT_LENGTH}文字以内で入力してください。`,
    };
  }

  const imageFiles = getImageFiles(formData);
  const imageError = validateImages(imageFiles);
  if (imageError) {
    return { success: false, error: imageError };
  }

  const purchased = await hasPurchasedProduct(userId, productId);
  if (!purchased) {
    return { success: false, error: "購入済みの商品だけレビューできます。" };
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    select: { id: true },
  });

  if (existingReview) {
    return { success: false, error: "この商品にはすでにレビュー済みです。" };
  }

  const reviewId = randomUUID();

  try {
    const images = await saveReviewImages(reviewId, imageFiles);

    await prisma.review.create({
      data: {
        id: reviewId,
        userId,
        productId,
        rating,
        comment,
        ...(images.length > 0
          ? {
              ReviewImage: {
                create: images,
              },
            }
          : {}),
      },
    });
  } catch {
    return {
      success: false,
      error: "レビューの投稿に失敗しました。時間をおいてもう一度お試しください。",
    };
  }

  revalidatePath(`/products/${product.slug}`);
  return { success: true };
}

//レビュー編集
export async function updateReview(
  reviewId: string,
  productId: string,
  formData: FormData,
): Promise<ReviewActionResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { success: false, error: "商品が見つかりません。" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`);
  }

  const ratingValue = formData.get("rating");
  if (typeof ratingValue !== "string") {
    return { success: false, error: "評価を選択してください。" };
  }

  const rating = Number(ratingValue);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "評価は1〜5で選択してください。" };
  }

  const comment = getString(formData, "comment").trim();
  if (!comment) {
    return { success: false, error: "レビュー内容を入力してください。" };
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    return {
      success: false,
      error: `レビュー内容は${MAX_COMMENT_LENGTH}文字以内で入力してください。`,
    };
  }

  const imageFiles = getImageFiles(formData);
  const imageError = validateImages(imageFiles);
  if (imageError) {
    return { success: false, error: imageError };
  }

  const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
  });

  try {
    //const images = await saveReviewImages(reviewId, imageFiles);

    const updated = await prisma.review.updateMany({
      where: { id: reviewId, userId },
      data: { rating, comment },
    });
    
    if (updated.count === 0) {
      return {
        success: false,
        error: "更新対象のレビューが見つかりません。",
      };
    }
  } catch {
    return {
      success: false,
      error: "レビューの投稿に失敗しました。時間をおいてもう一度お試しください。",
    };
  }

  revalidatePath(`/products/${product.slug}`);
  return { success: true };
}

export async function toggleReviewHelpful(
  reviewId: string,
): Promise<ReviewActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      userId: true,
      Product: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!review) {
    return { success: false, error: "レビューが見つかりません。" };
  }

  if (review.userId === userId) {
    return { success: false, error: "自分のレビューには押せません。" };
  }

  const existing = await prisma.reviewHelpful.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.reviewHelpful.delete({
        where: {
          id: existing.id,
        },
      }),
      prisma.review.update({
        where: {
          id: reviewId,
        },
        data: {
          helpfulCount: {
            decrement: 1,
          },
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.reviewHelpful.create({
        data: {
          id: randomUUID(),
          reviewId,
          userId,
        },
      }),
      prisma.review.update({
        where: {
          id: reviewId,
        },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  revalidatePath(`/products/${review.Product.slug}`);
  return { success: true };
}

export async function reportReview(
  reviewId: string,
  formData: FormData,
): Promise<ReviewActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  const reason = getString(formData, "reason");
  if (reason !== "false_info" && reason !== "harassment") {
    return { success: false, error: "報告理由を選択してください。" };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      userId: true,
      Product: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!review) {
    return { success: false, error: "レビューが見つかりません。" };
  }

  if (review.userId === userId) {
    return { success: false, error: "自分のレビューは報告できません。" };
  }

  try {
    await prisma.reviewReport.create({
      data: {
        id: randomUUID(),
        reviewId,
        userId,
        reason,
        status: "pending",
      },
    });
  } catch {
    return { success: false, error: "このレビューはすでに報告済みです。" };
  }

  revalidatePath(`/products/${review.Product.slug}`);
  return { success: true };
}
