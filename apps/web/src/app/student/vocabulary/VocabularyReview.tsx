"use client";

import Link from "next/link";
import { useState } from "react";
import type { DueVocabularyWord } from "@/lib/types";
import { reviewVocabulary } from "../learning-actions";

export function VocabularyReview({ initialWords }: { initialWords: DueVocabularyWord[] }) {
  const [words, setWords] = useState(initialWords);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const current = words[0];

  async function handleAnswer(remembered: boolean) {
    if (!current) return;
    setSubmitting(true);
    try {
      await reviewVocabulary(current.id, remembered ? 4 : 1);
      setWords((w) => w.slice(1));
      setRevealed(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center">
        <p className="text-[17px] font-semibold">Слов для повторения пока нет</p>
        <p className="mt-2 text-muted">Новые слова появятся здесь после уроков со словарным блоком.</p>
        <Link href="/student" className="mt-5 inline-block text-[15px] font-semibold text-blue">
          ← В кабинет
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-muted">Осталось слов: {words.length}</p>
      <div className="rounded-2xl border border-line bg-card p-8 text-center">
        <p className="display text-[32px]">{current.word}</p>
        {current.transcription && <p className="mt-1 text-muted">{current.transcription}</p>}

        {revealed ? (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-[20px] font-semibold">{current.translationRu}</p>
            {current.example && <p className="text-[15px] italic text-muted">{current.example}</p>}
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAnswer(false)}
                className="h-[48px] flex-1 rounded-2xl border border-ink text-[15px] font-semibold text-ink disabled:opacity-40"
              >
                Не помню
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAnswer(true)}
                className="h-[48px] flex-1 rounded-2xl bg-ink text-[15px] font-semibold text-paper disabled:opacity-40"
              >
                Помню
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-6 h-[48px] rounded-2xl bg-ink px-6 text-[15px] font-semibold text-paper"
          >
            Показать перевод
          </button>
        )}
      </div>
    </div>
  );
}
