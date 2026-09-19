"use client";

import { useActionState } from "react";
import { assignHomework, type AssignHomeworkState } from "../../curator-actions";

const initialState: AssignHomeworkState = { error: null };

export function AssignHomeworkForm({ studentId }: { studentId: string }) {
  const [state, formAction, pending] = useActionState(assignHomework.bind(null, studentId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="hw-title" className="text-[14px] font-semibold">
          Название
        </label>
        <input
          id="hw-title"
          name="title"
          required
          maxLength={200}
          className="h-[46px] rounded-2xl border border-line px-4 text-[15px]"
          placeholder="Например: Написать письмо другу"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="hw-instructions" className="text-[14px] font-semibold">
          Инструкции (необязательно)
        </label>
        <textarea
          id="hw-instructions"
          name="instructions"
          maxLength={4000}
          rows={3}
          className="rounded-2xl border border-line px-4 py-3 text-[15px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="hw-due" className="text-[14px] font-semibold">
            Срок (необязательно)
          </label>
          <input id="hw-due" name="dueAt" type="date" className="h-[44px] rounded-2xl border border-line px-3 text-[14px]" />
        </div>
        <label className="mt-6 flex items-center gap-2 text-[14px]">
          <input type="checkbox" name="requiresIntegrityCheck" />
          Контроль самостоятельности
        </label>
      </div>

      {state.error && <p className="text-[14px] font-semibold text-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-[44px] w-fit rounded-2xl bg-ink px-6 text-[14px] font-semibold text-paper disabled:opacity-40"
      >
        {pending ? "Назначаем…" : "Назначить задание"}
      </button>
    </form>
  );
}
