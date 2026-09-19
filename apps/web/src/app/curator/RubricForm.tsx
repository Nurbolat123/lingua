"use client";

import { useState } from "react";
import type { SpeakingRubric } from "@/lib/types";

const RUBRIC_FIELDS: { key: keyof SpeakingRubric; label: string }[] = [
  { key: "vocabulary", label: "Словарный запас" },
  { key: "grammar", label: "Грамматика" },
  { key: "fluency", label: "Беглость речи" },
  { key: "pronunciation", label: "Произношение" },
];

export function RubricForm({
  onSubmit,
  submitLabel = "Сохранить оценку",
}: {
  onSubmit: (rubric: SpeakingRubric, comment: string) => Promise<void>;
  submitLabel?: string;
}) {
  const [rubric, setRubric] = useState<SpeakingRubric>({ vocabulary: 3, grammar: 3, fluency: 3, pronunciation: 3 });
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    try {
      await onSubmit(rubric, comment.trim());
    } catch {
      setError("Не удалось сохранить оценку. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {RUBRIC_FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <label htmlFor={`rubric-${key}`} className="text-[15px] font-semibold">
            {label}
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRubric((r) => ({ ...r, [key]: v }))}
                className={`h-9 w-9 rounded-full text-[14px] font-semibold ${
                  rubric[key] === v ? "bg-ink text-paper" : "border border-line text-ink"
                }`}
                aria-pressed={rubric[key] === v}
                id={v === 1 ? `rubric-${key}` : undefined}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <label htmlFor="review-comment" className="mb-1.5 block text-[14px] font-semibold">
          Комментарий
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px]"
          placeholder="Что получилось хорошо, над чем поработать…"
        />
      </div>

      {error && <p className="text-[14px] font-semibold text-error">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="h-[48px] rounded-2xl bg-ink text-[15px] font-semibold text-paper disabled:opacity-40"
      >
        {pending ? "Сохраняем…" : submitLabel}
      </button>
    </div>
  );
}
