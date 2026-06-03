"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Star } from "lucide-react";
import { createReview, type ReviewActionResult } from "@/app/actions/review";

type ReviewFormProps = {
  productId: string;
};

export function ReviewForm({ productId }: ReviewFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [rating, setRating] = useState(5);
  const [selectedImageCount, setSelectedImageCount] = useState(0);
  const [result, setResult] = useState<ReviewActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("rating", String(rating));

    startTransition(async () => {
      const nextResult = await createReview(productId, formData);
      setResult(nextResult);

      if (nextResult.success) {
        form.reset();
        setRating(5);
        setSelectedImageCount(0);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div>
        <p className="text-sm font-medium text-zinc-900">評価</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded-md p-1 text-amber-500 transition hover:bg-amber-50"
              aria-label={`${value}点`}
            >
              <Star
                className="h-6 w-6"
                fill={value <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-zinc-900">レビュー内容</span>
        <textarea
          name="comment"
          required
          maxLength={1000}
          rows={5}
          className="mt-2 w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-zinc-900">画像</span>
        <span className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-100">
          <ImagePlus className="h-4 w-4" />
          {selectedImageCount > 0
            ? `${selectedImageCount}枚選択中`
            : "画像を選択"}
        </span>
        <input
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            setSelectedImageCount(event.currentTarget.files?.length ?? 0);
          }}
        />
      </label>

      {result && !result.success && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {result.error}
        </p>
      )}
      {result?.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          レビューを投稿しました。
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        投稿する
      </button>
    </form>
  );
}
