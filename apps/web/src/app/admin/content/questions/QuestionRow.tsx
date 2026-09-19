"use client";

import { useTransition } from "react";
import { deleteQuestion } from "./actions";
import type { QuestionBankItem } from "@/lib/types";

function preview(content: Record<string, unknown>): string {
  return String(content.question ?? content.prompt ?? content.text ?? JSON.stringify(content)).slice(0, 100);
}

export function QuestionRow({ item }: { item: QuestionBankItem }) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-2">{item.skill}</td>
      <td className="px-4 py-2">{item.level}</td>
      <td className="px-4 py-2">{item.difficulty}</td>
      <td className="px-4 py-2">{item.type}</td>
      <td className="px-4 py-2 text-muted">{preview(item.content)}</td>
      <td className="px-4 py-2 text-right">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Удалить вопрос?")) return;
            startTransition(() => deleteQuestion(item.id));
          }}
          className="text-[13px] font-semibold text-error disabled:opacity-60"
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}
