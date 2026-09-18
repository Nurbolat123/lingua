"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteWord, updateWord, type ActionState } from "./actions";
import type { VocabularyWord } from "@/lib/types";

const initial: ActionState = { error: null };

export function WordRow({ word }: { word: VocabularyWord }) {
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const action = updateWord.bind(null, word.id);
  const [state, formAction, pending] = useActionState(action, initial);

  if (editing) {
    return (
      <tr className="border-b border-line last:border-0">
        <td colSpan={5} className="px-4 py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-2">
            <strong className="text-[14px]">{word.word}</strong>
            <input name="translationRu" defaultValue={word.translationRu} className="h-[36px] w-[140px] rounded-lg border border-line px-2 text-[13px]" />
            <input name="translationKk" defaultValue={word.translationKk ?? ""} placeholder="kk" className="h-[36px] w-[120px] rounded-lg border border-line px-2 text-[13px]" />
            <input name="transcription" defaultValue={word.transcription ?? ""} placeholder="транскрипция" className="h-[36px] w-[120px] rounded-lg border border-line px-2 text-[13px]" />
            <input name="definition" defaultValue={word.definition ?? ""} placeholder="definition" className="h-[36px] w-[200px] rounded-lg border border-line px-2 text-[13px]" />
            <input name="examples" defaultValue={word.examples.join("\n")} placeholder="примеры" className="h-[36px] w-[200px] rounded-lg border border-line px-2 text-[13px]" />
            <button type="submit" disabled={pending} className="h-[36px] rounded-full bg-blue px-4 text-[13px] font-semibold text-white disabled:opacity-60">
              {pending ? "…" : "Сохранить"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-[13px] text-muted">
              Отмена
            </button>
            {state.error && <span className="text-[13px] font-semibold text-error">{state.error}</span>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-2 font-medium">{word.word}</td>
      <td className="px-4 py-2 text-muted">{word.translationRu}</td>
      <td className="px-4 py-2 text-muted">{word.level}</td>
      <td className="px-4 py-2 text-muted">{word.isDemo ? "демо" : ""}</td>
      <td className="px-4 py-2 text-right">
        <button type="button" onClick={() => setEditing(true)} className="mr-3 text-[13px] font-semibold text-blue">
          Изменить
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => startDelete(() => deleteWord(word.id))}
          className="text-[13px] font-semibold text-error disabled:opacity-60"
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}
