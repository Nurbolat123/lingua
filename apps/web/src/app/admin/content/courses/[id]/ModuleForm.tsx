"use client";

import { useActionState } from "react";
import { createModule, type ActionState } from "../../actions";

const initial: ActionState = { error: null };

export function ModuleForm({ courseId }: { courseId: string }) {
  const action = createModule.bind(null, courseId);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="moduleTitle" className="text-sm font-semibold">
          Новый модуль
        </label>
        <input
          id="moduleTitle"
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder="Например: Работа и карьера"
          className="h-[44px] w-[280px] rounded-xl border border-line px-3 text-[15px] focus:border-blue focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-[44px] rounded-full border border-ink px-5 text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-60"
      >
        {pending ? "Добавляем…" : "Добавить модуль"}
      </button>
      {state.error && <span className="text-[14px] font-semibold text-error">{state.error}</span>}
    </form>
  );
}
