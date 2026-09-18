"use client";

import { useState } from "react";
import type { ExerciseItem, SubmitAnswerResult } from "@/lib/types";
import { FillBlankInput, MatchingInput, MultipleChoiceInput, OrderingInput } from "./QuestionRenderer";

/** Упражнение внутри блока урока: проверка на сервере + объяснение ошибки, без автоперехода дальше. */
export function ExerciseCard({
  exercise,
  initialAnswer,
  onSubmit,
}: {
  exercise: ExerciseItem;
  initialAnswer?: { isCorrect: boolean | null } | null;
  onSubmit: (answer: unknown) => Promise<SubmitAnswerResult>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitAnswerResult | null>(
    initialAnswer && initialAnswer.isCorrect !== null ? { isCorrect: initialAnswer.isCorrect, explanation: null } : null,
  );

  async function handleSubmit(answer: unknown) {
    setSubmitting(true);
    try {
      setResult(await onSubmit(answer));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div
        className={`rounded-2xl border p-4 ${
          result.isCorrect === false ? "border-error/30 bg-error/5" : "border-line bg-lime/20"
        }`}
      >
        <p className="text-[15px] font-semibold">
          {result.isCorrect === null ? "Ответ принят" : result.isCorrect ? "Верно!" : "Неверно"}
        </p>
        {result.explanation && <p className="mt-1 text-[14px] text-muted">{result.explanation}</p>}
      </div>
    );
  }

  const content = exercise.content;
  switch (exercise.type) {
    case "MULTIPLE_CHOICE":
      return <MultipleChoiceInput content={content} submitting={submitting} onSubmit={handleSubmit} />;
    case "FILL_BLANK":
      return <FillBlankInput content={content} submitting={submitting} onSubmit={handleSubmit} />;
    case "MATCHING":
      return <MatchingInput content={content} submitting={submitting} onSubmit={handleSubmit} />;
    case "ORDERING":
      return <OrderingInput content={content} submitting={submitting} onSubmit={handleSubmit} />;
    default:
      return <p className="text-muted">Этот тип упражнения пока не поддерживается.</p>;
  }
}
