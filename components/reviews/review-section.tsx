import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { HelpfulButton, ReportReviewButton } from "@/components/reviews/review-actions";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewItemButton } from "@/components/reviews/review-edit";


type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  userName: string;
  productId: string;
  images: {
    id: string;
    imagePath: string;
  }[];
  viewerHelpful: boolean;
};

type ReviewSectionProps = {
  productId: string;
  reviews: ReviewItem[];
  reviewCount: number;
  averageRating: number | null;
  canReview: boolean;
  isLoggedIn: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="h-4 w-4"
          fill={star <= Math.round(value) ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ReviewSection({
  productId,
  reviews,
  reviewCount,
  averageRating,
  canReview,
  isLoggedIn,
  hasPurchased,
  hasReviewed,
}: ReviewSectionProps) {
  return (
    <section className="mt-14 border-t border-zinc-200 pt-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">レビュー</h2>
              <div className="mt-2 flex items-center gap-3 text-sm text-zinc-600">
                <Stars value={averageRating ?? 0} />
                <span>
                  {averageRating ? averageRating.toFixed(1) : "0.0"} / 5.0
                </span>
                <span>{reviewCount}件</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Stars value={review.rating} />
                        <span className="text-sm font-medium text-zinc-900">
                          {review.rating}.0
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        {review.userName}・{formatReviewDate(review.createdAt)}
                      </p>
                    </div>
                    <ReportReviewButton reviewId={review.id} />
                    <ReviewItemButton review={review as ReviewItem} />
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                    {review.comment}
                  </p>

                  {review.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
                      {review.images.map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100"
                        >
                          <Image
                            src={image.imagePath}
                            alt="レビュー画像"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 30vw, 160px"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <HelpfulButton
                      reviewId={review.id}
                      helpfulCount={review.helpfulCount}
                      initiallyHelpful={review.viewerHelpful}
                    />
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
                <p className="text-sm text-zinc-600">
                  まだレビューはありません。
                </p>
              </div>
            )}
          </div>
        </div>

        <aside>
          <h3 className="text-lg font-semibold text-zinc-900">レビューを書く</h3>
          <div className="mt-3">
            {canReview ? (
              <ReviewForm productId={productId} />
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                {!isLoggedIn ? (
                  <>
                    レビュー投稿にはログインが必要です。
                    <Link
                      href="/login"
                      className="ml-1 font-medium text-zinc-900 underline"
                    >
                      ログイン
                    </Link>
                  </>
                ) : hasReviewed ? (
                  "この商品にはすでにレビュー済みです。"
                ) : hasPurchased ? (
                  "レビュー投稿の条件を確認しています。"
                ) : (
                  "購入済みの商品だけレビューできます。"
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
