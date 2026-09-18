"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getPlacementRecordings, reviewPlacementSpeaking } from "../../../../curator-actions";
import { RubricForm } from "../../../../RubricForm";
import type { PlacementSpeakingRecording, SpeakingRubric } from "@/lib/types";

export function PlacementSpeakingReview({
  attemptId,
  studentId,
  alreadyReviewed,
}: {
  attemptId: string;
  studentId: string;
  alreadyReviewed: boolean;
}) {
  const router = useRouter();
  const [recordings, setRecordings] = useState<PlacementSpeakingRecording[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRecordings() {
    setLoading(true);
    setError(null);
    try {
      setRecordings(await getPlacementRecordings(attemptId));
    } catch {
      setError("Не удалось загрузить записи.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(rubric: SpeakingRubric, comment: string) {
    await reviewPlacementSpeaking(attemptId, studentId, { rubric, comment: comment || undefined });
    router.push(`/curator/students/${studentId}`);
  }

  return (
    <div className="flex flex-col gap-5">
      {!recordings ? (
        <button
          type="button"
          onClick={loadRecordings}
          disabled={loading}
          className="h-[44px] w-fit rounded-2xl border border-ink px-4 text-[14px] font-semibold text-ink disabled:opacity-40"
        >
          {loading ? "Загружаем…" : "Загрузить записи"}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {recordings.map((r) => (
            <div key={r.answerId} className="rounded-2xl border border-line bg-card p-4">
              {r.prompt && <p className="text-[14px] font-semibold">{r.prompt}</p>}
              <audio controls src={r.url} className="mt-2 w-full" />
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-[14px] font-semibold text-error">{error}</p>}

      {alreadyReviewed ? (
        <p className="text-[15px] text-muted">Уже проверено.</p>
      ) : (
        <RubricForm onSubmit={handleSubmit} submitLabel="Сохранить оценку" />
      )}
    </div>
  );
}
