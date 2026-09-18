"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import type { ExerciseType, ImportResult, QuestionBankItem, QuestionLevel, Skill } from "@/lib/types";

export interface ActionState {
  error: string | null;
}

const ok: ActionState = { error: null };

export async function createQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const contentRaw = String(formData.get("content") || "{}");
  let content: Record<string, unknown>;
  try {
    content = JSON.parse(contentRaw);
  } catch {
    return { error: "Содержимое должно быть корректным JSON" };
  }
  try {
    await apiFetch<QuestionBankItem>("/admin/content/questions", {
      method: "POST",
      body: JSON.stringify({
        skill: formData.get("skill") as Skill,
        level: formData.get("level") as QuestionLevel,
        difficulty: Number(formData.get("difficulty") || 1),
        type: formData.get("type") as ExerciseType,
        content,
      }),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось сохранить вопрос" };
  }
  revalidatePath("/admin/content/questions");
  return ok;
}

export async function deleteQuestion(id: string) {
  await apiFetch(`/admin/content/questions/${id}`, { method: "DELETE" });
  revalidatePath("/admin/content/questions");
}

export async function importQuestions(csv: string): Promise<ImportResult> {
  const result = await apiFetch<ImportResult>("/admin/content/questions/import", {
    method: "POST",
    body: JSON.stringify({ csv }),
  });
  revalidatePath("/admin/content/questions");
  return result;
}
