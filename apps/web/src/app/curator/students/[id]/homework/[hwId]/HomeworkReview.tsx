"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getHomeworkListenUrl, reviewHomework } from "../../../../curator-actions";
import { AudioPlayer } from "../../../../AudioPlayer";
import { RubricForm } from "../../../../RubricForm";
import type { Homework, SpeakingRubric } from "@/lib/types";

export function HomeworkReview({ homework, studentId }: { homework: Homework; studentId: string }) {
  const router = useRouter();
  const [returning, setReturning] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [returnPending, setReturnPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReview = homework.status === "SUBMITTED";

  async function handleApprove(rubric: SpeakingRubric, comment: string) {
    await reviewHomework(homework.id, studentId, {
      action: "APPROVE",
      rubric: homework.submissionAudioKey ? rubric : undefined,
      comment: comment || undefined,
    });
    router.push(`/curator/students/${studentId}`);
  }

  async function handleReturn() {
    if (!returnComment.trim()) {
      setError("Напишите, что нужно доработать.");
      return;
    }
    setReturnPending(true);
    setError(null);
    try {
      await reviewHomework(homework.id, studentId, { action: "RETURN", comment: returnComment.trim() });
      router.push(`/curator/students/${studentId}`);
    } catch {
      setError("Не удалось сохранить. Попробуйте ещё раз.");
      setReturnPending(false);
    }
  }

  const hasCardContent = homework.instructions || homework.submissionText || homework.integritySignals;

  return (
    <div className="flex flex-col gap-5">
      {hasCardContent && (
        <div className="rounded-2xl border border-line bg-card p-5">
          {homework.instructions && <p className="mb-3 text-[14px] text-muted">{homework.instructions}</p>}
          {homework.submissionText && (
            <div>
              <p className="text-[13px] font-semibold text-muted">Текстовый ответ</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px]">{homework.submissionText}</p>
            </div>
          )}
          {homework.integritySignals && (
            <div className="mt-4 flex flex-wrap gap-3 text-[13px] text-muted">
              <span>Уходы со вкладки: {homework.integritySignals.tabAwayCount}</span>
              <span>Выходы из полноэкранного режима: {homework.integritySignals.fullscreenExitCount}</span>
              <span>Вставка текста: {homework.integritySignals.pasteDetected ? "да" : "нет"}</span>
            </div>
          )}
        </div>
      )}

      {homework.submissionAudioKey && (
        <AudioPlayer label="Запись голоса" fetchUrl={() => getHomeworkListenUrl(homework.id)} />
      )}

      {!canReview && (
        <p className="text-[15px] text-muted">
          {homework.status === "REVIEWED" ? "Уже проверено." : homework.status === "RETURNED" ? "Возвращено ученику на доработку." : "Ученик ещё не сдал это задание."}
        </p>
      )}

      {canReview && !returning && (
        <div className="flex flex-col gap-4">
          <RubricForm onSubmit={handleApprove} submitLabel="Принять" />
          <button
            type="button"
            onClick={() => setReturning(true)}
            className="h-[44px] rounded-2xl border border-ink text-[14px] font-semibold text-ink"
          >
            Вернуть на доработку
          </button>
        </div>
      )}

      {canReview && returning && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
          <label htmlFor="return-comment" className="text-[14px] font-semibold">
            Что нужно доработать?
          </label>
          <textarea
            id="return-comment"
            value={returnComment}
            onChange={(e) => setReturnComment(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px]"
          />
          {error && <p className="text-[14px] font-semibold text-error">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setReturning(false)}
              className="h-[44px] flex-1 rounded-2xl border border-line text-[14px] font-semibold"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleReturn}
              disabled={returnPending}
              className="h-[44px] flex-1 rounded-2xl bg-ink text-[14px] font-semibold text-paper disabled:opacity-40"
            >
              {returnPending ? "Сохраняем…" : "Вернуть"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
