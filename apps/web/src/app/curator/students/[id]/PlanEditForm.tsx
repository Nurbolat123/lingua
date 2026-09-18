"use client";

import { useActionState } from "react";
import { updateStudentPlan, type PlanFormState } from "../../curator-actions";
import type { CefrTarget } from "@/lib/types";

const CEFR_TARGETS: CefrTarget[] = ["A1", "A2", "B1", "B2", "C1"];

const initialState: PlanFormState = { error: null };

export function PlanEditForm({ studentId, targetLevel, goal }: { studentId: string; targetLevel: CefrTarget | null; goal: string | null }) {
  const [state, formAction, pending] = useActionState(updateStudentPlan.bind(null, studentId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="targetLevel" className="text-[14px] font-semibold">
          Целевой уровень
        </label>
        <select
          id="targetLevel"
          name="targetLevel"
          defaultValue={targetLevel ?? ""}
          className="h-[46px] rounded-2xl border border-line bg-white px-4 text-[15px]"
        >
          <option value="">Не выбран</option>
          {CEFR_TARGETS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="goal" className="text-[14px] font-semibold">
          Цель обучения
        </label>
        <textarea
          id="goal"
          name="goal"
          maxLength={500}
          rows={2}
          defaultValue={goal ?? ""}
          className="rounded-2xl border border-line px-4 py-3 text-[15px]"
        />
      </div>

      {state.error && <p className="text-[14px] font-semibold text-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-[44px] w-fit rounded-2xl bg-blue px-6 text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}
