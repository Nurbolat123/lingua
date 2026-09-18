"use client";

import { useActionState, useState } from "react";
import { createQuestion, type ActionState } from "./actions";
import { EXERCISE_CONTENT_EXAMPLES } from "../contentExamples";
import type { ExerciseType, QuestionLevel, Skill } from "@/lib/types";

const initial: ActionState = { error: null };
const SKILLS: Skill[] = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "SPEAKING"];
const LEVELS: QuestionLevel[] = ["A1", "A1+", "A2", "A2+", "B1", "B1+", "B2", "B2+", "C1"];
const TYPES: ExerciseType[] = ["MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING", "ORDERING", "FREE_RESPONSE", "SPEAKING"];

export function QuestionForm() {
  const [state, formAction, pending] = useActionState(createQuestion, initial);
  const [type, setType] = useState<ExerciseType>("MULTIPLE_CHOICE");

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[17px] font-semibold">Новый вопрос</p>
      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <select name="skill" defaultValue="GRAMMAR" className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]">
            {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="level" defaultValue="B1" className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]">
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <input name="difficulty" type="number" min={1} max={5} defaultValue={1} title="Сложность 1–5" className="h-[42px] w-[70px] rounded-lg border border-line px-2 text-[14px]" />
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as ExerciseType)}
            className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]"
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <textarea
          name="content"
          rows={5}
          key={type}
          defaultValue={EXERCISE_CONTENT_EXAMPLES[type]}
          className="rounded-lg border border-line px-3 py-2 font-mono text-[13px]"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-[42px] self-start rounded-full bg-blue px-6 text-[14px] font-semibold text-white hover:bg-blue-dark disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Добавить вопрос"}
        </button>
        {state.error && <p className="text-[14px] font-semibold text-error">{state.error}</p>}
      </form>
    </div>
  );
}
