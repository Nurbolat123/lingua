"use client";

import { useRouter } from "next/navigation";
import { getLessonRecording, reviewLessonSpeaking } from "../../../../curator-actions";
import { AudioPlayer } from "../../../../AudioPlayer";
import { RubricForm } from "../../../../RubricForm";
import type { SpeakingRubric } from "@/lib/types";

export function LessonSpeakingReview({
  answerId,
  studentId,
  alreadyReviewed,
}: {
  answerId: string;
  studentId: string;
  alreadyReviewed: boolean;
}) {
  const router = useRouter();

  async function handleSubmit(rubric: SpeakingRubric, comment: string) {
    await reviewLessonSpeaking(answerId, studentId, { rubric, comment: comment || undefined });
    router.push(`/curator/students/${studentId}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <AudioPlayer label="Запись голоса" fetchUrl={() => getLessonRecording(answerId)} />
      {alreadyReviewed ? (
        <p className="text-[15px] text-muted">Уже проверено.</p>
      ) : (
        <RubricForm onSubmit={handleSubmit} submitLabel="Сохранить оценку" />
      )}
    </div>
  );
}
