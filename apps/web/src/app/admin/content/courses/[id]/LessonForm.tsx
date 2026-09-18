"use client";

import { useActionState } from "react";
import { createLesson, type ActionState } from "../../actions";

const initial: ActionState = { error: null };

export function LessonForm({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const action = createLesson.bind(null, courseId, moduleId);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input
        name="title"
        type="text"
        required
        maxLength={200}
        placeholder="Название урока"
        className="h-[40px] w-[220px] rounded-lg border border-line px-3 text-[14px] focus:border-blue focus:outline-none"
      />
      <input
        name="estimatedMinutes"
        type="number"
        min={1}
        max={180}
        defaultValue={20}
        title="Минут на урок"
        className="h-[40px] w-[70px] rounded-lg border border-line px-2 text-[14px] focus:border-blue focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-[40px] rounded-lg border border-ink px-4 text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-60"
      >
        {pending ? "…" : "Добавить урок"}
      </button>
      {state.error && <span className="text-[13px] font-semibold text-error">{state.error}</span>}
    </form>
  );
}
