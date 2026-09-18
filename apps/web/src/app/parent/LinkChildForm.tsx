"use client";

import { useActionState } from "react";
import { linkChild, type LinkChildState } from "./actions";

const initialState: LinkChildState = { error: null };

export function LinkChildForm() {
  const [state, formAction, pending] = useActionState(linkChild, initialState);

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[17px] font-semibold">Привязать ребёнка</p>
      <p className="mt-2 text-muted">
        Введите 8-символьный код, который ребёнок получил в своём кабинете.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="code" className="text-sm font-semibold">
            Код
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            maxLength={8}
            autoCapitalize="characters"
            placeholder="ABCD1234"
            className="h-[50px] w-[200px] rounded-2xl border border-line px-4 text-[18px] uppercase tracking-[0.15em] focus:border-blue focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-[50px] rounded-full bg-blue px-8 text-[16px] font-semibold text-white transition-colors hover:bg-blue-dark disabled:opacity-60"
        >
          {pending ? "Проверяем…" : "Привязать"}
        </button>
      </form>
      {state.error && <p className="mt-3 text-[15px] font-semibold text-error">{state.error}</p>}
    </div>
  );
}
