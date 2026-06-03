"use client";

import { useState, useTransition } from "react";
import { updateReview, type ReviewActionResult } from "@/app/actions/review";

type Review = {
  id: string;
  rating: number;
  comment: string;
  productId: string;
};

export function ReviewItemButton({ review }: { review: Review }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftComment, setDraftComment] = useState(review.comment);
  const [draftRating, setDraftRating] = useState(review.rating);
  const [result, setResult] = useState<ReviewActionResult | null>(null);
  const [isPending, startTransition] = useTransition();


  function startEdit() {
    setDraftComment(review.comment);
    setDraftRating(review.rating);
    setIsEditing(true);
  }

  function cancelEdit() {
    setDraftComment(review.comment);
    setDraftRating(review.rating);
    setIsEditing(false);
  }

  function saveEdit(event: React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    console.log(draftComment, draftRating);
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("rating", String(draftRating));
    formData.set("comment", draftComment);

    startTransition(async () => {
      const nextResult = await updateReview(review.id,review.productId,formData);
      setResult(nextResult);
      if (nextResult.success) {
        setIsEditing(false);
      }
    });
  }

  if (isEditing) {
    return (
        <form onSubmit={saveEdit}>
        <select
          value={draftRating}
          onChange={(e) => setDraftRating(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>

        <textarea
          value={draftComment}
          onChange={(e) => setDraftComment(e.target.value)}
        />

        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">保存</button>
        <button type="button" onClick={cancelEdit} className="bg-red-500 text-white px-4 py-2 rounded-md">
          キャンセル
        </button>
      </form>
    );
  }

  return (
    <article>
      <button type="button" onClick={startEdit}>
        編集
      </button>
    </article>
  );
}