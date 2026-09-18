"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteExercise, updateExercise, type ActionState } from "../../actions";
import type { Exercise } from "@/lib/types";

const initial: ActionState = { error: null };

export function ExerciseCard({ lessonId, exercise }: { lessonId: string; exercise: Exercise }) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const action = updateExercise.bind(null, lessonId, exercise.id);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] font-semibold uppercase text-ink-2">
          {exercise.type}
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-[12px] font-semibold text-blue">
            {editing ? "Отмена" : "Редактировать"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!window.confirm("Удалить упражнение?")) return;
              startDelete(() => deleteExercise(lessonId, exercise.id));
            }}
            className="text-[12px] font-semibold text-error disabled:opacity-60"
          >
            Удалить
          </button>
        </div>
      </div>

      {editing ? (
        <form action={formAction} className="mt-2 flex flex-col gap-2">
          <textarea
            name="content"
            rows={5}
            defaultValue={JSON.stringify(exercise.content, null, 2)}
            className="rounded-lg border border-line px-3 py-2 font-mono text-[12px]"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-[34px] self-start rounded-full bg-blue px-4 text-[12px] font-semibold text-white hover:bg-blue-dark disabled:opacity-60"
          >
            {pending ? "Сохраняем…" : "Сохранить"}
          </button>
          {state.error && <p className="text-[12px] font-semibold text-error">{state.error}</p>}
        </form>
      ) : (
        <pre className="mt-2 overflow-x-auto text-[12px] text-ink-2">{JSON.stringify(exercise.content, null, 2)}</pre>
      )}
    </div>
  );
}
