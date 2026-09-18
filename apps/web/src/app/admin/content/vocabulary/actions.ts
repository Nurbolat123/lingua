"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import type { CefrTarget, ImportResult, VocabularyWord } from "@/lib/types";

export interface ActionState {
  error: string | null;
}

const ok: ActionState = { error: null };

export async function createWord(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const examples = String(formData.get("examples") || "").split("\n").map((s) => s.trim()).filter(Boolean);
  try {
    await apiFetch<VocabularyWord>("/admin/content/vocabulary", {
      method: "POST",
      body: JSON.stringify({
        word: formData.get("word"),
        translationRu: formData.get("translationRu"),
        translationKk: formData.get("translationKk") || undefined,
        definition: formData.get("definition") || undefined,
        level: formData.get("level") as CefrTarget,
        transcription: formData.get("transcription") || undefined,
        audioUrl: formData.get("audioUrl") || undefined,
        examples,
      }),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось сохранить слово" };
  }
  revalidatePath("/admin/content/vocabulary");
  return ok;
}

export async function updateWord(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const examples = String(formData.get("examples") || "").split("\n").map((s) => s.trim()).filter(Boolean);
  try {
    await apiFetch(`/admin/content/vocabulary/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        translationRu: formData.get("translationRu"),
        translationKk: formData.get("translationKk") || undefined,
        definition: formData.get("definition") || undefined,
        transcription: formData.get("transcription") || undefined,
        audioUrl: formData.get("audioUrl") || undefined,
        examples,
      }),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось сохранить" };
  }
  revalidatePath("/admin/content/vocabulary");
  return ok;
}

export async function deleteWord(id: string) {
  await apiFetch(`/admin/content/vocabulary/${id}`, { method: "DELETE" });
  revalidatePath("/admin/content/vocabulary");
}

export async function importWords(csv: string): Promise<ImportResult> {
  const result = await apiFetch<ImportResult>("/admin/content/vocabulary/import", {
    method: "POST",
    body: JSON.stringify({ csv }),
  });
  revalidatePath("/admin/content/vocabulary");
  return result;
}
