"use client";

import { useActionState, useState } from "react";
import { createExercise, type ActionState } from "../../actions";
import { EXERCISE_CONTENT_EXAMPLES } from "../../contentExamples";
import type { ExerciseType } from "@/lib/types";

const initial: ActionState = { error: null };
const TYPES: ExerciseType[] = ["MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING", "ORDERING", "FREE_RESPONSE", "SPEAKING"];

export function AddExerciseForm({
  lessonId,
  blockId,
  nextOrder,
}: {
  lessonId: string;
  blockId: string;
  nextOrder: number;
}) {
  const action = createExercise.bind(null, lessonId, blockId);
  const [state, formAction, pending] = useActionState(action, initial);
  const [type, setType] = useState<ExerciseType>("MULTIPLE_CHOICE");

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-dashed border-line p-4">
      <input type="hidden" name="order" value={nextOrder} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold">Добавить упражнение:</span>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as ExerciseType)}
          className="h-[36px] rounded-lg border border-line bg-white px-2 text-[13px]"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="content"
        rows={4}
        key={type}
        defaultValue={EXERCISE_CONTENT_EXAMPLES[type]}
        className="rounded-lg border border-line px-3 py-2 font-mono text-[12px]"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-[36px] self-start rounded-full border border-ink px-4 text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-60"
      >
        {pending ? "…" : "Добавить"}
      </button>
      {state.error && <p className="text-[13px] font-semibold text-error">{state.error}</p>}
    </form>
  );
}
