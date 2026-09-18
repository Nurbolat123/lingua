"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteBlock, updateBlock, type ActionState } from "../../actions";
import type { LessonBlock, Exercise } from "@/lib/types";
import { AddExerciseForm } from "./AddExerciseForm";
import { ExerciseCard } from "./ExerciseCard";

const initial: ActionState = { error: null };

export function BlockCard({
  lessonId,
  block,
}: {
  lessonId: string;
  block: LessonBlock & { exercises: Exercise[] };
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const action = updateBlock.bind(null, lessonId, block.id);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-paper">{block.type}</span>
          <span className="text-[15px] font-semibold">{block.title || "без заголовка"}</span>
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-[13px] font-semibold text-blue">
            {editing ? "Отмена" : "Редактировать"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!window.confirm("Удалить блок вместе с упражнениями?")) return;
              startDelete(() => deleteBlock(lessonId, block.id));
            }}
            className="text-[13px] font-semibold text-error disabled:opacity-60"
          >
            Удалить блок
          </button>
        </div>
      </div>

      {editing ? (
        <form action={formAction} className="mt-3 flex flex-col gap-2">
          <input
            name="title"
            type="text"
            defaultValue={block.title ?? ""}
            placeholder="Заголовок"
            className="h-[38px] rounded-lg border border-line px-3 text-[14px]"
          />
          <textarea
            name="content"
            rows={5}
            defaultValue={JSON.stringify(block.content, null, 2)}
            className="rounded-lg border border-line px-3 py-2 font-mono text-[12px]"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-[36px] self-start rounded-full bg-blue px-4 text-[13px] font-semibold text-white hover:bg-blue-dark disabled:opacity-60"
          >
            {pending ? "Сохраняем…" : "Сохранить"}
          </button>
          {state.error && <p className="text-[13px] font-semibold text-error">{state.error}</p>}
        </form>
      ) : (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-paper px-3 py-2 text-[12px] text-ink-2">
          {JSON.stringify(block.content, null, 2)}
        </pre>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {block.exercises.map((ex) => (
          <ExerciseCard key={ex.id} lessonId={lessonId} exercise={ex} />
        ))}
        <AddExerciseForm lessonId={lessonId} blockId={block.id} nextOrder={block.exercises.length} />
      </div>
    </div>
  );
}
