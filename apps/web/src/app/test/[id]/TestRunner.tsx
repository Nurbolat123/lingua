"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlacementAttemptState, PlacementNextQuestion, Skill } from "@/lib/types";
import { getNextQuestion, submitPlacementAnswer } from "../actions";
import { QuestionRenderer } from "./QuestionRenderer";
import { SpeakingRecorder } from "./SpeakingRecorder";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

export function TestRunner({
  attemptId,
  initialState,
}: {
  attemptId: string;
  initialState: PlacementAttemptState;
}) {
  const router = useRouter();
  const [next, setNext] = useState<PlacementNextQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyNext = useCallback(
    (res: PlacementNextQuestion | null) => {
      if (!res) {
        setError("Не удалось загрузить вопрос. Проверьте соединение и попробуйте ещё раз.");
        setLoading(false);
        return;
      }
      setNext(res);
      setError(null);
      setLoading(false);
      if (res.completed) router.refresh();
    },
    [router],
  );

  const loadNext = useCallback(async () => {
    applyNext(await getNextQuestion(attemptId).catch(() => null));
  }, [attemptId, applyNext]);

  useEffect(() => {
    // Загрузка при монтировании определена прямо в эффекте (не через loadNext) —
    // так React видит, что setState вызывается уже после await, а не синхронно.
    let ignore = false;
    getNextQuestion(attemptId)
      .catch(() => null)
      .then((res) => {
        if (!ignore) applyNext(res);
      });
    return () => {
      ignore = true;
    };
  }, [attemptId, applyNext]);

  async function handleAnswer(answer: unknown) {
    if (!next?.question) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitPlacementAnswer(attemptId, next.question.id, answer);
      if (res.attemptCompleted) {
        router.refresh();
        return;
      }
      await loadNext();
    } catch {
      setError("Не удалось отправить ответ. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSpeakingDone(attemptCompleted: boolean) {
    if (attemptCompleted) router.refresh();
    else loadNext();
  }

  const progress = next?.progress;
  const totalSkills = progress?.totalSkills ?? (initialState.includeSpeaking ? 5 : 4);
  const skillIndexForBar = !progress ? 0 : progress.skill === "SPEAKING" ? totalSkills - 1 : progress.skillIndex;
  const fraction = progress ? (skillIndexForBar + progress.answered / progress.total) / totalSkills : 0;

  return (
    <main className="min-h-screen bg-paper px-5 py-10">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div>
          <div className="flex items-center justify-between text-[14px] font-semibold text-muted">
            <span>{progress ? SKILL_LABELS[progress.skill] : "Загрузка…"}</span>
            {progress && progress.skill === "SPEAKING" ? (
              <span>
                Вопрос {progress.answered + 1} / {progress.total}
              </span>
            ) : (
              progress && (
                <span>
                  {skillIndexForBar + 1} / {totalSkills}
                </span>
              )
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
            <span
              className="block h-full rounded-full bg-blue transition-[width]"
              style={{ width: `${Math.min(100, fraction * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-card p-7">
          {loading && !next?.question ? (
            <p className="text-muted">Загружаем вопрос…</p>
          ) : next?.question?.type === "SPEAKING" ? (
            <SpeakingRecorder attemptId={attemptId} question={next.question} onDone={handleSpeakingDone} />
          ) : next?.question ? (
            <QuestionRenderer
              key={next.question.id}
              question={next.question}
              submitting={submitting}
              onSubmit={handleAnswer}
            />
          ) : null}
        </div>

        {error && <p className="text-[14px] font-semibold text-error">{error}</p>}
      </div>
    </main>
  );
}
