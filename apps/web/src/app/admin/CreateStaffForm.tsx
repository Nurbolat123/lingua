"use client";

import { useActionState } from "react";
import { createStaff, type CreateStaffState } from "./actions";

const initialState: CreateStaffState = { error: null };

export function CreateStaffForm() {
  const [state, formAction, pending] = useActionState(createStaff, initialState);

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[17px] font-semibold">Создать куратора или администратора</p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="staffFirstName" className="text-sm font-semibold">
            Имя
          </label>
          <input
            id="staffFirstName"
            name="firstName"
            type="text"
            required
            maxLength={80}
            className="h-[46px] w-[160px] rounded-xl border border-line px-3 text-[15px] focus:border-blue focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="staffLastName" className="text-sm font-semibold">
            Фамилия
          </label>
          <input
            id="staffLastName"
            name="lastName"
            type="text"
            maxLength={80}
            className="h-[46px] w-[160px] rounded-xl border border-line px-3 text-[15px] focus:border-blue focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="staffEmail" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="staffEmail"
            name="email"
            type="email"
            required
            maxLength={254}
            className="h-[46px] w-[200px] rounded-xl border border-line px-3 text-[15px] focus:border-blue focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="staffPassword" className="text-sm font-semibold">
            Пароль
          </label>
          <input
            id="staffPassword"
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={72}
            className="h-[46px] w-[160px] rounded-xl border border-line px-3 text-[15px] focus:border-blue focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="staffRole" className="text-sm font-semibold">
            Роль
          </label>
          <select
            id="staffRole"
            name="role"
            defaultValue="CURATOR"
            className="h-[46px] rounded-xl border border-line bg-white px-3 text-[15px] focus:border-blue focus:outline-none"
          >
            <option value="CURATOR">Куратор</option>
            <option value="ADMIN">Администратор</option>
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
      <p className="mt-2 text-[13px] text-muted">Пароль — минимум 12 символов.</p>
      {state.error && <p className="mt-3 text-[15px] font-semibold text-error">{state.error}</p>}
    </div>
  );
}
