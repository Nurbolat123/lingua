"use client";

import { useActionState, useState } from "react";
import { createBlock, type ActionState } from "../../actions";
import { BLOCK_CONTENT_EXAMPLES } from "../../contentExamples";
import type { LessonBlockType } from "@/lib/types";

const initial: ActionState = { error: null };
const TYPES: LessonBlockType[] = [
  "INTRO", "VOCABULARY", "GRAMMAR", "READING", "LISTENING", "EXERCISE", "SPEAKING", "MINI_TEST", "HOMEWORK",
];

export function AddBlockForm({ lessonId, nextOrder }: { lessonId: string; nextOrder: number }) {
  const action = createBlock.bind(null, lessonId);
  const [state, formAction, pending] = useActionState(action, initial);
  const [type, setType] = useState<LessonBlockType>("INTRO");

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[16px] font-semibold">Добавить блок</p>
      <form action={formAction} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="order" value={nextOrder} />
        <div className="flex flex-wrap gap-3">
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as LessonBlockType)}
            className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            name="title"
            type="text"
            placeholder="Заголовок блока (необязательно)"
            className="h-[42px] w-[260px] rounded-lg border border-line px-3 text-[14px]"
          />
        </div>
        <textarea
          name="content"
          rows={4}
          defaultValue="{}"
          key={type}
          placeholder={BLOCK_CONTENT_EXAMPLES[type]}
          className="rounded-lg border border-line px-3 py-2 font-mono text-[13px]"
        />
        <p className="text-[12px] text-muted">
          Пример для {type}: <code>{BLOCK_CONTENT_EXAMPLES[type]}</code>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="h-[42px] self-start rounded-full border border-ink px-5 text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-60"
        >
          {pending ? "Добавляем…" : "Добавить блок"}
        </button>
        {state.error && <p className="text-[13px] font-semibold text-error">{state.error}</p>}
      </form>
    </div>
  );
}
