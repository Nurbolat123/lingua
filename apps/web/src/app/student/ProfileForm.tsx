"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "./actions";
import type { StudentProfile } from "@/lib/types";

const CEFR_TARGETS = ["A1", "A2", "B1", "B2", "C1"] as const;

const initialState: ProfileFormState = { error: null };

export function ProfileForm({ profile }: { profile: StudentProfile }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="targetLevel" className="text-sm font-semibold">
          Целевой уровень
        </label>
        <select
          id="targetLevel"
          name="targetLevel"
          defaultValue={profile.targetLevel ?? ""}
          className="h-[50px] rounded-2xl border border-line bg-white px-4 text-[16px] focus:border-blue focus:outline-none"
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
        <label htmlFor="dailyMinutes" className="text-sm font-semibold">
          Минут занятий в день
        </label>
        <input
          id="dailyMinutes"
          name="dailyMinutes"
          type="number"
          min={5}
          max={180}
          defaultValue={profile.dailyMinutes}
          className="h-[50px] w-[140px] rounded-2xl border border-line px-4 text-[16px] focus:border-blue focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="goal" className="text-sm font-semibold">
          Цель обучения
        </label>
        <textarea
          id="goal"
          name="goal"
          maxLength={300}
          rows={3}
          defaultValue={profile.goal ?? ""}
          placeholder="Например: подготовка к экзамену, работа, переезд"
          className="rounded-2xl border border-line px-4 py-3 text-[16px] focus:border-blue focus:outline-none"
        />
      </div>

      {state.error && <p className="text-[15px] font-semibold text-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-[50px] self-start rounded-full bg-blue px-8 text-[16px] font-semibold text-white transition-colors hover:bg-blue-dark disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}
