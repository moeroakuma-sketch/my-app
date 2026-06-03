"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2, ThumbsUp } from "lucide-react";
import {
  reportReview,
  toggleReviewHelpful,
  type ReviewActionResult,
} from "@/app/actions/review";

type HelpfulButtonProps = {
  reviewId: string;
  helpfulCount: number;
  initiallyHelpful: boolean;
};

export function HelpfulButton({
  reviewId,
  helpfulCount,
  initiallyHelpful,
}: HelpfulButtonProps) {
  const [count, setCount] = useState(helpfulCount);
  const [helpful, setHelpful] = useState(initiallyHelpful);
  const [result, setResult] = useState<ReviewActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const nextResult = await toggleReviewHelpful(reviewId);
            setResult(nextResult);

            if (nextResult.success) {
              setHelpful((current) => {
                setCount((currentCount) =>
                  current ? Math.max(0, currentCount - 1) : currentCount + 1,
                );
                return !current;
              });
            }
          });
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
          helpful
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        参考になった {count}
      </button>
      {result && !result.success && (
        <span className="text-xs text-red-600">{result.error}</span>
      )}
    </div>
  );
}

type ReportReviewButtonProps = {
  reviewId: string;
};

export function ReportReviewButton({ reviewId }: ReportReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("false_info");
  const [result, setResult] = useState<ReviewActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  if (result?.success) {
    return <p className="text-sm text-emerald-700">報告を受け付けました。</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
      >
        <Flag className="h-4 w-4" />
        報告
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      {!confirming ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-900">報告理由</p>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="radio"
              name={`reason-${reviewId}`}
              value="false_info"
              checked={reason === "false_info"}
              onChange={(event) => setReason(event.currentTarget.value)}
            />
            デマ・虚偽情報
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="radio"
              name={`reason-${reviewId}`}
              value="harassment"
              checked={reason === "harassment"}
              onChange={(event) => setReason(event.currentTarget.value)}
            />
            誹謗中傷
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              確認へ
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-700">
            「{reason === "false_info" ? "デマ・虚偽情報" : "誹謗中傷"}」として報告します。
          </p>
          {result && !result.success && (
            <p className="text-sm text-red-600">{result.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const formData = new FormData();
                formData.set("reason", reason);
                startTransition(async () => {
                  setResult(await reportReview(reviewId, formData));
                });
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              報告する
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700"
            >
              戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
