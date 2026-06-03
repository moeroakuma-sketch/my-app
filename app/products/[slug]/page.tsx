import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ReviewSection } from "@/components/reviews/review-section";
import { getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const REVIEWABLE_ORDER_STATUSES = ["paid", "shipping", "completed"];

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const currentUserId = await getCurrentUserId();
  const [reviews, reviewSummary, purchasedOrder, existingReview] =
    await Promise.all([
      prisma.review.findMany({
        where: {
          productId: product.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          helpfulCount: true,
          productId: true,
          createdAt: true,
          User: {
            select: {
              name: true,
            },
          },
          ReviewImage: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              imagePath: true,
            },
          },
          ReviewHelpful: {
            where: {
              userId: currentUserId ?? "",
            },
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.review.aggregate({
        where: {
          productId: product.id,
        },
        _avg: {
          rating: true,
        },
        _count: {
          _all: true,
        },
      }),
      currentUserId
        ? prisma.order.findFirst({
            where: {
              userId: currentUserId,
              status: {
                in: REVIEWABLE_ORDER_STATUSES,
              },
              items: {
                some: {
                  productId: product.id,
                },
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
      currentUserId
        ? prisma.review.findUnique({
            where: {
              userId_productId: {
                userId: currentUserId,
                productId: product.id,
              },
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);

  const hasPurchased = !!purchasedOrder;
  const hasReviewed = !!existingReview;
  const canReview = !!currentUserId && hasPurchased && !hasReviewed;
  const reviewItems = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    helpfulCount: review.helpfulCount,
    productId : review.productId,
    createdAt: review.createdAt.toISOString(),
    userName: review.User.name,
    images: review.ReviewImage,
    viewerHelpful: review.ReviewHelpful.length > 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/products" className="hover:text-zinc-900">
          商品一覧
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        <div>
          <span className="text-sm text-zinc-500">{product.category}</span>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold text-zinc-900">
            {formatPrice(product.price)}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {product.stock > 0 ? (
              <>在庫: {product.stock} 点</>
            ) : (
              <span className="font-medium text-red-600">在庫切れ</span>
            )}
          </p>
          <p className="mt-6 leading-relaxed text-zinc-600">{product.description}</p>

          <div className="mt-8">
            <AddToCartButton product={product} showQuantitySelect />
          </div>
        </div>
      </div>

      <ReviewSection
        productId={product.id}
        reviews={reviewItems}
        reviewCount={reviewSummary._count._all}
        averageRating={reviewSummary._avg.rating}
        canReview={canReview}
        isLoggedIn={!!currentUserId}
        hasPurchased={hasPurchased}
        hasReviewed={hasReviewed}
      />
    </div>
  );
}
