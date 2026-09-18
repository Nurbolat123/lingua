"use client";

import { useActionState } from "react";
import { createWord, type ActionState } from "./actions";

const initial: ActionState = { error: null };

export function VocabularyForm() {
  const [state, formAction, pending] = useActionState(createWord, initial);

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[17px] font-semibold">Новое слово</p>
      <form action={formAction} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input name="word" placeholder="Слово" required maxLength={100} className="h-[42px] rounded-lg border border-line px-3 text-[14px]" />
        <input name="translationRu" placeholder="Перевод (ru)" required maxLength={300} className="h-[42px] rounded-lg border border-line px-3 text-[14px]" />
        <input name="translationKk" placeholder="Перевод (kk)" maxLength={300} className="h-[42px] rounded-lg border border-line px-3 text-[14px]" />
        <input name="transcription" placeholder="Транскрипция" maxLength={100} className="h-[42px] rounded-lg border border-line px-3 text-[14px]" />
        <select name="level" defaultValue="B1" className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]">
          {["A1", "A2", "B1", "B2", "C1"].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <input name="definition" placeholder="Определение (en)" maxLength={1000} className="h-[42px] rounded-lg border border-line px-3 text-[14px] sm:col-span-2 lg:col-span-3" />
        <textarea name="examples" placeholder={"Примеры, по одному на строку"} rows={2} className="rounded-lg border border-line px-3 py-2 text-[14px] sm:col-span-2 lg:col-span-3" />
        <button type="submit" disabled={pending} className="h-[42px] rounded-full bg-blue px-6 text-[14px] font-semibold text-white hover:bg-blue-dark disabled:opacity-60 sm:col-span-2 lg:col-span-1">
          {pending ? "Сохраняем…" : "Добавить слово"}
        </button>
      </form>
      {state.error && <p className="mt-3 text-[14px] font-semibold text-error">{state.error}</p>}
    </div>
  );
}
