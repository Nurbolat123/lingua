"use client";

import { useState } from "react";
import { QuestionRenderer } from "@/components/QuestionRenderer";
import type { PracticeQuestion, Skill, SubmitAnswerResult } from "@/lib/types";
import { submitPracticeAnswer } from "./learning-actions";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

export function PracticeTaskCard({ question }: { question: PracticeQuestion }) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitAnswerResult | null>(null);

  async function handleSubmit(answer: unknown) {
    setSubmitting(true);
    try {
      setResult(await submitPracticeAnswer(question.id, answer));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl bg-paper-2 p-4">
      <p className="mb-3 text-[14px] font-semibold text-muted">Задание дня · {SKILL_LABELS[question.skill]}</p>
      {result ? (
        <div className={`rounded-xl border p-3 ${result.isCorrect === false ? "border-error/30 bg-error/5" : "border-line bg-lime/20"}`}>
          <p className="text-[14px] font-semibold">{result.isCorrect ? "Верно!" : "Неверно"}</p>
          {result.explanation && <p className="mt-1 text-[13px] text-muted">{result.explanation}</p>}
        </div>
      ) : (
        <QuestionRenderer question={question} submitting={submitting} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
