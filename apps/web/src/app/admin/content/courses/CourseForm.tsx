"use client";

import { useActionState } from "react";
import { createCourse, type ActionState } from "../actions";

const initial: ActionState = { error: null };

export function CourseForm() {
  const [state, formAction, pending] = useActionState(createCourse, initial);

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[17px] font-semibold">Новый курс</p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="courseTitle" className="text-sm font-semibold">
            Название
          </label>
          <input
            id="courseTitle"
            name="title"
            type="text"
            required
            maxLength={200}
            className="h-[46px] w-[260px] rounded-xl border border-line px-3 text-[15px] focus:border-blue focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="courseLevel" className="text-sm font-semibold">
            Уровень
          </label>
          <select
            id="courseLevel"
            name="level"
            defaultValue="B1"
            className="h-[46px] rounded-xl border border-line bg-white px-3 text-[15px] focus:border-blue focus:outline-none"
          >
            {["A1", "A2", "B1", "B2", "C1"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="courseAudience" className="text-sm font-semibold">
            Для кого
          </label>
          <select
            id="courseAudience"
            name="audience"
            defaultValue="ADULTS"
            className="h-[46px] rounded-xl border border-line bg-white px-3 text-[15px] focus:border-blue focus:outline-none"
          >
            <option value="KIDS">Дети</option>
            <option value="TEENS">Подростки</option>
            <option value="ADULTS">Взрослые</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-[46px] rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors hover:bg-blue-dark disabled:opacity-60"
        >
          {pending ? "Создаём…" : "Создать"}
        </button>
      </form>
      {state.error && <p className="mt-3 text-[15px] font-semibold text-error">{state.error}</p>}
    </div>
  );
}
